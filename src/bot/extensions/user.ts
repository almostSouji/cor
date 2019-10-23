import { Message, Structures, MessageAttachment, MessageEmbed } from 'discord.js';

declare module 'discord.js' {
	export interface User {
		relayMessage(message: Message): Promise<Message | Message[]>;
	}
}

const CorUser = Structures.extend(
	'User',
	(User): typeof User => {
		class CorUser extends User {
			public relayMessage(message: Message): Promise<Message | Message[]> {
				const additions: (MessageEmbed | MessageAttachment)[] = [];
				for (const embed of message.embeds) {
					additions.push(embed);
				}
				for (const attachment of message.attachments.values()) {
					additions.push(attachment);
				}
				return this.send(message.content, additions);
			}
		}
		return CorUser;
	}
);

export { CorUser };
