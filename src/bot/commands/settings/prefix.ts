import { Command } from 'discord-akairo';
import { Message } from 'discord.js';
import { MESSAGES } from '../../util/constants';

class PrefixCommand extends Command {
	private constructor() {
		super('prefix', {
			aliases: [
				'prefix'
			],
			description: {
				content: 'Change prefix',
				usage: '[new prefix] [--force] [--reset]',
				flags: {
					'`-f`, `--force`': 'bypass permissions (Owner only)',
					'`-r`, `--reset`': 'reset to default'
				}
			},
			clientPermissions: ['SEND_MESSAGES'],
			args: [
				{
					id: 'prefix',
					type: 'string'
				},
				{
					id: 'force',
					match: 'flag',
					flag: ['-f', '--force']
				},
				{
					id: 'reset',
					match: 'flag',
					flag: ['-r', '--reset']
				}
			]
		});
	}

	public async exec(message: Message,	{ prefix, force, reset }: { prefix: string; force: boolean; reset: boolean }): Promise<Message | Message[]> {
		const defaultPrefix = this.client.config.prefix;
		if (message.channel.type !== 'text') {
			return message.util!.send(MESSAGES.COMMANDS.PREFIX.DM_PREFIX(defaultPrefix));
		}
		const override = this.client.isOwner(message.author) && force;
		const currentPrefix = this.client.settings.get(message.guild!.id, 'prefix', defaultPrefix);
		if ((!prefix && !reset) || (!message.member!.hasPermission('MANAGE_GUILD') && !override)) {
			return message.util!.send(MESSAGES.COMMANDS.PREFIX.GUILD_PREFIX(currentPrefix));
		}
		if (reset) {
			await this.client.settings.set(message.guild!.id, 'prefix', defaultPrefix);
			return message.util!.send(MESSAGES.COMMANDS.PREFIX.SUCCESS.RESET(message.guild!, defaultPrefix));
		}
		await this.client.settings.set(message.guild!.id, 'prefix', prefix);
		return message.util!.send(MESSAGES.COMMANDS.PREFIX.SUCCESS.CHANGE(message.guild!, currentPrefix, prefix));
	}
}
export default PrefixCommand;
