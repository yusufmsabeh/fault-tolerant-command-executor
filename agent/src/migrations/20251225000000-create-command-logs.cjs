"use strict";
const { DataTypes } = require("sequelize");

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("command_logs", {
      id: {
        type: DataTypes.STRING,
        primaryKey: true,
      },

      command_id: {
        type: DataTypes.STRING,
        allowNull: false,
      },

      agent_id: {
        type: DataTypes.STRING,
        allowNull: false,
      },

      status: {
        type: DataTypes.STRING,
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
        allowNull: false,
      },

      completed_at: {
        type: DataTypes.DATE,
        allowNull: false,
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

    // Add index on command_id for faster lookups
    await queryInterface.addIndex("command_logs", ["command_id"]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("command_logs");
  },
};

