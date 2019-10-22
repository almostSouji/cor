import { Listener } from 'discord-akairo';
import { Message, TextChannel } from 'discord.js';
import { MESSAGES, DISCORD_LIMITS } from '../../util/constants';
import { CorClient } from '../../client/CorClient';
import { User } from '../../models/Users';

class MessageInvalidListener extends Listener {
	private constructor() {
		super('messageInvalid', {
			emitter: 'commandHandler',
			event: 'messageInvalid'
		});
	}

	public async exec(message: Message): Promise<Message|Message[]|undefined> {
		const client = this.client as CorClient;
		const repo = client.db.getRepository(User);
		if (message.channel.type === 'dm') {
			if (message.author!.bot) return;
			const hubGuild = client.hubGuild;
			if (!hubGuild) {
				this.client.logger.warn(MESSAGES.LOGGER('NO HUB', 'Hub guild expected, none found!'));
				return;
			}

			const userQuery = await repo.findOne({
				select: ['channelid'],
				where: {
					userid: message.author!.id
				}
			});
			if (!userQuery || !userQuery.channelid || !this.client.channels.get(userQuery.channelid)) {
				if (hubGuild.channels.size >= DISCORD_LIMITS.MAX_CHANNELS) {
					return message.channel.send(MESSAGES.LISTENERS.MESSAGE_INVALID.ERRORS.MAX_CHANNELS);
				}
				const channel = await hubGuild.channels.create(`${message.author!.id}`, {
					topic: MESSAGES.LISTENERS.MESSAGE_INVALID.TOPIC(message.author!),
					parent: client.hubCategory
				});

				const newUser = repo.create({
					userid: message.author!.id,
					channelid: channel.id
				});
				await repo.save(newUser);
				return channel.relayMessage(message);
			}
			const channel = this.client.channels.get(userQuery.channelid) as TextChannel;
			return channel.relayMessage(message);
		}
		if (message.channel.type === 'text' && message.guild!.isHub) {
			const channelQuery = await repo.findOne({
				select: ['userid'],
				where: {
					channelid: message.channel.id
				}
			});
			if (!channelQuery) return;
			try {
				const user = await this.client.users.fetch(channelQuery.userid);
				if (!user) {
					throw new Error('invalid user');
				}
				user.relayMessage(message).catch(() => message.channel.send(MESSAGES.LISTENERS.MESSAGE_INVALID.ERRORS.NO_CONNECTION(user)));
			} catch (_) {
				return message.channel.send(MESSAGES.LISTENERS.MESSAGE_INVALID.ERRORS.NO_RECIPIENT);
			}
		}
	}
}

module.exports = MessageInvalidListener;
