import { Command } from 'discord-akairo';
import { Message } from 'discord.js';

class PrefixCommand extends Command {
	private constructor() {
		super('prefix', {
			aliases: [
				'prefix'
			],
			description: {
				content: 'Change prefix, `--reset` to reset to default',
				usage: '[new prefix]'
			},
			args: [
				{
					id: 'prefix',
					type: 'string'
				},
				{
					id: 'sudo',
					match: 'flag',
					flag: ['--force', '-f']
				},
				{
					id: 'reset',
					match: 'flag',
					flag: ['--reset', '-r']
				}
			]
		});
	}

	public async exec(message: Message,	{ prefix, force, reset }: { prefix: string; force: boolean; reset: boolean }): Promise<Message | Message[]> {
		const defaultPrefix = this.client.config.prefix;
		if (message.channel.type !== 'text') {
			return message.util!.send(`You can use the standard prefix \`${defaultPrefix}\` in direct messages.`);
		}
		const override = this.client.isOwner(message.author!) && force;
		const oldPrefix = this.client.settings.get(message.guild!.id, 'prefix', defaultPrefix);
		if ((!prefix && !reset) || (!message.member!.hasPermission('MANAGE_GUILD') && !override)) {
			return message.util!.send(`My prefix here is \`${oldPrefix}\`.\nAlternatively you can mention me.`);
		}
		if (reset) {
			await this.client.settings.set(message.guild!.id, 'prefix', defaultPrefix);
			return message.util!.send(`Prefix on \`${message.guild!.name}\` reset to \`${defaultPrefix}\`.`);
		}
		await this.client.settings.set(message.guild!.id, 'prefix', prefix);
		return message.util!.send(`Prefix on \`${message.guild!.name}\` changed from \`${oldPrefix}\` to \`${prefix}\`.`);
	}
}
export default PrefixCommand;
