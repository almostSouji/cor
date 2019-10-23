import { Command } from 'discord-akairo';
import { Message } from 'discord.js';
import { MESSAGES, COMMANDS } from '../../util/constants';
import ms = require('ms');
import { stripIndents } from 'common-tags';

class PingCommand extends Command {
	private constructor() {
		super('teatimer', {
			aliases: ['teatimer', 'teatime', 'tea'],
			description: {
				content: 'Display response time',
				usage: 'duration'
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
				}
			]
		});
	}

	public async exec(message: Message, { duration }: {duration: number}): Promise<Message | Message[]> {
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
			${MESSAGES.COMMANDS.TEA.FOOTER}`;
		const entry = await this.client.schedule.add({
			user: message.author!,
			timestamp: Date.now() + duration,
			command: 'dm',
			message: notification
		});
		if (!entry) {
			return message.util!.send(MESSAGES.COMMANDS.TEA.ERRORS.NO_ENTRY);
		}
		return message.util!.send(MESSAGES.COMMANDS.TEA.SUCCESS(entry));
	}
}
export default PingCommand;
