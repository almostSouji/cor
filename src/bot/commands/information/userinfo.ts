import { Command, Argument } from 'discord-akairo';
import { Message, GuildMember, User, Role, Activity, TextChannel } from 'discord.js';
import { CorEmbed } from '../../structures/CorEmbed';
import { MESSAGES, DATEFORMAT } from '../../util/constants';
import { stripIndents } from 'common-tags';
import { displayStatus, toTitleCase } from '../../util';
import { CorClient } from '../../client/CorClient';
import { formatDistanceStrict, format } from 'date-fns';

class UserInfoCommand extends Command {
	private constructor() {
		super('userinfo', {
			aliases: ['userinfo', 'uinfo'],
			description: {
				content: 'Display information about the provided user, or you if none is specified',
				usage: '',
				flags: {
					'`-c`,`--color`': 'Use target role color',
					'`-bl`,`--blacklist`': 'Show blacklist status (Owner only)'
				}
			},
			cooldown: 5000,
			ratelimit: 2,
			clientPermissions: ['EMBED_LINKS', 'SEND_MESSAGES'],
			before: async (message: Message) => {
				if (message.channel instanceof TextChannel) {
					await message.channel.guild.members.fetch();
				}
			},
			args: [
				{
					'id': 'member',
					'type': Argument.union('member', 'user', 'string'),
					'default': (message: Message) => message.member || message.author
				},
				{
					id: 'color',
					match: 'flag',
					flag: ['-c', '--color']
				},
				{
					id: 'blacklist',
					match: 'flag',
					flag: ['-bl', '--blacklist']
				}
			]
		});
	}

	public buildInfoEmbed(member: GuildMember | User, blacklist: boolean): CorEmbed {
		const embed = this.buildUserEmbed(member instanceof GuildMember ? member.user : member);
		if (member instanceof GuildMember) {
			this.enhanceToMemberEmbed(embed, member);
		}
		if (blacklist) {
			const bl = this.client.settings.get('global', 'blacklist', []);
			embed.addFields({ name: 'Blacklist status', value: bl.includes(member.id) ? MESSAGES.COMMANDS.USERINFO.BLACKLIST.BLACKLISTED : MESSAGES.COMMANDS.USERINFO.BLACKLIST.NOT_BLACKLISTED });
		}
		return embed.shorten();
	}

	public buildUserEmbed(user: User): CorEmbed {
		let infoString = stripIndents`
			Profile: ${user}
			ID: ${user.id}
			Tag: \`${user.tag}\`
			Status: ${toTitleCase(user.presence.status)}${displayStatus(this.client as CorClient, user.presence.status, null)}
			Created: ${formatDistanceStrict(user.createdAt, Date.now(), { addSuffix: true })} (${format(user.createdAt, DATEFORMAT.DAY)})`;
		if (this.client.isOwner(user)) {
			infoString += `\nBot Owner`;
		}
		const embed = new CorEmbed()
			.setThumbnail(user.displayAvatarURL())
			.addFields({ name: `${user.bot ? 'Bot' : 'User'} Information`, value: infoString });
		return embed;
	}

	public enhanceToMemberEmbed(embed: CorEmbed, member: GuildMember): CorEmbed {
		let infoString = '';
		if (member.nickname) {
			infoString += `Nickname: \`${member.nickname}\``;
		}
		if (infoString) {
			infoString += '\n';
		}
		infoString += `Joined: ${formatDistanceStrict(member.joinedAt!, Date.now(), { addSuffix: true })} (${format(member.joinedAt!, DATEFORMAT.DAY)})`;
		const roleList = member.roles.cache
			.filter((role: Role) => role.id !== role.guild.id)
			.map((role: Role) => `\`${role.name}\``);
		if (roleList.length) {
			infoString += `\nRoles [${roleList.length}]: ${roleList.join(', ')}`;
		}
		if (member.voice.channel) {
			infoString += `\nVoice channel: ${member.voice.channel.name}`;
		}
		if (member.guild.ownerID === member.id) {
			infoString += `\nGuild Owner \\👑`;
		}
		embed.addFields({ name: 'Member Information', value: infoString, inline: true });
		if (member.presence?.activities.length) {
			let activity = member.presence.activities.find(activity => activity.name === 'Spotify' && activity.type === 'LISTENING');
			if (!activity) {
				activity = member.presence.activities.find(activity => activity.type !== 'CUSTOM_STATUS');
			}
			if (!activity) {
				activity = member.presence.activities[0];
			}
			if (activity) {
				embed = this.addPresence(embed, activity);
			}
		}
		return embed;
	}

	public addPresence(embed: CorEmbed, activity: Activity): CorEmbed {
		const { name, type, timestamps, details, state, assets, emoji } = activity;
		if (name === 'Spotify' && type === 'LISTENING') {
			const { start, end } = timestamps!;
			const now = Date.now();
			const timeIn = format(now - start!.valueOf(), 'mm:ss');
			const duration = format(end!.valueOf() - start!.valueOf(), 'mm:ss');
			const activityString = stripIndents`
				listening to Spotify (${timeIn}/${duration})
				Title: ${details}
				By: ${state}`;
			return embed.addFields({ name: 'Song Information', value: activityString })
				.setFooter(`Album:\n${assets?.largeText}`, assets!.largeImageURL()!);
		}
		if (type === 'CUSTOM_STATUS') {
			if (emoji?.id) {
				return embed.setFooter(state || '\u200B', `https://cdn.discordapp.com/emojis/${emoji.id}.${emoji.animated ? 'gif' : 'png'}`);
			}
			if (emoji) {
				return embed.setFooter(`${emoji} ${state || ''}`);
			}
			return embed;
		}
		let activityString = '';
		if (timestamps?.start) {
			if (timestamps?.end) {
				const now = Date.now();
				const timeIn = format(now - timestamps.start.valueOf(), 'mm:ss');
				const duration = format(timestamps.end.valueOf() - timestamps.start.valueOf(), 'mm:ss');
				activityString += `Duration: ${timeIn}/${duration}`;
			} else {
				activityString += `Since: ${formatDistanceStrict(timestamps.start, Date.now(), { addSuffix: true })}`;
			}
		}
		if (state) {
			activityString += `\n${state}`;
		}
		if (details) {
			activityString += `\n${details}`;
		}
		if (assets) {
			const { smallText, largeText, smallImage, largeImage } = assets;
			let footerString = '';
			if (largeText && smallText) {
				footerString += `\n${largeText} (${smallText})`;
			} else if (largeText && !smallText) {
				footerString += `\n${largeText}`;
			} else if (!largeText && smallText) {
				footerString += `\n${smallText}`;
			}

			if (largeImage) {
				embed.setFooter(footerString, assets.largeImageURL()!);
			} else if (smallImage) {
				embed.setFooter(footerString, assets.smallImageURL()!);
			}
		}
		return embed.addFields({ name, value: activityString });
	}

	public async exec(message: Message, { member, blacklist }: {member: GuildMember | User | string; blacklist: boolean}): Promise<Message | Message[]> {
		if (blacklist && !this.client.isOwner(message.author)) {
			blacklist = false;
		}
		if (member instanceof GuildMember || member instanceof User) {
			return message.util!.send(this.buildInfoEmbed(member, blacklist));
		}
		try {
			const fetchedUser = await this.client.users.fetch(member);
			return message.util!.send(this.buildInfoEmbed(fetchedUser, blacklist));
		} catch {
			const embed = await this.buildInfoEmbed(message.member || message.author, blacklist);
			embed.setFooter(MESSAGES.COMMANDS.USERINFO.RANDOM_FOOTER, this.client.user?.displayAvatarURL());
			return message.util!.send(embed);
		}
	}
}
export default UserInfoCommand;
