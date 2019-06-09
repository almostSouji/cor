import { Listener } from 'discord-akairo';

class ResumeListener extends Listener {
	private constructor() {
		super('resumed', {
			emitter: 'client',
			event: 'resumed',
			category: 'client'
		});
	}

	public exec(events: any): void {
		this.client.logger.info(`Resumed. (replayed ${events} events)`);
	}
}

module.exports = ResumeListener;
