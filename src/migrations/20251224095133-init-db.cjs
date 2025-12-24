"use strict";
const { DataTypes } = require("sequelize");
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("commands", {
      id: {
        type: DataTypes.STRING,
        primaryKey: true,
      },

      type: {
        type: DataTypes.STRING,
        allowNull: false,
      },

      payload: {
        type: DataTypes.JSON,
        allowNull: false,
      },

      status: {
        type: DataTypes.STRING,
        allowNull: false,
      },

      agent_id: {
        type: DataTypes.STRING,
      },

      attempt: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: false,
      },

      result: {
        type: DataTypes.JSON,
      },

      error: {
        type: DataTypes.STRING,
      },

      started_at: {
        type: DataTypes.DATE,
      },

      completed_at: {
        type: DataTypes.DATE,
      },

      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },

      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("commands");
  },
};
