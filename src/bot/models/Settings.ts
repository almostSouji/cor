import { Entity, Column, PrimaryColumn } from 'typeorm';

/* eslint-disable @typescript-eslint/explicit-member-accessibility */

@Entity('settings')
export class Setting {
	@PrimaryColumn()
	guild!: string;

	@Column()
	settings!: string;
}
