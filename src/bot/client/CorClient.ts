import { AkairoClient, CommandHandler, InhibitorHandler, ListenerHandler } from 'discord-akairo';
import { join, extname } from 'path';
import { Setting } from '../models/Settings';
import { Guild, Message, CategoryChannel } from 'discord.js';
import { readdirSync } from 'fs';
import { createLogger, Logger, transports, format } from 'winston';
import { Connection } from 'typeorm';
import { TypeORMProvider } from '../structures/SettingsProvider';
import { connectionManager } from '../structures/Database';
import { Schedule } from '../structures/Schedule';
import { Task } from '../models/Tasks';

export interface CorConfig {
	token: string;
	owner: string;
	hubGuildID: string;
	hubCategoryID: string;
	prefix: string;
	emojis: {
		online: string;
		offline: string;
		invisible: string;
		idle: string;
		dnd: string;
		streaming: string;
		auth: string;
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
		hubGuild: Guild | undefined;
		hubCategory: CategoryChannel | undefined;
	}
}

export class CorClient extends AkairoClient {
	public commandHandler: CommandHandler = new CommandHandler(this, {
		directory: join(__dirname, '..', 'commands'),
		prefix: (message: Message): string => this.settings.get(message.guild!, 'prefix', this.config.prefix),
		automateCategories: true,
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
	public schedule!: Schedule;
	public config: CorConfig;
	public hubGuildID: string;
	public hubCategoryID: string | null;
	public logger: Logger;

	public constructor(config: CorConfig) {
		super(
			{
				ownerID: config.owner
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

		this.commandHandler.resolver.addType('dijkstraVector', (_, phrase) => {
			if (!phrase) return null;
			const reg = /(?<src>[^-]+)- ?(?<dest>[^-]+)- ?(?<cost>\d*)/;
			const match = phrase.match(reg);
			if (!match) return null;
			const costNum = parseInt(match.groups!.cost, 10);
			return {
				src: match.groups!.src,
				dest: match.groups!.dest,
				cost: costNum
			};
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
		this.hubCategoryID = config.hubCategoryID || null;
	}

	public get hubGuild(): Guild | undefined {
		return this.guilds.get(this.hubGuildID);
	}

	public get hubCategory(): CategoryChannel | undefined {
		const channel = this.hubCategoryID && this.channels.get(this.hubCategoryID);
		if (!(channel instanceof CategoryChannel)) {
			return undefined;
		}
		return channel;
	}

	public async start(): Promise<string> {
		await this.db.connect();
		await this.db.synchronize();
		this.settings = new TypeORMProvider(this.db.getRepository(Setting));
		this.schedule = new Schedule(this.db.getRepository(Task));
		await this.settings.init();
		await this.schedule.init();
		return this.login(this.config.token);
	}
}

const extensions = readdirSync(join(__dirname, '..', 'extensions'));
for (const ext of extensions.filter(file => extname(file).toLowerCase() === 'js')) {
	require(join(__dirname, '..', 'extensions', ext));
}
