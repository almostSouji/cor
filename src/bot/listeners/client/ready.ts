import { Listener } from 'discord-akairo';
import { MESSAGES } from '../../util/constants';

class ReadyListener extends Listener {
	private constructor() {
		super('ready', {
			emitter: 'client',
			event: 'ready'
		});
	}

	public exec(): void {
		this.client.logger.info(MESSAGES.LOGGER('LOGIN', MESSAGES.LISTENERS.READY(this.client.user!)));
	}
}

module.exports = ReadyListener;
