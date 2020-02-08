import { Command } from 'discord-akairo';
import { Message, TextChannel } from 'discord.js';
import { MESSAGES, COMMANDS } from '../../util/constants';
import ms = require('ms');
import { stripIndents } from 'common-tags';

class TeaTimerCommand extends Command {
	private constructor() {
		super('teatimer', {
			aliases: ['teatimer', 'teatime', 'tea'],
			description: {
				content: 'Set a tea timer to provided duration, `--dm` to receive the notification via dm (make sure you have DM enabled for this server)',
				usage: 'duration [--directmessage]'
			},
			args: [
				{
					id: 'duration',
					type: (_, str): number | string => {
						if (!str) return str;
						const duration = ms(str);
						if (duration && !isNaN(duration)) return duration;
						return str;
					}
				},
				{
					id: 'dm',
					match: 'flag',
					flag: ['--directmessage', '--dm', '-d']
				}
			]
		});
	}

	public async exec(message: Message, { duration, dm }: {duration: number; dm: boolean}): Promise<Message | Message[]> {
		if (!duration) {
			return message.util!.send(MESSAGES.ERRORS.TARGET('steeping duration'));
		}
		if (duration < COMMANDS.TEA.MIN_DURATION) {
			return message.util!.send(MESSAGES.COMMANDS.TEA.ERRORS.TOO_SHORT);
		}
		if (duration > COMMANDS.TEA.MAX_DURATION) {
			return message.util!.send(MESSAGES.COMMANDS.TEA.ERRORS.TOO_LONG);
		}
		const quotes = MESSAGES.COMMANDS.TEA.QUOTES;
		const rand = Math.floor(Math.random() * quotes.length);
		const quote = quotes[rand];
		const notification = stripIndents`
			${quote} [quote #${rand + 1}]
			${message.author}, ${MESSAGES.COMMANDS.TEA.FOOTER}`;
		const dmCheck = dm || message.channel.type !== 'text';
		const target = !dm && message.channel.type === 'text' ? (message.channel as TextChannel) : undefined;
		const entry = await this.client.schedule.add({
			target,
			user: message.author!,
			timestamp: Date.now() + duration,
			command: dmCheck ? 'dm' : 'channel',
			message: notification
		});
		if (!entry) {
			return message.util!.send(MESSAGES.COMMANDS.TEA.ERRORS.NO_ENTRY);
		}
		return message.util!.send(MESSAGES.COMMANDS.TEA.SUCCESS(entry));
	}
}
export default TeaTimerCommand;
