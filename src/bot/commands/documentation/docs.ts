import { Command, Argument } from 'discord-akairo';
import { Message, TextChannel } from 'discord.js';
import fetch from 'node-fetch';
import * as qs from 'querystring';
import { COMMANDS, MESSAGES } from '../../util/constants';

// command originally by iCrawl @https://github.com/Naval-Base/yukikaze

export default class DocsCommand extends Command {
	public constructor() {
		super('docs', {
			aliases: ['docs'],
			description: {
				content: 'Searches discord.js documentation. (`--force` to force refresh, `--source` to provide a source other than stable discord.js documentation, `--default` to set a default source for this server (requires MANAGE_GUILD permissions on the sender))',
				usage: '<query> [--source <source>] [--force] [--default <docversion>]'
			},
			clientPermissions: ['EMBED_LINKS'],
			ratelimit: 2,
			args: [
				{
					id: 'query',
					match: 'rest',
					type: 'lowercase'
				},
				{
					id: 'force',
					match: 'flag',
					flag: ['--force', '-f']
				},
				{
					'id': 'source',
					'match': 'option',
					'flag': ['--source', '-s'],
					'type': 'string',
					'default': 'stable'
				},
				{
					id: 'defaultDocs',
					match: 'option',
					flag: ['--default', '-d'],
					type: Argument.union(COMMANDS.DOCS.SOURCES, 'string')
				}
			]
		});
	}

	public async exec(message: Message, { defaultDocs, query, force, source }: { defaultDocs: string | string; query: string; force: boolean; source: string }): Promise<Message | Message[]> {
		if (defaultDocs && message.channel.type === 'text') {
			if (!message.member!.hasPermission('MANAGE_GUILD')) {
				return message.util!.send(MESSAGES.COMMANDS.DOCS.ERRORS.MISSING_PERMISSIONS(message.guild!));
			}
			if (!COMMANDS.DOCS.SOURCES.includes(defaultDocs)) {
				return message.util!.send(MESSAGES.COMMANDS.DOCS.ERRORS.INVALID_DOCS(defaultDocs, COMMANDS.DOCS.SOURCES));
			}
			this.client.settings.set(message.guild!, 'defaultDocs', defaultDocs);
			return message.util!.send(MESSAGES.COMMANDS.DOCS.SUCESS.SET_DEFAULT(message.guild!, defaultDocs));
		}

		const q = query.split(' ');
		if (!COMMANDS.DOCS.SOURCES.includes(source)) {
			source = this.client.settings.get(message.guild!, 'defaultDocs', 'stable');
		}
		let forceColor;
		if (source === COMMANDS.DOCS.STABLE_DEV_SOURCE) {
			forceColor = COMMANDS.DOCS.COLORS.STABLE_DEV;
			source = `${COMMANDS.DOCS.API.STABLE_DEV_DOCS}${source}.json`;
		}
		if (source === COMMANDS.DOCS.COLLECTION_SOURCE) {
			forceColor = COMMANDS.DOCS.COLORS.COLLECTION;
		}
		if (source === COMMANDS.DOCS.DEV_SOURCE) {
			forceColor = COMMANDS.DOCS.COLORS.DEV;
		}
		const queryString = qs.stringify({ src: source, q: q.join(' '), force });
		const res = await fetch(`${COMMANDS.DOCS.API.BASE_URL}${queryString}`);
		const embed = await res.json();
		if (!embed) {
			return message.util!.send(MESSAGES.COMMANDS.DOCS.ERRORS.NONE_FOUND(query));
		}
		if (forceColor) {
			embed.color = forceColor;
		}
		if (message.channel.type === 'dm' || !(message.channel as TextChannel).permissionsFor(message.guild!.me!)!.has(['ADD_REACTIONS', 'MANAGE_MESSAGES'], false)) {
			return message.util!.send({ embed });
		}
		const msg = await message.util!.send({ embed });
		msg.react(COMMANDS.DOCS.EMOJIS.DELETE);
		let react;
		try {
			react = await msg.awaitReactions(
				(reaction, user): boolean => reaction.emoji.name === COMMANDS.DOCS.EMOJIS.DELETE && user.id === message.author.id,
				{ max: 1, time: 5000, errors: ['time'] }
			);
		} catch (error) {
			msg.reactions.removeAll();

			return message;
		}
		react.first()!.message.delete();
		return message;
	}
}
