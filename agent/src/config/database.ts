import { Sequelize } from "sequelize";
import { configDotenv } from "dotenv";
configDotenv();
const dbPath = process.env.DB_PATH || "./src/database/database.sqlite";

export const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: dbPath,
  logging: false,
});
