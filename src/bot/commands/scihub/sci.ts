import { Command } from 'discord-akairo';
import { Message } from 'discord.js';
import fetch from 'node-fetch';
import { load } from 'cheerio';

class SciHubCommand extends Command {
	private constructor() {
		super('schi', {
			aliases: ['sci', 'sci-hub', 'scihub'],
			description: {
				content: 'Unlock knowledge 🔐',
				usage: '[REDACTED]'
			},
			ownerOnly: true,
			args: [
				{
					id: 'query',
					match: 'text'
				}
			]
		});
	}

	private async getValidURLS(): Promise<string[]> {
		const urls = [];
		const res = await fetch('https://whereisscihub.now.sh/');
		const cheer = load(await res.text());
		const lead = cheer('.content p strong a').attr('href');
		urls.push(lead);
		const other = cheer('.content aside ul li')
			.find('a')
			.toArray()
			.map(e => e.attribs.href);
		return urls.concat(other);
	}

	public async exec(message: Message, { query }: {query: string }): Promise<Message | Message[] | void> {
		await this.getValidURLS();
		return message.channel.send((await this.getValidURLS()).map(u => `<:raven_head:611222924921405517> <${u}>`).join('\n'));
	}
}
module.exports = SciHubCommand;
