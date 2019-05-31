import { Sequelize, TEXT, JSON, Options } from "sequelize";

function db(dialect: Options["dialect"], login: string): Sequelize {
  const sequelize = new Sequelize(login, {
    dialect,
    logging: (): void => {},
    define: { timestamps: false }
  });

  sequelize.define("users", {
    id: {
      type: TEXT,
      primaryKey: true
    },
    channel: TEXT
  });

  sequelize.define("settings", {
    guild: {
      type: TEXT,
      primaryKey: true
    },
    settings: {
      type: JSON
    }
  });

  sequelize.define("blacklist", {
    user: {
      type: TEXT,
      primaryKey: true
    },
    reason: {
      type: TEXT
    }
  });
  return sequelize;
}

export default db;
