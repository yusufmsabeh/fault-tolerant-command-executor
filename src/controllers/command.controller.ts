import { Request, Response } from "express";
import { CommandService } from "../services/command.service";
import { Logger } from "../utils/logger";

export class CommandController {
  static async create(req: Request, res: Response) {
    try {
      const { type, payload } = req.body;
      const command = await CommandService.createCommand(type, payload);
      res.status(201).json({ commandId: command.id });
    } catch (error) {
      Logger.error(`Error creating command: ${error}`);
      res.status(500).json({ error: "Failed to create command" });
    }
  }

}
