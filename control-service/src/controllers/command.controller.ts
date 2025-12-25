import { Request, Response } from "express";
import { CommandService } from "../services/command.service";
import { Logger } from "../utils/logger";

export class CommandController {
  static async create(req: Request, res: Response) {
    try {
      const { type, payload, isIdempotent = false } = req.body;
      const command = await CommandService.createCommand(
        type,
        payload,
        isIdempotent
      );
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
      const agentId = req.header("X-Agent-Id");
      if (!agentId) {
        return res.status(400).json({ error: "agentId is required" });
      }

      // Check for running commands for this agent (crash recovery)
      const runningCommand = await CommandService.findRunningCommandForAgent(
        agentId
      );

      if (runningCommand) {
        Logger.warn(
          `Agent ${agentId} requesting new work but has RUNNING command ${runningCommand.id}. Applying recovery logic...`
        );
        await CommandService.recoverRunningCommand(runningCommand.id, agentId);
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

  static async updateResult(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { agentId, status, result, error } = req.body;

      if (!agentId) {
        return res.status(400).json({ error: "agentId is required" });
      }

      if (!status || !["COMPLETED", "FAILED"].includes(status)) {
        return res
          .status(400)
          .json({ error: "status must be COMPLETED or FAILED" });
      }

      const command = await CommandService.updateCommandResult(
        id,
        agentId,
        status,
        result,
        error
      );

      if (!command) {
        return res.status(403).json({
          error:
            "Unauthorized: Command not found or not assigned to this agent",
        });
      }

      Logger.info(
        `Command ${id} completed by agent ${agentId} with status ${status}`
      );

      res.json({
        commandId: command.id,
        status: command.status,
      });
    } catch (error) {
      Logger.error(`Error updating command result: ${error}`);
      res.status(500).json({ error: "Failed to update command result" });
    }
  }
}
