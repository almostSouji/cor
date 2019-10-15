import { Command, Category } from 'discord-akairo';
import { Message, PermissionResolvable } from 'discord.js';
import { CorEmbed } from '../../structures/CorEmbed';
import { toTitleCase } from '../../util/';
import { MESSAGES } from '../../util/constants';

export default class HelpCommand extends Command {
	private constructor() {
		super('help', {
			aliases: ['help', 'h'],
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

	private buildInfoEmbed(ref: Command, message: Message): CorEmbed {
		const permissionMapper = (permissions: PermissionResolvable[]): string => permissions.map(e => `\`${e}\``).join(', ');
		let idString = `Name: \`${ref.id}\``;
		if (ref.category) {
			idString += MESSAGES.COMMANDS.HELP.INFO.CATEGORY(ref.category.id);
		}
		if (ref.aliases.length) {
			idString += MESSAGES.COMMANDS.HELP.INFO.ALIASES(ref.aliases);
		}
		let infoString = '';
		if (ref.description.content) {
			infoString += MESSAGES.COMMANDS.HELP.INFO.DESCRIPTION(ref.description.content);
		}
		if (ref.description.usage) {
			infoString += MESSAGES.COMMANDS.HELP.INFO.DESCRIPTION(ref.description.usage);
		}
		let restrictionString = '';
		if (ref.ownerOnly) {
			const check = this.client.isOwner(message.author!);
			restrictionString += MESSAGES.COMMANDS.HELP.INFO.OWNER_ONLY(check);
		}
		if (ref.channel === 'guild') {
			const check = message.channel.type === 'text';
			restrictionString += MESSAGES.COMMANDS.HELP.INFO.GUILD_ONLY(check);
		}
		if (ref.userPermissions) {
			const permissions = ref.userPermissions as PermissionResolvable[];
			const check = message.channel.type === 'text' && message.member!.permissions.has(permissions);
			restrictionString += MESSAGES.COMMANDS.HELP.INFO.USER_PERMISSIONS(permissionMapper(permissions), check);
		}
		if (ref.clientPermissions) {
			const permissions = ref.clientPermissions as PermissionResolvable[];
			const check = message.channel.type === 'text' && message.guild!.me!.permissions.has(permissions);
			restrictionString += MESSAGES.COMMANDS.HELP.INFO.BOT_PERMISSIONS(permissionMapper(permissions), check);
		}


		const embed = new CorEmbed()
			.addField('Command Information', idString)
			.addField('About', infoString);
		if (restrictionString) {
			embed.addField('Restrictions', restrictionString);
		}
		if (!embed.color && message.guild && message.guild.me!.displayColor) {
			embed.setColor(message.guild.me!.displayColor);
		}
		return embed.applySpacers();
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
								return message.member!.hasPermission(
									command.userPermissions as PermissionResolvable[]
								);
							}
							if (command.ownerOnly) {
								return this.client.isOwner(message.author!);
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
								return message.member!.hasPermission(
									c.userPermissions as PermissionResolvable[]
								);
							}
							return true;
						}
					);
					return `${toTitleCase(category.id)}:${commands
						.map((c: Command): string => `\`${c.id}\``)
						.join(', ')}`;
				}
			);
			return message.util!.send(MESSAGES.COMMANDS.HELP.OUTPUT(map, prefix, this.id));
		}
		message.util!.send('', this.buildInfoEmbed(cmd, message));
	}
}
