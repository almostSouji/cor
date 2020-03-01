import { Command } from 'discord-akairo';
import { Message } from 'discord.js';
import fetch from 'node-fetch';
import { CorEmbed } from '../../structures/CorEmbed';
import { safeLoad } from 'js-yaml';
import { MESSAGES } from '../../util/constants';

interface TagData {
	name: string;
	content: string;
	aliases: string;
	user: string;
	templated: boolean;
	hoisted: boolean;
	createdAt: string;
	updatedAt: string;
}


class LoadBackupTxtCommand extends Command {
	private constructor() {
		super('loadbackup', {
			aliases: ['loadbackup', 'loadtags'],
			description: {
				content: 'Load Tags from a backup YAML file (file-command)',
				usage: '[--reset]',
				flags: {
					'`-r`, `--reset`': 'reset database before loading file'
				}
			},
			args: [
				{
					id: 'reset',
					match: 'flag',
					flag: ['-r', '--reset']
				}
			],
			cooldown: 5000,
			ratelimit: 2,
			ownerOnly: true,
			clientPermissions: ['SEND_MESSAGES', 'EMBED_LINKS']
		});
	}

	public async exec(message: Message, { reset }: {reset: boolean}): Promise<Message | Message[]> {
		const url = message.attachments.first()?.url;
		if (!url?.toLowerCase().endsWith('.yaml')) {
			return message.util!.send(MESSAGES.COMMANDS.LOAD_BACKUP.ERRORS.NO_YAML);
		}
		let status = '';
		if (reset) {
			status += MESSAGES.COMMANDS.LOAD_BACKUP.PROGRESS.CLEARING;
			await message.util!.send(new CorEmbed().addField('Status', status));
			try {
				await this.client.tags.clear();
				status = `${MESSAGES.COMMANDS.LOAD_BACKUP.PROGRESS.CLEARED}\n`;
				await message.util!.send(new CorEmbed().addField('Status', status));
			} catch {
				status = MESSAGES.COMMANDS.LOAD_BACKUP.PROGRESS.NO_CLEAR;
				return message.util!.send(new CorEmbed().addField('Status', status));
			}
		}
		const res = await fetch(url);
		const text = await res.text();
		const data: TagData[] = safeLoad(text);

		let ephemeral = status;
		ephemeral += MESSAGES.COMMANDS.LOAD_BACKUP.PROGRESS.INSERTING;
		await message.util!.send(new CorEmbed().addField('Status', ephemeral));
		let success = 0;
		let fails = 0;
		for (const tag of data) {
			try {
				const entry = await this.client.tags.create(tag);
				await this.client.tags.save(entry);
				success++;
			} catch {
				fails++;
			}
		}

		if (!success && !fails) {
			status += MESSAGES.COMMANDS.LOAD_BACKUP.PROGRESS.NO_TAGS;
			return message.util!.send(new CorEmbed().addField('Status', status));
		}
		status += MESSAGES.COMMANDS.LOAD_BACKUP.PROGRESS.INSERTED;
		const embed = new CorEmbed()
			.addField('Status', status)
			.addField('Report', `Successful: ${success}\nFailures: ${fails}`);
		return message.util!.send(embed);
	}
}
export default LoadBackupTxtCommand;
