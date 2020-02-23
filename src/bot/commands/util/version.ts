import { Command, version as akairoVersion } from 'discord-akairo';
import { Message, Permissions, PermissionResolvable, version as djsVersion } from 'discord.js';
import { safeLoad } from 'js-yaml';
import { readFileSync } from 'fs';
import { join } from 'path';
import { version as corVersion } from '../../../../package.json';
import { CorEmbed } from '../../structures/CorEmbed';
import { stripIndents } from 'common-tags';
import { COMMANDS, MESSAGES } from '../../util/constants';

interface RepoMatch {
	holder: string;
	repo: string;
	hash: string;
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
			clientPermissions: ['EMBED_LINKS', 'SEND_MESSAGES']
		});
	}

	public async exec(message: Message): Promise<Message | Message[]> {
		const permissionsArray = [...new Set(this.handler.modules.reduce((a: PermissionResolvable[], e: Command): PermissionResolvable[] => {
			const p = e.clientPermissions as PermissionResolvable[];
			return a.concat(p);
		}, []).filter(e => e))];
		const permissions = new Permissions(permissionsArray);
		try {
			const file = readFileSync(join(__dirname, '..', '..', '..', '..', '..', 'pnpm-lock.yaml'), 'utf8');
			const lockfile = safeLoad(file);
			const djs = lockfile.dependencies['discord.js'];
			const akairo = lockfile.dependencies['discord-akairo'];
			const reg = COMMANDS.VERSION.REGEX;
			if (!djs || !akairo) {
				return message.util!.send(MESSAGES.COMMANDS.VERSION.ERRORS.KEY_NOT_FOUND);
			}
			const djsMatch = reg.exec(djs);
			const akairoMatch = reg.exec(akairo);
			const djsParts = djsMatch!.groups! as any as RepoMatch;
			const akairoParts = akairoMatch!.groups! as any as RepoMatch;
			const creator = await this.client.users.fetch('83886770768314368');
			const embed = new CorEmbed()
				.setThumbnail(this.client.user!.displayAvatarURL())
				.addFields(
					{
						name: `Project: C.O.R.: ${corVersion}`,
						value: stripIndents`[view on GitHub](https://github.com/almostSouji/cor) | [invite ${this.client.user!.username}](https://discordapp.com/oauth2/authorize?client_id=${this.client.user!.id}&permissions=${permissions.bitfield}&scope=bot)
			
						Maximum permissions needed in this version: ${permissionsArray.map(perm => `\`${perm}\``).join(', ')}`
					},
					{
						name: `Library: Discord.js: ${djsVersion}`,
						value: stripIndents`Commithash: \`${djsParts.hash}\`
							[view on GitHub](https://github.com/${djsParts.holder}/${djsParts.repo}/commit/${djsParts.hash})`
					},
					{
						name: `Framework: Akairo: ${akairoVersion}`,
						value: stripIndents`Commithash: \`${akairoParts.hash}\`
							[view on GitHub](https://github.com/${akairoParts.holder}/${akairoParts.repo}/commit/${akairoParts.hash})`
					}
				)
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
