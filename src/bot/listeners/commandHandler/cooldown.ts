import { Listener, Command } from 'discord-akairo';
import { Message } from 'discord.js';
import { MESSAGES } from '../../util/constants';

class CooldownListener extends Listener {
	private constructor() {
		super('cooldown', {
			emitter: 'commandHandler',
			event: 'cooldown'
		});
	}

	public exec(message: Message, command: Command, remaining: number): Promise<Message|Message[]> {
		return message.util!.send(MESSAGES.LISTENERS.COOLDOWN.ERRORS.TRY_AGAIN_IN(parseFloat((remaining / 1000).toFixed(2))));
	}
}

module.exports = CooldownListener;
