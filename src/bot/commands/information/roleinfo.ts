import { Command } from 'discord-akairo';
import { Message, Role, Guild, Collection, PresenceStatus, GuildMember } from 'discord.js';
import { CorEmbed } from '../../structures/CorEmbed';
import { MESSAGES, DATEFORMAT } from '../../util/constants';
import { groupBy, displayStatus } from '../../util';
import { CorClient } from '../../client/CorClient';
import { stripIndents } from 'common-tags';
import { formatDistanceStrict, format } from 'date-fns';

class RoleInfoCommand extends Command {
	private constructor() {
		super('roleinfo', {
			aliases: ['rinfo', 'role', 'roleinfo'],
			description: {
				content: 'Display information about the provided role, a random one if unable to resolve',
				usage: '[role] [--color]',
				flags: {
					'`-c`, `--color`': 'use the role color of the targeted role'
				}
			},
			cooldown: 5000,
			ratelimit: 2,
			clientPermissions: ['EMBED_LINKS'],
			channel: 'guild',
			args: [
				{
					id: 'role',
					type: 'role'
				},
				{
					id: 'color',
					match: 'flag',
					flag: ['-c', '--color']
				}
			]
		});
	}

	public buildInfoEmbed(role: Role | null, guild: Guild, color: boolean): CorEmbed {
		const embed = new CorEmbed();
		if (!role) {
			role = guild.roles.cache.random();
			embed.setFooter(MESSAGES.COMMANDS.ROLEINFO.RANDOM_FOOTER, this.client.user?.displayAvatarURL());
		}
		let infoString = stripIndents`
			Name: \`${role.name}\`
			ID: ${role.id}
			Mention: ${role.toString()}
			Created: ${formatDistanceStrict(role.createdAt, Date.now(), { addSuffix: true })} (${format(role.createdAt, DATEFORMAT.DAY)})`;
		if (role.color) {
			infoString += `\nColor: ${role.hexColor} (${role.color})`;
		}
		embed.addField('Role Information', infoString);
		if (role.members.size) {
			const members = groupBy(role.members, (m: GuildMember) => m.presence.status)
				.map((v: Collection<string, GuildMember>, k: PresenceStatus) => `${displayStatus(this.client as CorClient, k, guild)} ${v.size}`);
			embed.addField('Members', members);
		}
		if (role.color && (!embed.color || color)) {
			embed.setColor(role.color);
		}
		return embed.shorten();
	}

	public async exec(message: Message, { role, color }: {role: Role | null; color: boolean}): Promise<Message | Message[]> {
		await message.guild!.members.fetch();
		return message.util!.send('', this.buildInfoEmbed(role, message.guild!, color));
	}
}
export default RoleInfoCommand;
