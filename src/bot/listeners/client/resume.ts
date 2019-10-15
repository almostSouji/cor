import { Listener } from 'discord-akairo';
import { MESSAGES } from '../../util/constants';

class ResumeListener extends Listener {
	private constructor() {
		super('resumed', {
			emitter: 'client',
			event: 'resumed',
			category: 'client'
		});
	}

	public exec(events: any): void {
		this.client.logger.info(MESSAGES.LOGGER('RESUME', MESSAGES.LISTENERS.RESUME(events)));
	}
}

module.exports = ResumeListener;
