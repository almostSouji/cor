import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

/* eslint-disable @typescript-eslint/explicit-member-accessibility */

@Entity('tags')
export class Tag {
	@PrimaryGeneratedColumn()
	id!: number;

	@Column()
	name!: string;

	@Column()
	content!: string;

	@Column()
	aliases!: string;

	@Column()
	user!: string;

	@Column()
	templated!: boolean;

	@Column()
	hoisted!: boolean;

	@Column()
	createdAt!: string;

	@Column()
	updatedAt!: string;
}
