import { Command, Argument } from 'discord-akairo';
import { Message, User, Collection, EmbedFieldData } from 'discord.js';
import { MESSAGES } from '../../util/constants';
import { CorEmbed } from '../../structures/CorEmbed';

interface UnresolvableEnetry {
	entry: string;
	error: any;
}

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
				usage: '<user>',
				flags: {
					'`-ls`, `--list`': 'list blacklisted users'
				}
			},
			ownerOnly: true,
			clientPermissions: ['SEND_MESSAGES'],
			args: [
				{
					id: 'user',
					type: Argument.union('user', 'string')
				},
				{
					id: 'list',
					match: 'flag',
					flag: ['-ls', '--list']
				}
			]
		});
	}

	public async exec(message: Message, { user, list }: { user: User | string; list: boolean }): Promise<Message | Message[]> {
		if (list) {
			const blacklist = this.client.settings.get('global', 'blacklist', []);
			if (!blacklist.length) {
				return message.util!.send(MESSAGES.COMMANDS.BLACKLIST.ERRORS.NO_ENTRY);
			}
			const users: Collection<string, User> = new Collection();
			const unresolvable: UnresolvableEnetry[] = [];
			for (const entry of blacklist) {
				try {
					const u = await this.client.users.fetch(entry);
					users.set(u.id, u);
				} catch (error) {
					unresolvable.push({ entry, error });
				}
			}
			const fields: EmbedFieldData[] = [];
			if (users.size) {
				fields.push(
					{
						name: 'Blacklisted Users',
						value: users.map((user: User) => `${user.tag} (${user.id}) [avatar](${user.displayAvatarURL({ dynamic: true, format: 'png', size: 2048 })} 'show ${user.username}\'s avatar')`)
					}
				);
			}
			if (unresolvable.length) {
				fields.push(
					{
						name: 'Unresolvable Entries',
						value: unresolvable.map((unres: UnresolvableEnetry) => `${unres.entry}: ${unres.error}`)
					}
				);
			}
			return message.util!.send(new CorEmbed().addFields(fields).shorten());
		}
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
		return message.util!.send(MESSAGES.COMMANDS.BLACKLIST.SUCCESS.BLACKLIST(user));
	}
}
export default BlacklistCommand;
