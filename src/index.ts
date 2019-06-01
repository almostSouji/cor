import { CorClient } from './bot/client/CorClient';
import * as config from './bot/config.json';
import 'reflect-metadata';

const client: CorClient = new CorClient(config);
client.start();
