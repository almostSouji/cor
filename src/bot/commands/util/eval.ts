import { Command } from 'discord-akairo';
import { Message } from 'discord.js';
import * as util from 'util';
import { postHaste } from '../../util';

const cbStartJS = '```js\n';
const cbStartXl = '```xl\n';
const cbEnd = '\n```';

class PingCommand extends Command {
	private constructor() {
		super('eval', {
			aliases: ['eval', 'ev'],
			description: {
				content: 'Evaluate code',
				usage: '<code> [--input] [--noout] [--haste] [--depth <number>] [--async] [--remove]'
			},
			ownerOnly: true,
			editable: true,
			cooldown: 5000,
			ratelimit: 2,
			args: [
				{
					id: 'code',
					match: 'text',
					prompt: {
						start: (msg: Message) => `${msg.author}, what do you want to evaluate?`
					}
				},
				{
					id: 'input',
					match: 'flag',
					flag: ['--input', '--in', '-i']
				},
				{
					id: 'noout',
					match: 'flag',
					flag: ['--noout', '--nout', '--no', '--silent', '-s']
				},
				{
					id: 'haste',
					match: 'flag',
					flag: ['--haste', '-h']
				},
				{
					'id': 'depth',
					'match': 'option',
					'flag': ['--depth', '-d'],
					'type': 'number',
					'default': 0
				},
				{
					id: 'del',
					match: 'flag',
					flag: ['--delete', '--del', '-r', '--remove']
				},
				{
					id: 'as',
					match: 'flag',
					flag: ['--async', '-a']
				}
			]
		});
	}

	public async exec(message: Message, { code, input, noout, haste, depth, del, as }: {code: string; input: boolean; noout: boolean; haste: boolean; depth: number; del: boolean; as: boolean }): Promise<Message | Message[] | void> {
		function clean(text: string, token: string): string {
			return text
				.replace(/`/g, `\`${String.fromCharCode(8203)}`)
				.replace(/@/g, `@${String.fromCharCode(8203)}`)
				.replace(new RegExp(token, 'gi'), '*****');
		}
		let evaled;
		try {
			const hrStart = process.hrtime();
			if (as) {
				const asyncCode = `(async () => { ${code} })()`;
				evaled = await eval(asyncCode); // eslint-disable-line no-eval
			} else {
				evaled = eval(code); // eslint-disable-line no-eval
			}
			if (evaled instanceof Promise) {
				evaled = await evaled;
			}
			const hrStop = process.hrtime(hrStart);
			let response = '';
			if (input) {
				response += `\nInput:${cbStartJS}${code}${cbEnd}`;
			}

			response += `Output:${cbStartJS}${clean(util.inspect(evaled, { depth }), this.client.token)}${cbEnd}`;
			response += `• Type: \`${typeof evaled}\``;
			response += ` • time taken: \`${(((hrStop[0] * 1e9) + hrStop[1])) / 1e6}ms\``;

			if (haste) {
				const hasteLink = await postHaste(clean(util.inspect(evaled), this.client.token), 'js');
				response += `\n• Full Inspect: ${hasteLink}`;
			}
			if (del && message.deletable) {
				message.delete();
			}
			if (!noout) {
				return await message.util!.send(response);
			}
		} catch (error) {
			if (error.message.includes('Must be 2000 or fewer in length')) {
				const hasteLink = await postHaste(clean(util.inspect(evaled, { depth }), this.client.token));
				return message.util!.send(`Output too long, trying to upload it to hastebin instead: ${hasteLink}`);
			}
			this.client.logger.info(`Eval error: ${error.stack}`);
			return message.util!.send(`Error:${cbStartXl}${clean(error.stack, this.client.token)}${cbEnd}`);
		}
	}
}
export default PingCommand;
