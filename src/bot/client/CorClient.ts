import { AkairoClient, CommandHandler, InhibitorHandler, ListenerHandler } from 'discord-akairo';
import { join } from 'path';
import { Setting } from '../models/Settings';
import { Guild, Message } from 'discord.js';
import { readdirSync } from 'fs';
import { createLogger, Logger, transports, format } from 'winston';
import { Connection } from 'typeorm';
import { TypeORMProvider } from '../structures/SettingsProvider';
import { connectionManager } from '../structures/Database';

interface CorConfig {
	token: string;
	hubGuildID: string;
	prefix: string;
	emojis: {
		online: string;
		offline: string;
		invisible: string;
		idle: string;
		dnd: string;
		streaming: string;
		crest: string;
		fail: string;
	};
}

declare module 'discord-akairo' {
	interface AkairoClient {
		logger: Logger;
		db: Connection;
		settings: TypeORMProvider;
		config: CorConfig;
		commandHandler: CommandHandler;
		listenerHandler: ListenerHandler;
	}
}

export class CorClient extends AkairoClient {
	public commandHandler: CommandHandler = new CommandHandler(this, {
		directory: join(__dirname, '..', 'commands'),
		prefix: (message: Message): string => this.settings.get(message.guild!, 'prefix', this.config.prefix),
		allowMention: true,
		handleEdits: true,
		commandUtil: true,
		commandUtilLifetime: 600000,
		ignorePermissions: this.ownerID
	});

	public inhibitorHandler = new InhibitorHandler(this, {
		directory: join(__dirname, '..', 'inhibitors'),
		automateCategories: true
	});

	public listenerHandler: ListenerHandler = new ListenerHandler(this, {
		directory: join(__dirname, '..', 'listeners'),
		automateCategories: true
	});

	public db: Connection;
	public settings!: TypeORMProvider;
	public config: CorConfig;
	public hubGuildID: string;
	public logger: Logger;

	public constructor(config: CorConfig) {
		super(
			{
				ownerID: '83886770768314368'
			},
			{
				disableEveryone: true,
				disabledEvents: ['TYPING_START']
			}
		);
		this.logger = createLogger({
			format: format.combine(
				format.colorize({ level: true }),
				format.timestamp({ format: 'YYYY/MM/DD HH:mm:ss' }),
				format.printf(
					(info): string => `[${info.timestamp}] ${info.level}: ${info.message}`
				)
			),
			transports: [new transports.Console()]
		});

		this.commandHandler.useInhibitorHandler(this.inhibitorHandler);
		this.commandHandler.useListenerHandler(this.listenerHandler);
		this.listenerHandler.setEmitters({
			commandHandler: this.commandHandler,
			inhibitorHandler: this.inhibitorHandler,
			listenerHandler: this.listenerHandler
		});
		this.commandHandler.loadAll();
		this.inhibitorHandler.loadAll();
		this.listenerHandler.loadAll();

		this.db = connectionManager.get('cor');
		this.config = config;
		this.hubGuildID = config.hubGuildID;
	}

	private get hubGuild(): Guild | undefined {
		return this.guilds.get(this.hubGuildID);
	}

	public async start(): Promise<string> {
		await this.db.connect();
		this.settings = new TypeORMProvider(this.db.getRepository(Setting));
		await this.settings.init();
		return this.login(this.config.token);
	}
}

const extensions = readdirSync(join(__dirname, '..', 'extensions'));
for (const ext of extensions) {
	require(join(__dirname, '..', 'extensions', ext));
}
