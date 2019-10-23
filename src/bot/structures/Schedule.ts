import { Task } from '../models/Tasks';
import { Repository } from 'typeORM';
import { User, Role, Guild, Collection } from 'discord.js';
import { AkairoClient } from 'discord-akairo';

export interface TaskArguments {
	user: User;
	timestamp: number;
	role?: Role;
	target?: User;
	message?: string;
	command?: string;
	guild?: Guild;
	deleterole?: boolean;
}

export class Schedule {
	public repo: Repository<Task>;
	public tasks: Collection<number, Task>;
	public client: AkairoClient;
	public interval?: NodeJS.Timer;

	public constructor(repository: Repository<Task>, client: AkairoClient) {
		this.repo = repository;
		this.tasks = new Collection();
		this.client = client;
	}

	public setInterval(): void {
		this.interval = this.client.setInterval(() => {
			for (const [, task] of this.tasks) {
				if (task.timestamp <= Date.now()) {
					this.fulfill(task);
				}
			}
		}, 5000);
	}

	public async init(): Promise<void> {
		const tasks = await this.repo.find();
		for (const task of tasks) {
			if (task.guildid && task.roleid) {
				const guild = this.client.guilds.get(task.guildid);
				if (!guild || !guild.roles.has(task.roleid)) {
					this.deleteTask(task);
					continue;
				}
			}
			this.tasks.set(task.id, task);
		}
		if (!this.tasks.size) return;
		this.setInterval();
	}

	public async add(args: TaskArguments): Promise<Task | undefined> {
		try {
			const task = {
				userid: args.user.id,
				timestamp: args.timestamp,
				createdTimestamp: Date.now(),
				targetid: args.target ? args.target.id : undefined,
				roleid: args.role ? args.role.id : undefined,
				message: args.message || undefined,
				command: args.command || undefined,
				guildid: args.guild ? args.guild.id : undefined,
				deleterole: args.deleterole || false
			};
			const entry = await this.repo.create(task);
			await this.repo.save(entry);
			this.tasks.set(entry.id, entry);
			if (!this.interval) {
				this.setInterval();
			}
			return entry;
		} catch (_) {
			return undefined;
		}
	}

	public async deleteTask(task: Task): Promise<void> {
		this.repo.delete({ id: task.id });
		this.tasks.delete(task.id);
	}

	public async fulfill(task: Task): Promise<void> {
		if (task.roleid && task.guildid && task.targetid) {
			const guild = this.client.guilds.get(task.guildid);
			if (!guild) return this.deleteTask(task);

			const role = guild.roles.get(task.roleid);
			if (!role || !role.editable) return this.deleteTask(task);
			try {
				if (task.deleterole) {
					await role.delete();
				}
				const member = await guild.members.fetch(task.targetid);
				if (member.roles.has(task.roleid)) {
					await member.roles.remove(task.roleid);
				}
				if (task.message) {
					await member.send(task.message);
				}
			} catch (_) { }
		} else if (task.message && task.command === 'dm') {
			try {
				const user = await this.client.users.fetch(task.userid);
				await user.send(task.message);
			} catch (_) { }
		}
		this.deleteTask(task);
	}

	public get(taskID: number): Task | undefined {
		return this.tasks.get(taskID);
	}

	public find(fun: (value: Task, key: number, collection: Collection<number, Task>) => boolean): Task | undefined {
		return this.tasks.find(fun);
	}

	public filter(fun: (value: Task, key: number, collection: Collection<number, Task>) => boolean): Collection<number, Task> {
		return this.tasks.filter(fun);
	}
}
