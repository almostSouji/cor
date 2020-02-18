import { Command, version as akairoVersion } from 'discord-akairo';
import { Message, Permissions, PermissionResolvable, version as djsVersion } from 'discord.js';
import { parse } from '@yarnpkg/lockfile';
import { readFileSync } from 'fs';
import { join } from 'path';
import { version as corVersion } from '../../../../package.json';
import { CorEmbed } from '../../structures/CorEmbed';
import { stripIndents } from 'common-tags';
import { COMMANDS, MESSAGES } from '../../util/constants';

interface RepoMatch {
	name: string;
	holder: string;
	repo: string;
}

class VersionCommand extends Command {
	private constructor() {
		super('version', {
			aliases: ['version', 'v'],
			description: {
				content: 'Display project and depdency versions',
				usage: ''
			},
			editable: true,
			cooldown: 5000,
			ratelimit: 2,
			clientPermissions: ['EMBED_LINKS']
		});
	}

	public async exec(message: Message): Promise<Message | Message[]> {
		const permissionsArray = [...new Set(this.handler.modules.reduce((a: PermissionResolvable[], e: Command): PermissionResolvable[] => {
			const p = e.clientPermissions as PermissionResolvable[];
			return a.concat(p);
		}, []).filter(e => e))];
		const permissions = new Permissions(permissionsArray);
		try {
			const file = readFileSync(join(__dirname, '..', '..', '..', '..', 'yarn.lock'), 'utf8');
			const deps = parse(file).object;
			const keys = Object.keys(deps);
			const djsReg = COMMANDS.VERSION.REGEX('discord\.js');
			const akairoReg = COMMANDS.VERSION.REGEX('discord\.akairo');
			let djsMatch: RegExpExecArray | null;
			let akairoMatch: RegExpExecArray | null;
			const djsKey = keys.find(k => {
				djsMatch = djsReg.exec(k);
				return djsMatch;
			});
			const akairoKey = keys.find(k => {
				akairoMatch = akairoReg.exec(k);
				return akairoMatch;
			});
			if (!djsKey || !akairoKey || !djsMatch! || !akairoMatch!) {
				return message.util!.send(MESSAGES.COMMANDS.VERSION.ERRORS.KEY_NOT_FOUND);
			}
			const discordJS = deps[djsKey];
			const discordAkairo = deps[akairoKey];
			const djsParts = djsMatch!.groups! as any as RepoMatch;
			const akairoParts = akairoMatch!.groups! as any as RepoMatch;
			const hashReg = /(?:tar.gz\/|#)(\w+)/;
			const djsHash = discordJS.resolved.match(hashReg)[1];
			const akairoHash = discordAkairo.resolved.match(hashReg)[1];
			const creator = await this.client.users.fetch('83886770768314368');
			const embed = new CorEmbed()
				.setThumbnail(this.client.user!.displayAvatarURL())
				.addField(`Project: C.O.R.: ${corVersion}`,
					stripIndents`[view on GitHub](https://github.com/almostSouji/cor) | [invite ${this.client.user!.username}](https://discordapp.com/oauth2/authorize?client_id=${this.client.user!.id}&permissions=${permissions.bitfield}&scope=bot)
			
			Maximum permissions needed in this version: ${permissionsArray.map(perm => `\`${perm}\``).join(', ')}`)
				.addField(`Library: Discord.js: ${djsVersion}`, stripIndents`Commithash: \`${djsHash}\`
				[view on GitHub](https://github.com/${djsParts.holder!}/${djsParts.repo}/commit/${djsHash})`)
				.addField(`Framework: Akairo: ${akairoVersion}`, stripIndents`Commithash: \`${akairoHash}\`
				[view on GitHub](https://github.com/${akairoParts.holder}/${akairoParts.repo}/commit/${akairoHash})`)
				.setFooter(`Coded with 🍵 by ${creator.username} | running on Node.js ${process.version}`, creator.displayAvatarURL());

			if (!embed.color && message.guild && message.guild.me!.displayColor) {
				embed.setColor(message.guild.me!.displayColor);
			}
			return message.util!.send(embed);
		} catch {
			return message.util!.send(MESSAGES.ERRORS.CATCH);
		}
	}
}
export default VersionCommand;
