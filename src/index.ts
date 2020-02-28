import 'reflect-metadata';
import { CorClient, CorConfig } from './bot/client/CorClient';
import { config } from 'dotenv';
import { EMOJIS } from './bot/util/constants';
import { resolve, extname, join } from 'path';
import { readdirSync } from 'fs';
config({ path: resolve(__dirname, '../.env') });

const corConfig: CorConfig = {
	token: process.env.TOKEN!,
	owner: process.env.OWNER!,
	hubGuildID: process.env.HUB_GUILD!,
	hubCategoryID: process.env.HUB_CATEGORY!,
	prefix: process.env.PREFIX!,
	emojis: {
		online: EMOJIS.ONLINE,
		offline: EMOJIS.OFFLINE,
		invisible: EMOJIS.INVISIBLE,
		idle: EMOJIS.IDLE,
		dnd: EMOJIS.DND,
		streaming: EMOJIS.STREAMING,
		auth: EMOJIS.AUTH
	}
};

async function setup() {
	const extensions = readdirSync(join(__dirname, 'bot', 'extensions'));
	for (const ext of extensions.filter(file => ['.js', '.ts'].includes(extname(file)))) {
		await import(join(__dirname, 'bot', 'extensions', ext));
	}

	const client: CorClient = new CorClient(corConfig);
	client.start();
}

setup();
