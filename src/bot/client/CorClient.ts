import { AkairoClient, CommandHandler, InhibitorHandler, ListenerHandler } from 'discord-akairo';
import { join } from 'path';
import { Setting } from '../models/Settings';
import { Tag } from '../models/Tags';
import { Guild, Message, CategoryChannel } from 'discord.js';
import { createLogger, Logger, transports, format } from 'winston';
import { Connection, Repository } from 'typeorm';
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
		schedule: Schedule;
		settings: TypeORMProvider;
		config: CorConfig;
		commandHandler: CommandHandler;
		listenerHandler: ListenerHandler;
		hubGuild: Guild | undefined;
		hubCategory: CategoryChannel | undefined;
		tags: Repository<Tag>;
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
				disableMentions: 'everyone'
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
			const reg = new RegExp('/(?<src>[^-]+)- ?(?<dest>[^-]+)- ?(?<cost>\d*)/');
			const match = reg.exec(phrase);
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
		return this.guilds.cache.get(this.hubGuildID);
	}

	public get hubCategory(): CategoryChannel | undefined {
		const channel = this.hubCategoryID && this.channels.cache.get(this.hubCategoryID);
		if (!(channel instanceof CategoryChannel)) {
			return undefined;
		}
		return channel;
	}

	public async start(): Promise<string> {
		await this.db.connect();
		await this.db.synchronize();
		this.settings = new TypeORMProvider(this.db.getRepository(Setting));
		this.schedule = new Schedule(this.db.getRepository(Task), this);
		this.tags = this.db.getRepository(Tag);
		const loginString = await this.login(this.config.token);
		await this.settings.init();
		await this.schedule.init();
		return loginString;
	}
}
