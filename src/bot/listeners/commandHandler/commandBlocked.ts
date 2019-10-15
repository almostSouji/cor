import { Listener, Command } from 'discord-akairo';
import { Message } from 'discord.js';
import { MESSAGES } from '../../util/constants';

class CommandBlockedListener extends Listener {
	private constructor() {
		super('commandBlocked', {
			emitter: 'commandHandler',
			event: 'commandBlocked'
		});
	}

	public exec(message: Message, command: Command, reason: string): void {
		if (reason === 'guild') {
			message.util!.send(MESSAGES.LISTENERS.COMMAND_BLOCKED.ERRORS.GUILD_ONLY(command.id));
		}
	}
}

module.exports = CommandBlockedListener;
