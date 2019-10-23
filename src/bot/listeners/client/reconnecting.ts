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
		if (!this.client.schedule.interval) {
			this.client.logger.info(MESSAGES.LOGGER('SCHEDULE', 'Interval started'));
			this.client.schedule.init();
		}
	}
}

module.exports = ReconnectListener;
