import 'reflect-metadata';
import { CorClient, CorConfig } from './bot/client/CorClient';
import { resolve } from 'path';
import { config } from 'dotenv';
config({ path: resolve(__dirname, '../.env') });

const corConfig: CorConfig = {
	token: process.env.TOKEN!,
	hubGuildID: process.env.HUB_GUILD!,
	prefix: process.env.PREFIX!,
	emojis: {
		online: process.env.EMOJI_ONLINE!,
		offline: process.env.EMOJI_OFFLINE!,
		invisible: process.env.EMOJI_OFFLINE!,
		idle: process.env.EMOJI_IDLE!,
		dnd: process.env.EMOJI_DND!,
		streaming: process.env.EMOJI_STREAMING!,
		crest: process.env.EMOJI_CREST!,
		fail: process.env.EMOJI_FAIL!
	}
};

const client: CorClient = new CorClient(corConfig);
client.start();
