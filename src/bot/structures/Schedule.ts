import { Task } from '../models/Tasks';
import { Repository } from 'typeORM';
import { User, Role } from 'discord.js';
import Collection from '@discordjs/collection';

export interface TaskArguments {
	user: User;
	date: number;
	timestamp: number;
	role: Role | null;
	target: User | null;
	message: string | null;
	command: string | null;
}

export class Schedule {
	public repo: Repository<Task>;
	public tasks: Collection<number, Task>;

	public constructor(repository: Repository<Task>) {
		this.repo = repository;
		this.tasks = new Collection();
	}

	public async init(): Promise<void> {
		const tasks = await this.repo.find();
		for (const task of tasks) {
			this.tasks.set(task.id, task);
		}
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
				command: args.command || undefined
			};
			const entry = await this.repo.create(task);
			await this.repo.save(entry);
			this.tasks.set(entry.id, entry);
			return entry;
		} catch (_) {
			return undefined;
		}
	}

	public async fulfill(taskID: number): Promise<void> {
		this.repo.delete({ id: taskID });
		this.tasks.delete(taskID);
	}

	public get(taskID: number): Task | undefined {
		return this.tasks.get(taskID);
	}

	public find(fun: (value: Task, key: number, collection: Collection<number, Task>) => boolean): Task | undefined {
		return this.tasks.find(fun);
	}
}
