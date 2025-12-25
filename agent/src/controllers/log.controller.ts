import { Request, Response } from "express";
import { LogService } from "../services/log.service";
import { Logger } from "../utils/logger";

export class LogController {
  /**
   * Get log by command ID
   */
  static async getByCommandId(req: Request, res: Response) {
    try {
      const { commandId } = req.params;
      const log = await LogService.getLogByCommandId(commandId);

      if (!log) {
        return res.status(404).json({ error: "Log not found" });
      }

      res.json({
        command_id: log.commandId,
        status: log.status,
        result: log.result,
        error: log.error,
      });
    } catch (error) {
      Logger.error(`Error getting log: ${error}`);
      res.status(500).json({ error: "Failed to get log" });
    }
  }
}

