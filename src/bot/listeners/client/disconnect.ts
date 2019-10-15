import { Listener } from 'discord-akairo';
import { MESSAGES } from '../../util/constants';

class DisconnectListener extends Listener {
	private constructor() {
		super('disconnect', {
			emitter: 'client',
			event: 'disconnect',
			category: 'client'
		});
	}

	public exec(event: any): void {
		this.client.logger.warn(MESSAGES.LOGGER('DISCONNECT', MESSAGES.LISTENERS.DISCONNECT(event.code)));
	}
}

module.exports = DisconnectListener;
