import { Command, Argument } from 'discord-akairo';
import { Message, TextChannel } from 'discord.js';
import fetch from 'node-fetch';
import * as qs from 'querystring';

// command originally by iCrawl @https://github.com/Naval-Base/yukikaze

const SOURCES = ['stable', 'master', 'rpc', 'commando', 'akairo', 'akairo-master', '11.5-dev'];

export default class DocsCommand extends Command {
	public constructor() {
		super('docs', {
			aliases: ['docs'],
			description: {
				content: 'Searches discord.js documentation.',
				usage: '<query>'
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
					flag: ['--force', '--f', '-f']
				},
				{
					id: 'defaultDocs',
					match: 'option',
					flag: ['--default', '-d', '--def'],
					type: Argument.union(SOURCES, 'string')
				}
			]
		});
	}

	public async exec(message: Message, { defaultDocs, query, force }: { defaultDocs: string | string; query: string; force: boolean }): Promise<Message | Message[]> {
		if (defaultDocs) {
			if (!message.member.hasPermission('MANAGE_GUILD')) {
				return message.util!.send(`✘ You are not authorized to set default logs for \`${message.guild.name}\`.`);
			}
			if (!SOURCES.includes(defaultDocs)) {
				return message.util!.send(`✘ Can not set default docs to: \`${message.guild.name}\`. Please pick one of: ${SOURCES.map(s => `\`${s}\``)}`);
			}
			this.client.settings.set(message.guild!, 'defaultDocs', defaultDocs);
			return message.util!.send(`✓ Set the default docs for \`${message.guild.name}\` to \`${defaultDocs}\``);
		}

		const q = query.split(' ');
		const docs = this.client.settings.get(message.guild!, 'defaultDocs', 'stable');
		let source = SOURCES.includes(q.slice(-1)[0]) ? q.pop() : docs;
		let forceColor;
		if (source === '11.5-dev') {
			forceColor = 16426522;
			source = `https://raw.githubusercontent.com/discordjs/discord.js/docs/${source}.json`;
		}
		if (source === 'master') {
			forceColor = 13650249;
		}
		const queryString = qs.stringify({ src: source, q: q.join(' '), force });
		const res = await fetch(`https://djsdocs.sorta.moe/v2/embed?${queryString}`);
		const embed = await res.json();
		if (!embed) {
			return message.util!.send(`✘ Could not find the requested information for \`${query}\``);
		}
		if (forceColor) {
			embed.color = forceColor;
		}
		if (message.channel.type === 'dm' || !(message.channel as TextChannel).permissionsFor(message.guild!.me!)!.has(['ADD_REACTIONS', 'MANAGE_MESSAGES'], false)) {
			return message.util!.send({ embed });
		}
		const msg = await message.util!.send({ embed }) as Message;
		msg.react('🗑');
		let react;
		try {
			react = await msg.awaitReactions(
				(reaction, user): boolean => reaction.emoji.name === '🗑' && user.id === message.author!.id,
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
