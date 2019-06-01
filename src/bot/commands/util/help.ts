import { Command, Category } from 'discord-akairo';
import { Message, PermissionResolvable } from 'discord.js';
import { stripIndents } from 'common-tags';

export default class HelpCommand extends Command {
	private constructor() {
		super('ping', {
			aliases: ['help', 'h', 'commandinfo'],
			description: {
				content:
					'Display Command help (`--all` to show all commands, regardless of permissions)',
				usage: '[command] [--all]'
			},
			clientPermissions: ['EMBED_LINKS'],
			editable: true,
			cooldown: 5000,
			ratelimit: 2,
			args: [
				{
					id: 'cmd',
					type: 'commandAlias'
				},
				{
					id: 'all',
					match: 'flag',
					flag: ['--all', '--a']
				}
			]
		});
	}

	public async exec(message: Message, { cmd, all }: { cmd: Command; all: boolean }): Promise<any> {
		// @ts-ignore
		const prefix = this.handler.prefix(message);
		if (!cmd) {
			const allowedCategories = this.handler.categories.filter(
				(category: Category<string, Command>): boolean => {
					const filtered = category.filter(
						(command: Command): boolean => {
							if (all) {
								return true;
							}
							if (message.channel.type === 'text' && command.userPermissions) {
								return message.member.hasPermission(
									command.userPermissions as PermissionResolvable[]
								);
							}
							if (command.ownerOnly) {
								return this.client.isOwner(message.author);
							}
							return true;
						}
					);
					if (filtered.size) {
						return true;
					}
					return false;
				}
			);
			const map = allowedCategories.map(
				(category: Category<string, Command>): string => {
					const commands = category.filter(
						(c: Command): boolean => {
							if (all) {
								return true;
							}
							if (message.channel.type === 'text' && c.userPermissions) {
								return message.member.hasPermission(
									c.userPermissions as PermissionResolvable[]
								);
							}
							return true;
						}
					);
					return commands
						.map((c: Command): string => `\`${c.id}\``)
						.join(', ');
				}
			);
			const commandString = stripIndents`
			Your available commands are:
			${map.join('\n')}

			You can use \`${prefix}${this.id} <commandname>\` to get more information about a command.`;
			return message.util!.send(commandString);
		}
	}
}
