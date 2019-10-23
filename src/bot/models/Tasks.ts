import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

/* eslint-disable @typescript-eslint/explicit-member-accessibility */

@Entity('tasks')
export class Task {
	@PrimaryGeneratedColumn()
	id!: number;

	@Column()
	userid!: string;

	@Column()
	createdTimestamp!: number;

	@Column()
	timestamp!: number;

	@Column({ nullable: true })
	targetid!: string;

	@Column({ nullable: true })
	roleid!: string;

	@Column({ nullable: true })
	guildid!: string;

	@Column({ nullable: true })
	message!: string;

	@Column({ nullable: true })
	command!: string;

	@Column()
	deleterole!: boolean;
}
