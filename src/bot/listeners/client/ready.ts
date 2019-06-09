import { Listener } from 'discord-akairo';
import { stripIndents } from 'common-tags';

class ReadyListener extends Listener {
	private constructor() {
		super('ready', {
			emitter: 'client',
			event: 'ready'
		});
	}

	public exec(): void {
		this.client.logger.info(stripIndents`Logged in as ${this.client.user!.tag} (${this.client.user!.id}).`);
	}
}

module.exports = ReadyListener;
