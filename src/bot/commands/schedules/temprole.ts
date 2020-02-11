import { Command, Argument } from 'discord-akairo';
import { Message, Role, GuildMember, Util, Collection } from 'discord.js';
import { MESSAGES, PROMPT_ANSWERS_ALL, PROMPT_ANSWERS, COMMANDS, DATEFORMAT, TIMEZONE } from '../../util/constants';
import ms = require('ms');
import { CorEmbed } from '../../structures/CorEmbed';
import { format } from 'date-fns';
import { Task } from '../../models/Tasks';

class TempRoleCommand extends Command {
	private constructor() {
		super('temprole', {
			aliases: [
				'temprole',
				'tmpr'
			],
			description: {
				content: 'Create and Assign a role until given date (the role can be provided as role data: `"role name,color"`, `--list` lists active role tasks for provided user (if provided, else for guild), `--delete` causes the role to be deleted when the task expires and the bot has the ability to do so).',
				usage: '[target] [role] [duration] [--list] [--delete]'
			},
			channel: 'guild',
			args: [
				{
					id: 'target',
					type: Argument.union('member', 'string')
				},
				{
					id: 'role',
					type: Argument.union('role', 'string')
				},
				{
					id: 'duration',
					type: (_, str): number | string => {
						if (!str) return str;
						const duration = ms(str);
						if (duration && !isNaN(duration)) return duration;
						return str;
					}
				},
				{
					id: 'list',
					match: 'flag',
					flag: ['--list', '-l', '-ls']
				},
				{
					id: 'deleteRole',
					match: 'flag',
					flag: ['--delete', '-d']
				}
			],
			userPermissions: ['MANAGE_ROLES'],
			clientPermissions: ['MANAGE_ROLES', 'EMBED_LINKS']
		});
	}

	public async buildInfoEmbed(message: Message, tasks: Collection<number, Task>): Promise<CorEmbed> {
		const embed = new CorEmbed();
		const taskDisplay = [];
		for (const [, task] of tasks) {
			try {
				const member = await message.guild!.members.fetch(task.targetid);
				taskDisplay.push(`• User: \`${member.user.tag}\`, Role: <@&${task.roleid}>\nExpires: ${format(task.timestamp, DATEFORMAT.MINUTE)} (${TIMEZONE})${task.deleterole ? COMMANDS.TEMPROLE.DELETE_SUFFIX : ''}`);
			} catch (_) { }
		}
		embed.setDescription(taskDisplay.join('\n'));
		embed.setFooter(MESSAGES.COMMANDS.TEMPROLE.DELETE_NOTICE);
		return embed.shorten();
	}

	public async exec(message: Message,	{ role, duration, target, list, deleteRole }: { role: Role | string; duration: number | string; target: GuildMember | string; list: boolean; deleteRole: boolean }): Promise<Message | Message[]> {
		if (target && typeof target === 'string') {
			try {
				target = await message.guild!.members.fetch(target);
			} catch (_) {
				return message.util!.send(MESSAGES.ERRORS.RESOLVE(target as string, 'member'));
			}
		}
		const member = target as GuildMember;
		if (list) {
			const guildTasks = this.client.schedule.filter(task => Boolean(task.roleid && message.guild!.roles.cache.has(task.roleid)));
			if (!guildTasks.size) {
				return message.util!.send(MESSAGES.COMMANDS.TEMPROLE.ERRORS.NO_TASKS(message.guild!.name));
			}
			if (target) {
				const targetTasks = guildTasks.filter(task => task.targetid === member.id);
				if (!targetTasks.size) {
					return message.util!.send(MESSAGES.COMMANDS.TEMPROLE.ERRORS.NO_TARGET_TASKS(member.user.tag));
				}
				return message.util!.send(await this.buildInfoEmbed(message, targetTasks));
			}
			return message.util!.send(await this.buildInfoEmbed(message, guildTasks));
		}
		if (!target) {
			return message.util!.send(MESSAGES.ERRORS.TARGET('user to apply the role to'));
		}
		if (!role) {
			return message.util!.send(MESSAGES.ERRORS.TARGET('role to apply'));
		}
		if (!duration) {
			return message.util!.send(MESSAGES.ERRORS.TARGET('duration'));
		}
		if (typeof role === 'string') {
			if (!role.includes(',')) {
				return message.util!.send(MESSAGES.ERRORS.RESOLVE(role, 'role'));
			}
			const [name, colorValue] = role.split(',');
			try {
				const color = Util.resolveColor(colorValue);
				if (isNaN(color)) {
					throw new Error('Invalid Color');
				}
				role = await message.guild!.roles.create({
					data: {
						name, color,
						permissions: []
					}
				});
			} catch (_) {
				return message.util!.send(MESSAGES.ERRORS.RESOLVE(colorValue, 'color'));
			}
		}
		if (typeof duration === 'string') {
			return message.util!.send(MESSAGES.ERRORS.RESOLVE(duration, 'duration'));
		}
		if (duration < COMMANDS.TEMPROLE.MIN_DURATION) {
			return message.util!.send(MESSAGES.COMMANDS.TEMPROLE.ERRORS.TOO_SHORT);
		}

		if (!role.editable) {
			return message.util!.send(MESSAGES.COMMANDS.TEMPROLE.ERRORS.NOT_MANAGEABLE(role.name));
		}
		const isOwner = message.member!.id === message.guild!.ownerID;
		const positionCheck = message.member!.roles.highest.position >= role.position;
		if (!isOwner && !positionCheck) {
			return message.util!.send(MESSAGES.COMMANDS.TEMPROLE.ERRORS.AUTH);
		}
		const task = this.client.schedule.find(task => task.roleid === (role as Role).id && task.targetid === member.id);
		if (task) {
			message.util!.send(MESSAGES.COMMANDS.TEMPROLE.PROMPT(role.name, member.user.tag, task));

			try {
				const filter = (msg: Message): boolean => msg.author!.id === message.author!.id && PROMPT_ANSWERS_ALL.includes(msg.content);
				const collected = await message.channel.awaitMessages(filter, { max: 1, time: 20000, errors: ['time'] });
				if (!PROMPT_ANSWERS.GRANTED.includes(collected.first()!.content)) {
					throw new Error('Negative user input');
				}
			} catch (error) {
				if (error.message === 'Negative user input') {
					return message.util!.send(MESSAGES.ERRORS.CANCEL);
				}
				return message.util!.send(MESSAGES.ERRORS.CANCEL_WITH_ERROR('timeout'));
			}
		}
		if (!member.roles.cache.has(role.id)) {
			member.roles.add(role.id);
		}
		const schedule = this.client.schedule;
		const entry = await schedule.add({
			user: message.author!,
			timestamp: Date.now() + duration,
			role,
			target: member.user,
			guild: message.guild!,
			deleterole: deleteRole
		});
		if (!entry) {
			return message.util!.send(MESSAGES.COMMANDS.TEMPROLE.ERRORS.NO_ENTRY);
		}
		return message.util!.send(MESSAGES.COMMANDS.TEMPROLE.SUCCESS(role.name, member.user.tag, entry, entry.deleterole));
	}
}
export default TempRoleCommand;
