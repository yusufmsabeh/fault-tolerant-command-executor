import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/database";

export class CommandLog extends Model {
  declare id: string;
  declare commandId: string;
  declare agentId: string;
  declare status: "COMPLETED" | "FAILED";
  declare result: object | null;
  declare error: string | null;
  declare startedAt: Date;
  declare completedAt: Date;
}

CommandLog.init(
  {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
    },

    commandId: {
      type: DataTypes.STRING,
      allowNull: false,
      field: "command_id",
    },

    agentId: {
      type: DataTypes.STRING,
      allowNull: false,
      field: "agent_id",
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

    startedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: "started_at",
    },

    completedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: "completed_at",
    },
  },
  {
    sequelize,
    tableName: "command_logs",
    underscored: true,
    timestamps: true,
  }
);

