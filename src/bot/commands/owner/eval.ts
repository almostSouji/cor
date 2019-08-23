import { Command } from 'discord-akairo';
import { Message } from 'discord.js';
import * as Util from 'util';
import { CorEmbed as Embed } from '../../structures/CorEmbed';
import * as DateFns from 'date-fns';
import * as fetch from 'node-fetch';
import * as CorUtil from '../../util/';

const cbStartJS = '```js\n';
const cbStartXl = '```xl\n';
const cbEnd = '\n```';

class EvalCommand extends Command {
	public hrStart: [number, number] | undefined;
	public lastResult: any = null;

	private constructor() {
		super('eval', {
			aliases: ['eval', 'ev'],
			description: {
				content: 'Evaluate code',
				usage: '<code> [--input] [--noout] [--haste] [--depth <number>] [--async] [--remove] [--async]'
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
					id: 'showInput',
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
					flag: ['--async', '--as', '-a']
				}
			]
		});
	}

	private _clean(text: string, token: string): string {
		return text
			.replace(/`/g, `\`${String.fromCharCode(8203)}`)
			.replace(/@/g, `@${String.fromCharCode(8203)}`)
			.replace(new RegExp(token, 'gi'), '*****');
	}

	private async _result(result: any, hrDiff: [number, number], input: string | null = null, showinput: boolean | null = null, haste: boolean | null = null, depth: number = 0): Promise<string> {
		const cleaned = this._clean(Util.inspect(result, { depth }), this.client.token);
		let response = '';
		if (showinput) {
			response += `\nInput:${cbStartJS}${input}${cbEnd}`;
		}

		response += `Output:${cbStartJS}${cleaned}${cbEnd}`;
		response += `• Type: \`${typeof result}\``;
		response += ` • time taken: \`${(((hrDiff[0] * 1e9) + hrDiff[1])) / 1e6}ms\``;

		if (haste) {
			const hasteLink = await CorUtil.postHaste(cleaned, 'js');
			response += `\n• Full Inspect: ${hasteLink}`;
		}
		return response;
	}

	public async exec(message: Message, { code, showInput, noout, haste, depth, del, as }: {code: string; showInput: boolean; noout: boolean; haste: boolean; depth: number; del: boolean; as: boolean }): Promise<Message | Message[] | void> {
		/* eslint-disable @typescript-eslint/no-unused-vars */
		const util = {
			Util,
			Embed,
			DateFns,
			fetch,
			CorUtil
		};
		const msg = message;
		const doReply = (val: any): any => {
			if (val instanceof Error) {
				return message.util!.send(`Callback error: \`${val}\``);
			}
			const result = this._result(val, process.hrtime(this.hrStart));
			return message.util!.send(result);
		};
		/* eslint-enable @typescript-eslint/no-unused-vars */

		try {
			this.hrStart = process.hrtime();
			if (as) {
				const asyncCode = `(async () => { ${code} })()`;
				this.lastResult = await eval(asyncCode); // eslint-disable-line no-eval
			} else {
				this.lastResult = eval(code); // eslint-disable-line no-eval
			}
			if (this.lastResult instanceof Promise) {
				this.lastResult = await this.lastResult;
			}
			if (del && message.deletable) {
				message.delete();
			}
			const hrStop = process.hrtime(this.hrStart);
			const result = await this._result(this.lastResult, hrStop, code, showInput, haste, depth);
			if (!noout) {
				return await message.util!.send(result);
			}
		} catch (error) {
			if (error.message.includes('Must be 2000 or fewer in length')) {
				const hasteLink = await CorUtil.postHaste(this._clean(Util.inspect(this.lastResult, { depth }), this.client.token!));
				return message.util!.send(`Output too long, trying to upload it to hastebin instead: ${hasteLink}`);
			}
			this.client.logger.info(`Eval error: ${error.stack}`);
			return message.util!.send(`Error:${cbStartXl}${this._clean(error.stack, this.client.token!)}${cbEnd}`);
		}
	}
}
export default EvalCommand;
