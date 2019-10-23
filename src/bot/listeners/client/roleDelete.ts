import { Listener } from 'discord-akairo';
import { Role } from 'discord.js';

class RoleDeleteListener extends Listener {
	private constructor() {
		super('roleDelete', {
			emitter: 'client',
			event: 'roleDelete'
		});
	}

	public exec(role: Role): void {
		const affectedTasks = this.client.schedule.filter(task => Boolean(task.roleid && task.roleid === role.id));
		for (const [, task] of affectedTasks) {
			this.client.schedule.deleteTask(task);
		}
	}
}

module.exports = RoleDeleteListener;
