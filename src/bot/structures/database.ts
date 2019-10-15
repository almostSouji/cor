import { ConnectionManager } from 'typeorm';
import { Setting } from '../models/Settings';
import { User } from '../models/Users';
import { join } from 'path';

const connectionManager = new ConnectionManager();
connectionManager.create({
	name: 'cor',
	type: 'sqlite',
	database: join(__dirname, '..', '..', '..', 'cor.sqlite'),
	entities: [Setting, User]
});

export { connectionManager };
