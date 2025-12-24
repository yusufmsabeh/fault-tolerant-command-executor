import { Command } from "../models/command.model";
import { v4 as uuid } from "uuid";

export class CommandService {
  static async createCommand(type: string, payload: object) {
    const command = await Command.create({
      id: uuid(),
      type,
      payload,
      status: "PENDING",
      attempt: 0,
    });

    return command;
  }

  static async getCommand(id: string) {
    const command = await Command.findByPk(id);
    return command;
  }
}
