import {
  AkairoClient,
  CommandHandler,
  InhibitorHandler,
  ListenerHandler,
  SequelizeProvider
} from "discord-akairo";
import { join } from "path";
import database from "../structures/database";
import { Sequelize, Options } from "sequelize";
import { Guild } from "discord.js";
import { readdirSync } from "fs";
import { createLogger, Logger, transports, format } from 'winston';

interface CorConfig {
  dialect: Options["dialect"];
  connection: string;
  token: string;
  hubGuildID: string;
}

export default class CorClient extends AkairoClient {
  private commandHandler = new CommandHandler(this, {
    directory: join(__dirname, "..", "commands"),
    prefix: "!",
    allowMention: true,
    handleEdits: true,
    commandUtil: true,
    commandUtilLifetime: 600000,
    ignorePermissions: this.ownerID
  });

  private inihitorHandler = new InhibitorHandler(this, {
    directory: join(__dirname, "..", "listeners"),
    automateCategories: true
  });

  private listenerHandler = new ListenerHandler(this, {
    directory: join(__dirname, "..", "listeners"),
    automateCategories: true
  });

  public db: Sequelize;
  private guildSettings: SequelizeProvider;
  private config: CorConfig;
  public hubGuildID: string;
  public logger: Logger

  public constructor(config: CorConfig) {
    super(
      {
        ownerID: "83886770768314368"
      },
      {
        disableEveryone: true,
        disabledEvents: ["TYPING_START"]
      }
    );
    this.logger = createLogger({
      format: format.combine(
        format.colorize({level: true}),
        format.timestamp({format: 'YYYY/MM/DD HH:mm:ss'}),
        format.printf((info):string => `[${info.timestamp}] ${info.level}: ${info.message}`)
      ),
      transports: [new transports.Console()]
    });

    this.commandHandler.loadAll();
    this.listenerHandler.setEmitters({
      commandHandler: this.commandHandler,
      inhibitorHandler: this.inihitorHandler,
      listenerHandler: this.listenerHandler
    });

    this.db = database(config.dialect, config.connection);
    this.config = config;
    this.hubGuildID = config.hubGuildID;

    this.guildSettings = new SequelizeProvider(this.db.models.settings, {
      idColumn: "guild",
      dataColumn: "settings"
    });
  }

  private get hubGuild(): Guild | undefined {
    return this.guilds.get(this.hubGuildID);
  }

  public async start(): Promise<string> {
    return this.login(this.config.token);
  }
}

const extensions = readdirSync(join(__dirname, "..", "extensions"));
for (const ext of extensions) {
  require(join(__dirname, "..", "extensions", ext));
}
