import { Command } from 'discord-akairo';
import { Message } from 'discord.js';
import { postHaste } from '../../util';
import { promisify } from 'util';

class ExecCommand extends Command {
	private constructor() {
		super('exec', {
			aliases: ['exec', 'exe'],
			description: {
				content: 'Execute shell code',
				usage: '<code> [--haste] [--noout]'
			},
			ownerOnly: true,
			args: [
				{
					id: 'code',
					match: 'text'
				},
				{
					id: 'haste',
					match: 'flag',
					flag: ['--haste', '-h']
				},
				{
					id: 'noout',
					match: 'flag',
					flag: ['--silent', '-s']
				},
				{
					id: 'del',
					match: 'flag',
					flag: ['--remove', '-r']
				}
			]
		});
	}

	public async exec(message: Message, { code, haste, noout }: { code: string; haste: boolean; noout: boolean }): Promise<Message | Message[] | void> {
		const exec = promisify((await import('child_process')).exec);
		try {
			const res = await exec(code, { windowsHide: true });
			const { stdout, stderr } = res;
			if (haste) {
				const hastelink = await postHaste(`${stdout ? stdout : ''}${stdout && stderr ? '\n>>>>>>>>>>>\n' : ''}${stderr ? `${stderr}` : ''}`, 'xl');
				return message.util!.send(`Output: <${hastelink}>`);
			}
			if ((stdout || stderr) && !noout) {
				return message.util!.send(`${stdout ? stdout : ''}${stdout && stderr ? '\n>>>>>>>>>>>\n' : ''}${stderr ? `${stderr}` : ''}`, { code: 'xl', split: true });
			}
		} catch (err) {
			this.client.logger.error(err);
			return message.util!.send(err, { code: 'xl', split: true });
		}
	}
}
module.exports = ExecCommand;
