import { Command, Argument } from 'discord-akairo';
import { Message, TextChannel } from 'discord.js';
import { CorEmbed } from '../../structures/CorEmbed';
import { format } from 'date-fns';
class QuoteCommand extends Command {
	private constructor() {
		super('quote', {
			aliases: ['quote', 'q'],
			description: {
				content: 'Quote provided message (`--color` to display with authors color, `--edits` to show edits (requires `MANAGE_MESSAGES` permission))',
				usage: '<messageID> [--color] [--edits]'
			},
			editable: true,
			clientPermissions: ['EMBED_LINKS'],
			channel: 'guild',
			args: [
				{
					id: 'quote',
					type: Argument.union('relevantMessage', 'string')
				},
				{
					id: 'color',
					match: 'flag',
					flag: ['--color', '-c']
				},
				{
					id: 'edits',
					match: 'flag',
					flag: ['--edits', '-e']
				}
			],
			cooldown: 10000,
			ratelimit: 1
		});
	}

	public buildInfoEmbed(message: Message, color: boolean, showedits: boolean): CorEmbed {
		const embed = new CorEmbed()
			.setTimestamp(message.createdAt);
		if (message.channel.type === 'text') {
			const author = message.member!;
			embed.setAuthor(`${author.displayName} ${author.user.bot ? '• Bot' : ''}`, author.user.displayAvatarURL());
			if (author.displayColor && (!embed.color || color)) {
				embed.setColor(author.displayColor);
			}
		} else {
			embed.setAuthor(message.webhookID ? `${message.author.username} • Webhook` : `${message.author.tag} ${message.author.bot ? '• Bot' : ''}`, message.author.displayAvatarURL());
		}
		if (message.channel.type === 'text') {
			embed.setFooter(`In #${(message.channel as TextChannel).name}`);
		}
		if (message.edits.length && showedits) {
			for (const m of message.edits.slice(1)) {
				embed.addField(`Version ${format(m.editedAt || m.createdAt, 'YYYY/MM/DD [at] HH:mm:ss')} (UTC)`, m.content);
			}
		}
		embed.setDescription(`${message.content}\n[➜](${message.url} 'jump to message')`);

		return embed.shorten();
	}

	public exec(message: Message, { quote, color, edits }: {quote: Message | string; color: boolean; edits: boolean}): Promise<Message | Message[]> {
		if (!quote) {
			return message.util!.send(`✘ No target provided, please provide a valid message ID.`);
		}
		if (quote instanceof Message) {
			const channel = quote.channel as TextChannel;
			if (quote.channel.type === 'text' && !channel.permissionsFor(message.author)?.has('VIEW_CHANNEL')) {
				return message.util!.send(`✘ You don't have permission to quote this message.`);
			}
			if (!quote.content) {
				return message.util!.send(`✘ The targeted message does not have any content to quote.`);
			}
			if (quote.channel.type === 'text' && !channel.permissionsFor(message.author)?.has('MANAGE_MESSAGES')) {
				edits = false;
			}
			return message.util!.send('', this.buildInfoEmbed(quote, color, edits));
		}
		return message.util!.send(`✘ Can not convert \`${quote}\` to \`message\``);
	}
}

module.exports = QuoteCommand;
