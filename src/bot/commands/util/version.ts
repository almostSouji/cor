import { Command, version as akairoVersion } from 'discord-akairo';
import { Message, Permissions, PermissionResolvable, version as djsVersion } from 'discord.js';
import { parse } from '@yarnpkg/lockfile';
import { readFileSync } from 'fs';
import { join } from 'path';
import { version as corVersion } from '../../../../package.json';
import { CorEmbed } from '../../structures/CorEmbed';
import { stripIndents } from 'common-tags';

class VersionCommand extends Command {
	private constructor() {
		super('version', {
			aliases: ['version', 'v', 'ver', 'dep', 'dependencies'],
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
		const file = readFileSync(join(__dirname, '..', '..', '..', '..', 'yarn.lock'), 'utf8');
		const deps = parse(file).object;
		const discordJS = deps['discord.js@discordjs/discord.js'];
		const discordAkairo = deps['discord-akairo@1Computer1/discord-akairo'];
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
				[view on GitHub](https://github.com/discordjs/discord.js/commit/${djsHash})`)
			.addField(`Framework: Akairo: ${akairoVersion}`, stripIndents`Commithash: \`${akairoHash}\`
				[view on GitHub](https://github.com/1Computer1/discord-akairo/commit/${akairoHash})`)
			.setFooter(`Coded with 🍵 by ${creator.username} | running on Node.js ${process.version}`, creator.displayAvatarURL());

		if (!embed.color && message.guild && message.guild.me!.displayColor) {
			embed.setColor(message.guild.me!.displayColor);
		}
		return message.util!.send(embed.applySpacers());
	}
}
export default VersionCommand;
