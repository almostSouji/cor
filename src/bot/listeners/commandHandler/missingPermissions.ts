import { Listener, Command } from 'discord-akairo';
import { Message } from 'discord.js';
import { MESSAGES } from '../../util/constants';

class MissingPermissionsListener extends Listener {
	private constructor() {
		super('missingPermissions', {
			emitter: 'commandHandler',
			event: 'missingPermissions'
		});
	}

	public exec(message: Message, command: Command, type: string, missing: string[]): Promise<Message | Message[]> {
		const missingFormatted = missing.map(p => `\`${p}\``);
		if (type === 'client') {
			return message.util!.send(MESSAGES.LISTENERS.MISSING_PERMISSIONS.ERRORS.BOT(missingFormatted, command.id));
		}
		return message.util!.send(MESSAGES.LISTENERS.MISSING_PERMISSIONS.ERRORS.USER(missingFormatted, command.id));
	}
}

module.exports = MissingPermissionsListener;
