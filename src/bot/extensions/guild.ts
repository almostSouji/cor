import { Structures, User} from "discord.js";
import CorClient from "../client/CorClient";

declare module 'discord.js' {
	export interface Guild {
		isHub: boolean;
	}
}

export default Structures.extend(
  "Guild",
  (Guild):typeof Guild => {
    class CorGuild extends Guild {
      public lockedUsers: Set<User>;
      public constructor(client: CorClient, data: object) {
        super(client, data);
        this.lockedUsers = new Set();
      }

      public get isHub(): boolean {
        return this.id === (this.client as CorClient).hubGuildID;
      }
    }
    return CorGuild;
  }
);
