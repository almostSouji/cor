import { Command, Argument, Listener } from 'discord-akairo';
import { Message } from 'discord.js';

class PingCommand extends Command {
	private constructor() {
		super('reload', {
			aliases: ['reload', 'rel', 're'],
			description: {
				content: 'It... reloads.',
				usage: '<command or listener> [--all]'
			},
			ownerOnly: true,
			cooldown: 5000,
			ratelimit: 2,
			args: [
				{
					id: 'commandOrListener',
					type: Argument.union('commandAlias', 'listener', 'string')
				},
				{
					id: 'all',
					match: 'flag',
					flag: ['--all', '-a']
				}
			]
		});
	}

	public async exec(message: Message, { commandOrListener, all }: { commandOrListener: Command | Listener | string; all: boolean }): Promise<Message | Message[]> {
		if (all) {
			try {
				await this.client.commandHandler.reloadAll();
				await this.client.listenerHandler.reloadAll();
				return message.util!.send('✓ Reloaded all commands and listeners');
			} catch (err) {
				return message.util!.send(`✘ Could not reload: \`${err}\``);
			}
		}
		if (!commandOrListener) {
			return message.util!.send(`✘ No target provided, please provide a valid command.`);
		}
		if (commandOrListener instanceof Command) {
			try {
				await this.client.commandHandler.reload(commandOrListener.id);
				return message.util!.send(`✓ Reloaded command \`${commandOrListener}\``);
			} catch (err) {
				return message.util!.send(`✘ Could not reload \`${commandOrListener}\`: \`${err}\``);
			}
		}
		if (commandOrListener instanceof Listener) {
			try {
				await this.client.listenerHandler.reload(commandOrListener.id);
				return message.util!.send(`✓ Reloaded eventlistener \`${commandOrListener}\``);
			} catch (err) {
				return message.util!.send(`✘ Could not reload \`${commandOrListener}\`: \`${err}\``);
			}
		}
		return message.util!.send(`✘ Can not convert \`${commandOrListener}\` to \`command or listener\``);
	}
}
export default PingCommand;
