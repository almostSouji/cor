import 'reflect-metadata';
import { CorClient } from './bot/client/CorClient';
import * as config from './bot/config.json';

const client: CorClient = new CorClient(config);
client.start();
