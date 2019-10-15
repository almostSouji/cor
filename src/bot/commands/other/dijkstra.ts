import { Command } from 'discord-akairo';
import { Message, Collection, MessageAttachment } from 'discord.js';
import { CorEmbed } from '../../structures/CorEmbed';
import { COMMANDS, MESSAGES } from '../../util/constants';

export interface LooseVector {
	src: string; dest: string; cost: number;
}

class Vector {
	public node: Node;
	public cost: number;
	public constructor(node: Node, cost: number) {
		this.node = node;
		this.cost = cost;
	}
}

class Node {
	public vertices: Collection<string, Vector>;
	public prev: Collection <string, Node>;
	public costs: Collection <string, number>;
	public id: string;
	public constructor(id: string) {
		this.vertices = new Collection();
		this.prev = new Collection();
		this.costs = new Collection();
		this.id = id;
		const vec = new Vector(this, 0);
		this.vertices.set(this.id, vec);
		this.costs.set(this.id, 0);
		this.prev.set(this.id, this);
	}

	public isNeighbor(id: string): boolean {
		return Boolean(this.vertices.get(id));
	}

	public getCost(id: string): number {
		const vert = this.vertices.get(id);
		return this.costs.get(id) || (vert ? vert.cost : Infinity);
	}

	public getPrev(id: string): Node {
		return this.prev.get(id) || this;
	}
}

class DijsktraCommand extends Command {
	private constructor() {
		super('dijkstra', {
			aliases: ['dijkstra', 'routing-d', 'linkstate'],
			description: {
				content: 'Apply dijkstra algorithm to the provided vectors (vectors need to be provided in the format `sourcename-destname-cost` for example `a-b-10)` represents a path from `a` to `b` that costs `10` to traverse, `--verbose` to include the computation table in the response)',
				usage: '<...sourcename-destname-cost> [--verbose]'
			},
			cooldown: 5000,
			ratelimit: 2,
			clientPermissions: ['ATTACH_FILES', 'EMBED_LINKS'],
			args: [
				{
					id: 'vectors',
					match: 'separate',
					type: 'dijkstraVector'
				},
				{
					id: 'verbose',
					match: 'flag',
					flag: ['--verbose', '-v']
				}
			]
		});
	}

	public async exec(message: Message, { vectors, verbose }: {vectors: LooseVector[]; verbose: boolean}): Promise<Message | Message[]> {
		const states: string[] = [];
		const invalidVectors = vectors.filter(vector => !vector.src || !vector.dest || isNaN(vector.cost));
		if (invalidVectors.length) {
			return message.util!.send(MESSAGES.COMMANDS.DIJKSTRA.ERRORS.INVALID_VECTORS(invalidVectors));
		}
		if (!vectors.length) {
			return message.util!.send(MESSAGES.COMMANDS.DIJKSTRA.ERRORS.NO_VECTORS);
		}
		if (vectors.length < 3) {
			return message.util!.send(MESSAGES.COMMANDS.DIJKSTRA.ERRORS.TOO_FEW_VECTORS);
		}

		const known: Collection <string, Node> = new Collection();
		const nodes: Collection<string, Node> = new Collection();
		const validVectors = vectors.filter(v => v);
		const uniqueNodes = new Set(vectors.map(v => v.src).concat(vectors.map(v => v.dest)));

		function pushState(source: Node): void {
			function getState(): string {
				return nodes.map(n => {
					const prev = source.getPrev(n.id);
					return `${source.id}:${n.id} ${source.getCost(n.id)}/${prev.id}`;
				}).join(' ');
			}
			states.push(`N': ${known.keyArray().join()}`);
			states.push(getState());
		}

		for (const name of uniqueNodes) {
			const n = new Node(name);
			nodes.set(name, n);
		}

		for (const vector of validVectors) {
			const vec = new Vector(nodes.get(vector.dest)!, vector.cost);
			const n = nodes.get(vector.src)!;
			n.vertices.set(vector.dest, vec);
		}
		const u = nodes.get(validVectors[0].src)!;
		nodes.forEach(v => {
			if (u.isNeighbor(v.id)) {
				u.costs.set(v.id, u.getCost(v.id));
			} else {
				u.costs.set(v.id, Infinity);
			}
		});
		known.set(u.id, u);
		pushState(u);
		while (known.size !== nodes.size) {
			const potential = nodes.filter(n => !known.has(n.id)).sort((a, b) => u.getCost(a.id) - u.getCost(b.id));
			const w = potential.first()!;
			known.set(w.id, w);
			const wNeighbours = nodes.filter(n => w.isNeighbor(n.id) && !known.has(n.id));
			wNeighbours.forEach(v => {
				const oldCost = u.getCost(v.id);
				const newCost = u.getCost(w.id) + w.getCost(v.id);
				if (newCost < oldCost) {
					u.costs.set(v.id, newCost);
					u.prev.set(v.id, w);
				}
			});
			pushState(u);
		}

		const routingTable: string[] = [];
		for (const [, n] of nodes) {
			if (n.id !== u.id) {
				routingTable.push(`To: \`${n.id}\` through: \`${u.getPrev(n.id).id}\` cost: \`${u.getCost(n.id)}\``);
			}
		}

		const embed = new CorEmbed();
		embed.setTitle('Dijkstra Linkstate Algorithm')
			.addField('Accepted vectors', validVectors.map(v => `${v.src}-${v.dest}-${v.cost}`), true);
		const routing = routingTable.join('\n');

		if (routing.length < 2000) {
			embed.addField('Routing table', routing, true);
		} else {
			embed.addField('Routing table', MESSAGES.COMMANDS.DIJKSTRA.ERRORS.FILE_TOO_BIG, true);
		}
		embed.addField('Source Node', u.id, true);
		if (verbose) {
			embed.setDescription(MESSAGES.COMMANDS.DIJKSTRA.EXPLANATION);
		}
		if (routing.length >= 2000) {
			let b: Buffer;
			if (verbose) {
				b = Buffer.from(`${routingTable.join('\r\n')}\r\n${states.join('\r\n')}`, 'utf-8');
			} else {
				b = Buffer.from(states.join('\r\n'), 'utf-8');
			}
			try {
				embed.setColor(COMMANDS.DIJKSTRA.COLORS.WARNING);
				return message.util!.send([embed.applySpacers().shorten(), new MessageAttachment(b, COMMANDS.DIJKSTRA.FILE_NAME)]);
			} catch (_) {
				const content = verbose ? MESSAGES.COMMANDS.DIJKSTRA.ERRORS.FILE_TOO_BIG_VERBOSE : MESSAGES.COMMANDS.DIJKSTRA.ERRORS.FILE_TOO_BIG;
				embed.addField('Routing table', content);
				embed.setColor(COMMANDS.DIJKSTRA.COLORS.FAIL);
				return message.util!.send(embed.applySpacers().shorten());
			}
		} else if (verbose) {
			const b = Buffer.from(states.join('\r\n'));
			try {
				embed.setColor(COMMANDS.DIJKSTRA.COLORS.SUCCESS);
				return message.util!.send([embed.applySpacers().shorten(), new MessageAttachment(b, COMMANDS.DIJKSTRA.FILE_NAME)]);
			} catch (_) {
				embed.addField('Routing table', MESSAGES.COMMANDS.DIJKSTRA.ERRORS.FILE_TOO_BIG_VERBOSE);
				embed.setColor(COMMANDS.DIJKSTRA.COLORS.FAIL);
				return message.util!.send(embed.applySpacers().shorten());
			}
		}
		embed.setColor(COMMANDS.DIJKSTRA.COLORS.SUCCESS);
		return message.util!.send(embed.applySpacers().shorten());
	}
}
export default DijsktraCommand;
