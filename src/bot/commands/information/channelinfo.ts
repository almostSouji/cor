import { Command } from 'discord-akairo';
import {
	Message, Channel, GuildChannel, DMChannel, TextChannel, VoiceChannel, GuildMember,
	Collection, PresenceStatus
} from 'discord.js';
import { CorEmbed } from '../../structures/CorEmbed';
import { formatDistanceStrict, format } from 'date-fns';
import { DATEFORMAT, MESSAGES } from '../../util/constants';
import { stripIndents } from 'common-tags';
import { groupBy, displayStatus, toTitleCase } from '../../util';
import { CorClient } from '../../client/CorClient';

class ChannelInfoCommand extends Command {
	private constructor() {
		super('channelinfo', {
			aliases: ['channelinfo', 'cinfo'],
			description: {
				content: 'Display information about the provided channel, the current one if none is provided',
				usage: ''
			},
			cooldown: 5000,
			ratelimit: 2,
			clientPermissions: ['EMBED_LINKS', 'SEND_MESSAGES'],
			args: [
				{
					'id': 'channel',
					'type': 'channel',
					'default': (message: Message) => message.channel
				}
			]
		});
	}

	public buildInfoEmbed(channel: Channel): CorEmbed {
		const embed = new CorEmbed();
		let infoString = '';
		if (channel instanceof GuildChannel) {
			infoString += `Name: \`${channel.name}\``;
		}
		if (channel instanceof DMChannel) {
			infoString += `DM with \`${channel.recipient.tag}\``;
		}

		infoString += `\nID: ${channel.id}`;
		if (channel instanceof GuildChannel) {
			infoString += `\nType: ${channel.type}`;
		}
		if (channel instanceof TextChannel) {
			infoString += `\nMention: ${channel}`;
		}
		infoString += `\nCreated: ${formatDistanceStrict(channel.createdAt, Date.now(), { addSuffix: true })} (${format(channel.createdAt, DATEFORMAT.DAY)})`;
		embed.addFields({ name: 'Channel Information', value: infoString });

		if (channel instanceof VoiceChannel) {
			let voiceString = `Bitrate: ${channel.bitrate / 1000} kbps`;
			if (channel.userLimit) {
				voiceString += `\nCapacity: \`${channel.members.size.toString().padStart(2, '0')}/${channel.userLimit.toString().padStart(2, '0')}\``;
			}
			embed.addFields({ name: 'Voice Information', value: voiceString, inline: false });
		}
		if (channel instanceof TextChannel && channel.topic) {
			embed.addFields({ name: 'Channel Topic', value: channel.topic, inline: false });
		}
		if (channel instanceof GuildChannel) {
			if (channel.parent) {
				embed.addFields({
					name: 'Parent Information',
					value: stripIndents`
						Name: \`${channel.parent.name}\`
						ID: ${channel.parentID}
						Permissions synchronized: ${channel.permissionsLocked}`,
					inline: false
				});
			}
			if (channel.members.size) {
				const members = groupBy(channel.members, (m: GuildMember) => m.presence.status)
					.map((v: Collection<string, GuildMember>, k: PresenceStatus) => `${displayStatus(this.client as CorClient, k, channel.guild)} ${v.size}`);
				embed.addFields({
					name: 'Members',
					value: members
				});
			}
			if (!embed.color && channel.guild.me?.displayColor) {
				embed.setColor(channel.guild.me.displayColor);
			}
		}
		if (channel instanceof DMChannel) {
			const { recipient } = channel;
			embed.addFields({
				name: 'Recipient Information',
				value: stripIndents`
					ID: ${recipient.id}
					Profile: ${recipient}
					Status: ${toTitleCase(recipient.presence.status)}${displayStatus(this.client as CorClient, recipient.presence.status, null)}
					Created: ${formatDistanceStrict(recipient.createdAt, Date.now(), { addSuffix: true })} (${format(recipient.createdAt, DATEFORMAT.DAY)})`
			});
		}

		return embed.shorten();
	}

	public async exec(message: Message, { channel }: {channel: Channel}): Promise<Message | Message[]> {
		if (channel instanceof GuildChannel) {
			if (!channel.permissionsFor(message.author)?.has('VIEW_CHANNEL')) {
				return message.util!.send(MESSAGES.COMMANDS.CHANNELINFO.ERRORS.NO_PERMISSION(channel));
			}
			await channel.guild.members.fetch();
		}
		return message.util!.send('', this.buildInfoEmbed(channel));
	}
}
export default ChannelInfoCommand;
