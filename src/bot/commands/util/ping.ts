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
			ratelimit: 2
		});
	}

	public async exec(message: Message): Promise<Message | Message[]> {
		const ping = await message.util!.send('awaiting ping...') as Message;
		return message.util!.send(
			`✓ pong! Api Latency is ${ping.createdTimestamp -
			message.createdTimestamp}ms. Av. Heartbeat is ${Math.round(
				this.client.ws.ping
			)}ms.`
		);
	}
}
export default PingCommand;
