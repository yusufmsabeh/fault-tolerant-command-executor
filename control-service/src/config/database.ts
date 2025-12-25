import { Sequelize } from "sequelize";

export const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: process.env.DB_PATH || "./src/database/database.sqlite",
  logging: true,
});
