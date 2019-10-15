import { Listener } from 'discord-akairo';
import { MESSAGES } from '../../util/constants';

class ReconnectListener extends Listener {
	private constructor() {
		super('reconnecting', {
			emitter: 'client',
			event: 'reconnecting',
			category: 'client'
		});
	}

	public exec(): void {
		this.client.logger.info(MESSAGES.LOGGER('RECONNET', MESSAGES.LISTENERS.RECONNECT));
	}
}

module.exports = ReconnectListener;
