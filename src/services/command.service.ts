import { Command } from "../models/command.model";
import { v4 as uuid } from "uuid";

export class CommandService {
  static async createCommand(
    type: string,
    payload: object,
    isIdempotent: boolean = false
  ) {
    const command = await Command.create({
      id: uuid(),
      type,
      payload,
      status: "PENDING",
      attempt: 0,
      isIdempotent,
    });

    return command;
  }

  static async getCommand(id: string) {
    const command = await Command.findByPk(id);
    return command;
  }

  static async findRunningCommandForAgent(agentId: string) {
    const command = await Command.findOne({
      where: {
        agentId,
        status: "RUNNING",
      },
    });
    return command;
  }

  static async markCommandAsFailed(commandId: string, error: string) {
    const command = await Command.findByPk(commandId);
    if (command) {
      command.status = "FAILED";
      command.error = error;
      command.completedAt = new Date();
      await command.save();
    }
    return command;
  }

  static async getNextPendingCommand(agentId: string) {
    const command = await Command.findOne({
      where: {
        status: "PENDING",
      },
      order: [["createdAt", "ASC"]],
    });

    if (command) {
      command.status = "RUNNING";
      command.agentId = agentId;
      command.startedAt = new Date();
      command.attempt = command.attempt + 1;
      await command.save();
    }

    return command;
  }

  static async updateCommandResult(
    commandId: string,
    agentId: string,
    status: "COMPLETED" | "FAILED",
    result?: object,
    error?: string
  ) {
    const command = await Command.findOne({
      where: {
        id: commandId,
        agentId,
        status: "RUNNING",
      },
    });

    if (!command) {
      return null; // Command not found or not owned by this agent
    }

    command.status = status;
    command.completedAt = new Date();

    if (result) {
      command.result = result;
    }

    if (error) {
      command.error = error;
    }

    await command.save();
    return command;
  }
}
