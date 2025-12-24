import { Sequelize } from "sequelize";

export const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: process.env.DB_PATH || "../database/database.sqlite",
  logging: false,
});
