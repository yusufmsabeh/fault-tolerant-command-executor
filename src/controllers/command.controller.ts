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

  static async get(req: Request, res: Response) {
    try {
      const command = await CommandService.getCommand(req.params.id);
      if (!command) {
        return res.status(404).json({ error: "Command not found" });
      }

      res.json({
        status: command.status,
        result: command.result,
        agentId: command.agentId,
      });
    } catch (error) {
      Logger.error(`Error getting command: ${error}`);
      res.status(500).json({ error: "Failed to get command" });
    }
  }

  static async next(req: Request, res: Response) {
    try {
      const { agentId } = req.body;

      if (!agentId) {
        return res.status(400).json({ error: "agentId is required" });
      }

      // Check for running commands for this agent (crash recovery)
      const runningCommand = await CommandService.findRunningCommandForAgent(
        agentId
      );

      if (runningCommand) {
        Logger.warn(
          `Agent ${agentId} crashed while working on command ${runningCommand.id}. Marking as FAILED.`
        );
        await CommandService.markCommandAsFailed(
          runningCommand.id,
          "Agent crashed during execution"
        );
      }

      // Get next pending command
      const nextCommand = await CommandService.getNextPendingCommand(agentId);

      if (!nextCommand) {
        return res.status(204).send(); // No content - no commands available
      }

      res.json({
        commandId: nextCommand.id,
        type: nextCommand.type,
        payload: nextCommand.payload,
      });
    } catch (error) {
      Logger.error(`Error getting next command: ${error}`);
      res.status(500).json({ error: "Failed to get next command" });
    }
  }
}
