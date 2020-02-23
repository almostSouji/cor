import { Command } from 'discord-akairo';
import { Message } from 'discord.js';

class PingCommand extends Command {
	private constructor() {
		super('ping', {
			aliases: ['ping'],
			description: {
				content: 'Display response time',
				usage: ''
			},
			cooldown: 5000,
			ratelimit: 2,
			clientPermissions: ['SEND_MESSAGES']
		});
	}

	public async exec(message: Message): Promise<Message | Message[]> {
		const start = Date.now();
		await message.util!.send('awaiting ping...');
		return message.util!.send(
			`✓ pong! Api Latency is ${Date.now() - start}ms. Av. Heartbeat is ${Math.round(
				this.client.ws.ping
			)}ms.`
		);
	}
}
export default PingCommand;
