import {
  Structures,
  Guild,
  Message,
  MessageAttachment,
  MessageEmbed
} from "discord.js";

declare module "discord.js" {
  export interface TextChannel {
    relayMessage(message: Message): Promise<Message | Message[]>;
  }
}

const CorTextChannel = Structures.extend(
  "TextChannel",
  (TextChannel): typeof TextChannel => {
    class CorTextChannel extends TextChannel {
      public constructor(guild: Guild, data: object) {
        super(guild, data);
      }

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
    return CorTextChannel;
  }
);

export { CorTextChannel };
