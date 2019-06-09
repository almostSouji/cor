import { Listener } from 'discord-akairo';

class DisconnectListener extends Listener {
	private constructor() {
		super('disconnect', {
			emitter: 'client',
			event: 'disconnect',
			category: 'client'
		});
	}

	public exec(event: any): void {
		this.client.logger.warn(`Disconnect (${event.code})`);
	}
}

module.exports = DisconnectListener;
