import { Inhibitor } from "discord-akairo";
import { Message } from "discord.js";

export default class BlacklistInhibitor extends Inhibitor {
  private constructor() {
    super("blacklist", { reason: "blacklist" });
  }
  public async exec(message: Message): Promise<boolean> {
    const bl = this.client.settings.get("global", "blacklist", []);
    return bl.includes(message.author.id);
  }
}
