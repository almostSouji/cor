import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

/* eslint-disable @typescript-eslint/explicit-member-accessibility */

@Entity('tags')
export class DBTag {
	@PrimaryGeneratedColumn()
	id!: number;

	@Column()
	name!: string;

	@Column()
	content!: string;

	@Column({ nullable: true })
	aliases!: string;

	@Column()
	user!: string;

	@Column({ nullable: true })
	templated!: boolean;

	@Column({ nullable: true })
	hoisted!: boolean;

	@Column({ nullable: true })
	createdAt!: string;

	@Column({ nullable: true })
	updatedAt!: string;
}
