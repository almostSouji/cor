import { Command, Argument } from 'discord-akairo';
import { Message, User } from 'discord.js';
import { MESSAGES } from '../../util/constants';

class BlacklistCommand extends Command {
	private constructor() {
		super('blacklist', {
			aliases: [
				'blacklist',
				'bl',
				'unblacklist',
				'un-bl'
			],
			description: {
				content: 'Prohibit/Allow the provided user from using the bot',
				usage: '<user>'
			},
			ownerOnly: true,
			clientPermissions: ['SEND_MESSAGES'],
			args: [
				{
					id: 'user',
					type: Argument.union('user', 'string')
				}
			]
		});
	}

	public async exec(message: Message, { user }: { user: User | string }): Promise<Message | Message[]> {
		if (!user) {
			return message.util!.send(MESSAGES.ERRORS.TARGET('user to blacklist'));
		}
		if (typeof user === 'string') {
			try {
				user = await this.client.users.fetch(user);
			} catch (_) {
				return message.util!.send(MESSAGES.ERRORS.RESOLVE((user as string), 'user'));
			}
		}
		const blacklist = this.client.settings.get('global', 'blacklist', []);
		if (blacklist.includes(user.id)) {
			const index = blacklist.indexOf(user.id);
			blacklist.splice(index, 1);

			this.client.settings.set('global', 'blacklist', blacklist);
			return message.util!.send(MESSAGES.COMMANDS.BLACKLIST.SUCCESS.UNBLACKLIST(user));
		}
		blacklist.push(user.id);
		this.client.settings.set('global', 'blacklist', blacklist);
		return message.util!.send(MESSAGES.COMMANDS.BLACKLIST.SUCCESS.UNBLACKLIST(user));
	}
}
export default BlacklistCommand;
