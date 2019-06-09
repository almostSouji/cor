import { Listener } from 'discord-akairo';

class ReconnectListener extends Listener {
	private constructor() {
		super('reconnecting', {
			emitter: 'client',
			event: 'reconnecting',
			category: 'client'
		});
	}

	public exec(): void {
		this.client.logger.info(`Reconnecting...`);
	}
}

module.exports = ReconnectListener;
