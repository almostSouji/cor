import { ConnectionManager } from 'typeorm';
import { Setting } from '../models/Settings';
import { join } from 'path';

const connectionManager = new ConnectionManager();
connectionManager.create({
	name: 'cor',
	type: 'sqlite',
	database: join(__dirname, '..', '..', '..', 'cor.sqlite'),
	entities: [Setting]
});

export { connectionManager };
