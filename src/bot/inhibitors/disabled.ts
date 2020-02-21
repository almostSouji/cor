import { Inhibitor, Command } from 'discord-akairo';
import { Message } from 'discord.js';

export default class CommandDisabledInhibitor extends Inhibitor {
	private constructor() {
		super('disabled', { reason: 'disabled' });
	}

	public async exec(message: Message, command: Command): Promise<boolean> {
		if (this.client.isOwner(message.author)) {
			return false;
		}
		const globalDisabled = this.client.settings.get('global', 'disabled', []);
		if (globalDisabled.some((d: string) => [command.id, command.categoryID].includes(d))) {
			return true;
		}
		if (message.guild) {
			const guildDisabled = this.client.settings.get(message.guild, 'disabled', []);
			return guildDisabled.some((d: string) => [command.id, command.categoryID].includes(d));
		}
		return false;
	}
}
