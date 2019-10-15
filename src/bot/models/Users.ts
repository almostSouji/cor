import { Entity, Column, PrimaryColumn } from 'typeorm';

/* eslint-disable @typescript-eslint/explicit-member-accessibility */

@Entity('users')
export class User {
	@PrimaryColumn()
	userid!: string;

	@Column()
	channelid!: string;
}
