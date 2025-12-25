import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/database";

export class Command extends Model {
  declare id: string;
  declare type: "DELAY" | "HTTP_GET_JSON";
  declare payload: object;

  declare status: "PENDING" | "RUNNING" | "COMPLETED" | "FAILED";
  declare agentId: string | null;

  declare attempt: number;
  declare result: object | null;
  declare error: string | null;

  declare startedAt: Date | null;
  declare completedAt: Date | null;

  declare isIdempotent: boolean;
}

Command.init(
  {
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

    agentId: {
      type: DataTypes.STRING,
      field: "agent_id",
    },

    attempt: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },

    result: {
      type: DataTypes.JSON,
    },

    error: {
      type: DataTypes.STRING,
    },

    startedAt: {
      type: DataTypes.DATE,
      field: "started_at",
    },

    completedAt: {
      type: DataTypes.DATE,
      field: "completed_at",
    },

    isIdempotent: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: "is_idempotent",
    },
  },
  {
    sequelize,
    tableName: "commands",
    underscored: true,
    timestamps: true,
  }
);
