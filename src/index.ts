import 'reflect-metadata';
import { CorClient, CorConfig } from './bot/client/CorClient';
import { resolve } from 'path';
import { config } from 'dotenv';
import { EMOJIS } from './bot/util/constants';
config({ path: resolve(__dirname, '../.env') });

const corConfig: CorConfig = {
	token: process.env.TOKEN!,
	owner: process.env.OWNER!,
	hubGuildID: process.env.HUB_GUILD!,
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

const client: CorClient = new CorClient(corConfig);
client.start();
