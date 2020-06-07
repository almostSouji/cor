import { Command } from 'discord-akairo';
import { Message, MessageAttachment } from 'discord.js';
import { safeDump } from 'js-yaml';
import { MESSAGES } from '../../util/constants';

class ExportTagsCommand extends Command {
	private constructor() {
		super('exporttags', {
			aliases: ['exporttags', 'export'],
			description: {
				content: 'Export tags to YAML',
				usage: ''
			},
			cooldown: 5000,
			ratelimit: 2,
			ownerOnly: true,
			clientPermissions: ['SEND_MESSAGES', 'ATTACH_FILES', 'EMBED_LINKS']
		});
	}

	public async exec(message: Message): Promise<Message | Message[]> {
		const tags = await this.client.tags.find();
		const dump = safeDump(tags.map(tag => ({
			...tag,
			aliases: tag.aliases.split(',')
		})), {});
		const b = Buffer.from(dump, 'utf-8');
		try {
			return message.util!.send(MESSAGES.COMMANDS.EXPORT_TAGS.SUCCESS, new MessageAttachment(b, 'tags.yaml'));
		} catch (err) {
			return message.util!.send(MESSAGES.COMMANDS.EXPORT_TAGS.ERRORS.MISC(err));
		}
	}
}
export default ExportTagsCommand;
