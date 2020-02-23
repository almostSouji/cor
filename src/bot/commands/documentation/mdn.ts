import { Command } from 'discord-akairo';
import { Message, MessageEmbed, TextChannel } from 'discord.js';
import fetch from 'node-fetch';
import * as qs from 'querystring';
import * as Turndown from 'turndown';
import { COMMANDS, MESSAGES } from '../../util/constants';

// command originally by iCrawl @https://github.com/Naval-Base/yukikaze

export default class MDNCommand extends Command {
	public constructor() {
		super('mdn', {
			aliases: ['mdn', 'mozilla-developer-network'],
			description: {
				content: 'Searches MDN for your query.',
				usage: '<query>'
			},
			regex: /^(?:mdn,) (.+)/i,
			clientPermissions: ['EMBED_LINKS', 'SEND_MESSAGES'],
			args: [
				{
					id: 'query',
					match: 'content',
					type: (_, query): string | null => query ? query.replace(/#/g, '.prototype.') : null
				}
			]
		});
	}

	public async exec(message: Message, { query, match }: { query: string; match: any }): Promise<Message | Message[]> {
		if (!query && match) query = match[1];
		const queryString = qs.stringify({ q: query });
		const res = await fetch(`${COMMANDS.MDN.API.SEARCH_BASE_URL}${queryString}`);
		const body = await res.json();
		if (!body.URL || !body.Title || !body.Summary) {
			return message.util!.send(MESSAGES.COMMANDS.MDN.ERRORS.NOT_FOUND(query));
		}
		const turndown = new Turndown();
		turndown.addRule('hyperlink', {
			filter: 'a',
			replacement: (text, node): string => `[${text}](${COMMANDS.MDN.API.MOZ_BASE_URL}${(node as HTMLLinkElement)}.href})`
		});
		const summary = body.Summary.replace(/<code><strong>(.+)<\/strong><\/code>/g, '<strong><code>$1<\/code><\/strong>');
		const embed = new MessageEmbed()
			.setColor(0x066FAD)
			.setAuthor('MDN', COMMANDS.MDN.MDN_ICON, COMMANDS.MDN.API.MOZ_BASE_URL)
			.setURL(`${COMMANDS.MDN.API.MOZ_BASE_URL}${body.URL}`)
			.setTitle(body.Title)
			.setDescription(turndown.turndown(summary));

		if (message.channel.type === 'dm' || !(message.channel as TextChannel).permissionsFor(message.guild!.me!)!.has(['ADD_REACTIONS', 'MANAGE_MESSAGES'], false)) {
			return message.util!.send({ embed });
		}
		const msg = await message.util!.send(embed);
		msg.react(COMMANDS.MDN.EMOJIS.DELETE);
		let react;
		try {
			react = await msg.awaitReactions(
				(reaction, user): boolean => reaction.emoji.name === COMMANDS.MDN.EMOJIS.DELETE && user.id === message.author.id,
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
