import { Command, Argument, Listener } from 'discord-akairo';
import { Message } from 'discord.js';
import { MESSAGES } from '../../util/constants';

class PingCommand extends Command {
	private constructor() {
		super('reload', {
			aliases: ['reload', 'rel', 're'],
			description: {
				content: 'It... reloads.',
				usage: '<command or listener> [--all]',
				flags: {
					'`-a`, `--all`': 'reload all'
				}
			},
			ownerOnly: true,
			cooldown: 5000,
			ratelimit: 2,
			clientPermissions: ['SEND_MESSAGES'],
			args: [
				{
					id: 'commandOrListener',
					type: Argument.union('commandAlias', 'listener', 'string')
				},
				{
					id: 'all',
					match: 'flag',
					flag: ['-a', '--all']
				}
			]
		});
	}

	public async exec(message: Message, { commandOrListener, all }: { commandOrListener: Command | Listener | string; all: boolean }): Promise<Message | Message[]> {
		if (all) {
			try {
				await this.client.commandHandler.reloadAll();
				await this.client.listenerHandler.reloadAll();
				return message.util!.send(MESSAGES.COMMANDS.RELOAD.SUCCESS.RELOAD_ALL);
			} catch (error) {
				return message.util!.send(MESSAGES.COMMANDS.RELOAD.ERRORS.NO_RELOAD(error));
			}
		}
		if (!commandOrListener) {
			return message.util!.send(MESSAGES.ERRORS.TARGET('command or listener to reload'));
		}
		if (commandOrListener instanceof Command) {
			try {
				await this.client.commandHandler.reload(commandOrListener.id);
				return message.util!.send(MESSAGES.COMMANDS.RELOAD.SUCCESS.RELOAD_ONE_COMMAND(commandOrListener.id));
			} catch (error) {
				return message.util!.send(MESSAGES.COMMANDS.RELOAD.ERRORS.NO_RELOAD_COMMAND(error, commandOrListener.id));
			}
		}
		if (commandOrListener instanceof Listener) {
			try {
				await this.client.listenerHandler.reload(commandOrListener.id);
				return message.util!.send(MESSAGES.COMMANDS.RELOAD.SUCCESS.RELOAD_ONE_LISTENER(commandOrListener.id));
			} catch (error) {
				return message.util!.send(MESSAGES.COMMANDS.RELOAD.ERRORS.NO_RELOAD_COMMAND(error, commandOrListener.id));
			}
		}
		return message.util!.send(MESSAGES.ERRORS.RESOLVE(commandOrListener, 'command or event listener'));
	}
}
export default PingCommand;
