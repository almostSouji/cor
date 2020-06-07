import { Command } from 'discord-akairo';
import { Message } from 'discord.js';
import { MESSAGES } from '../../util/constants';

class TagReloadCommand extends Command {
	private constructor() {
		super('reloadtags', {
			aliases: ['reloadtags', 'tag reload', 'tagreload'],
			description: {
				content: 'Reloads all tags from the database',
				usage: ''
			},
			ownerOnly: true,
			clientPermissions: ['SEND_MESSAGES']
		});
	}

	public async exec(message: Message): Promise<Message | Message[] | void> {
		const dbTags = await this.client.tags.find();
		for (const dbTag of dbTags) {
			const tag = {
				...dbTag,
				aliases: dbTag.aliases.split(',')
			};
			this.client.tagCache.set(tag.name, tag);
		}
		message.util?.send(MESSAGES.COMMANDS.RELOADTAGS.SUCCESS);
	}
}
module.exports = TagReloadCommand;
