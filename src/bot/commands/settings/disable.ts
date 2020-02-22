import { Command, Category } from 'discord-akairo';
import { Message } from 'discord.js';
import { MESSAGES } from '../../util/constants';

class DisableCommand extends Command {
	private constructor() {
		super('disable', {
			aliases: [
				'disable',
				'enable'
			],
			description: {
				content: 'disable or re-enable module or command for this guild',
				usage: '[module or command] [--reset] [--global]',
				flags: {
					'`-g`, `--global`': 'edit global settings (Owner only)',
					'`-r`, `--reset`': 'enable all commands'
				}
			},
			args: [
				{
					id: 'target',
					type: (message, phrase) => {
						const blacklist = this.client.isOwner(message.author) ? [] : this.client.settings.get('global', 'disabled', []);
						const command = message.util!.handler.findCommand(phrase);
						const category = message.util!.handler.findCategory(phrase);
						const comm = blacklist.includes(command?.id) ? phrase : command;
						const cat = blacklist.includes(category?.id) ? phrase : category;
						return comm || cat || phrase;
					}
				},
				{
					id: 'global',
					match: 'flag',
					flag: ['-g', '--global']
				},
				{
					id: 'reset',
					match: 'flag',
					flag: ['-r', '--reset']
				}
			],
			channel: 'guild',
			userPermissions: ['MANAGE_GUILD']
		});
	}

	public async exec(message: Message,	{ target, global, reset }: { target: Command | Category<string, Command> | string; global: boolean; reset: boolean }): Promise<Message | Message[]> {
		const override = this.client.isOwner(message.author);
		const globalBlacklist = this.client.settings.get('global', 'disabled', []);
		const localBlacklist = this.client.settings.get(message.guild!, 'disabled', []);
		if (global && override) {
			if (reset) {
				this.client.settings.set('global', 'disabled', []);
				return message.util!.send(MESSAGES.COMMANDS.DISABLE.SUCCESS.RESET('globally'));
			}
			if (!target) {
				return message.util!.send(MESSAGES.ERRORS.TARGET('command or category'));
			}
			if (typeof target === 'string') {
				return message.util!.send(MESSAGES.ERRORS.RESOLVE(target, 'command or category'));
			}
			const isCommand = target instanceof Command;
			if (globalBlacklist.includes(target.id)) {
				const index = globalBlacklist.indexOf(target.id);
				globalBlacklist.splice(index, 1);

				this.client.settings.set('global', 'disabled', globalBlacklist);
				return message.util!.send(MESSAGES.COMMANDS.DISABLE.SUCCESS.ENABLED(target.id, 'globally', isCommand));
			}
			globalBlacklist.push(target.id);
			await this.client.settings.set('global', 'disabled', globalBlacklist);
			return message.util!.send(MESSAGES.COMMANDS.DISABLE.SUCCESS.DISABLED(target.id, 'globally', isCommand));
		}
		if (reset) {
			if (reset) {
				this.client.settings.set(message.guild!, 'disabled', []);
				return message.util!.send(MESSAGES.COMMANDS.DISABLE.SUCCESS.RESET(`for \`${message.guild!.name}\``));
			}
		}
		if (!target) {
			return message.util!.send(MESSAGES.ERRORS.TARGET('command or category'));
		}
		if (typeof target === 'string') {
			return message.util!.send(MESSAGES.ERRORS.RESOLVE(target, 'command or category'));
		}
		const isCommand = target instanceof Command;
		if ((globalBlacklist.includes(target) || (target instanceof Command && globalBlacklist.includes(target.categoryID))) && !override) {
			return message.util!.send(MESSAGES.COMMANDS.DISABLE.ERRORS.OWNER_DISABLED(target.id, isCommand));
		}

		if (localBlacklist.includes(target.id)) {
			const index = localBlacklist.indexOf(target.id);
			localBlacklist.splice(index, 1);

			await this.client.settings.set(message.guild!, 'disabled', localBlacklist);
			return message.util!.send(MESSAGES.COMMANDS.DISABLE.SUCCESS.ENABLED(target.id, `for \`${message.guild!.name}\``, isCommand));
		}
		localBlacklist.push(target.id);
		await this.client.settings.set(message.guild!, 'disabled', localBlacklist);
		return message.util!.send(MESSAGES.COMMANDS.DISABLE.SUCCESS.DISABLED(target.id, `for \`${message.guild!.name}\``, isCommand));
	}
}
export default DisableCommand;
