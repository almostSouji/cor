import { Command } from 'discord-akairo';
import { Message, Guild, Collection, GuildChannel, Constants, GuildMember, PresenceStatus } from 'discord.js';
import { CorEmbed } from '../../structures/CorEmbed';
import { groupBy, toTitleCase, displayStatus } from '../../util';
import { stripIndents } from 'common-tags';
import { format, formatDistanceStrict } from 'date-fns';
import { DATEFORMAT } from '../../util/constants';
import { CorClient } from '../../client/CorClient';

class GuildInfoCommand extends Command {
	private constructor() {
		super('guildinfo', {
			aliases: ['guildinfo', 'ginfo', 'serverinfo', 'server', 'guild'],
			description: {
				content: 'Display information about the server',
				usage: ''
			},
			cooldown: 5000,
			ratelimit: 2,
			channel: 'guild',
			clientPermissions: ['EMBED_LINKS']
		});
	}

	public buildInfoEmbed(guild: Guild): CorEmbed {
		const { members, channels } = guild;
		const channelCounts = groupBy(channels.cache, (c: GuildChannel) => c.type).map((v: Collection<string, GuildChannel>, k: string) => `${toTitleCase(k)} channels: ${v.size}`);
		const presenceCounts = groupBy(members.cache, (m: GuildMember): PresenceStatus => m.presence.status)
			.map((v: Collection<string, GuildMember>, k: PresenceStatus): string => `${displayStatus(this.client as CorClient, k, guild)}${v.size}`);
		const memberCounts = groupBy(members.cache, (m: GuildMember) => m.user.bot)
			.map((v: Collection<string, GuildMember>, k: boolean): string => `${k ? 'Bots:' : 'Humans:'} ${v.size}`);
		const roleCounts = `Roles: ${guild.roles.cache.size}`;
		const embed = new CorEmbed()
			.setThumbnail(guild.iconURL({ format: 'png', dynamic: true, size: 2048 })!)
			.addField('Server Information', stripIndents`
			Name: \`${guild.name}\`
			ID: ${guild.id}
			Created: ${formatDistanceStrict(guild.createdAt, Date.now(), { addSuffix: true })} (${format(guild.createdAt, DATEFORMAT.DAY)})
			Region: ${guild.region}
			Owner: \`${guild.owner?.user.tag}\`
			Verification: ${Constants.VerificationLevels[guild.verificationLevel]}
			`, true)
			.addField('Counts', channelCounts.concat(memberCounts, roleCounts).join('\n'), true)
			.addField('Members', presenceCounts.join('\n'));

		if (!embed.color && guild.me?.displayColor) {
			embed.setColor(guild.me.displayColor);
		}
		return embed.shorten();
	}

	public async exec(message: Message): Promise<Message | Message[]> {
		await message.guild!.members.fetch();
		return message.util!.send('', this.buildInfoEmbed(message.guild!));
	}
}
export default GuildInfoCommand;
