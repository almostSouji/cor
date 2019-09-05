import { Command, Category } from 'discord-akairo';
import { Message, PermissionResolvable } from 'discord.js';
import { stripIndents } from 'common-tags';
import { CorEmbed } from '../../structures/CorEmbed';
import { toTitleCase } from '../../util/';

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
		let idString = `Name: \`${ref.id}\``;
		if (ref.category) {
			idString += `\nCategory: \`${ref.category}\``;
		}
		if (ref.aliases.length) {
			idString += `\nAliases: ${ref.aliases.map(e => `\`${e}\``).join(', ')}`;
		}
		let infoString = '';
		if (ref.description.content) {
			infoString += `\nDescription: ${ref.description.content}`;
		}
		if (ref.description.usage) {
			infoString += `\nUsage: \`${ref.description.usage}\``;
		}
		let restrictionString = '';
		if (ref.ownerOnly) {
			const check = this.client.isOwner(message.author!);
			restrictionString += `\n${check ? '`✅`' : '`❌`'} Owner only`;
		}
		if (ref.channel === 'guild') {
			const check = message.channel.type === 'text';
			restrictionString += `\n${check ? '`✅`' : '`❌`'} Command can only be used in a guild`;
		}
		if (ref.userPermissions) {
			const perms = ref.userPermissions as PermissionResolvable[];
			const check = message.channel.type === 'text' && message.member!.permissions.has(perms);
			restrictionString += `\n${check ? '`✅`' : '`❌`'} User permissions: ${perms.map(e => `\`${e}\``).join(', ')}`;
		}
		if (ref.clientPermissions) {
			const perms = ref.clientPermissions as PermissionResolvable[];
			const check = message.channel.type === 'text' && message.guild!.me!.permissions.has(perms);
			restrictionString += `\n${check ? '`✅`' : '`❌`'} Bot permissions: ${perms.map(e => `\`${e}\``).join(', ')}`;
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
			const commandString = stripIndents`
			Your available commands are:
			${map.join('\n')}

			You can use \`${prefix}${this.id} <commandname>\` to get more information about a command.`;
			return message.util!.send(commandString);
		}
		message.util!.send('', this.buildInfoEmbed(cmd, message));
	}
}
