import { v4 as uuid } from "uuid";
import { CommandLog } from "../models/command-log.model";
import { Logger } from "../utils/logger";

export class LogService {
  /**
   * Save command execution log to database
   */
  static async saveLog(
    commandId: string,
    agentId: string,
    status: "COMPLETED" | "FAILED",
    result: object | null,
    error: string | null,
    startedAt: Date,
    completedAt: Date
  ): Promise<CommandLog> {
    const log = await CommandLog.create({
      id: uuid(),
      commandId,
      agentId,
      status,
      result,
      error,
      startedAt,
      completedAt,
    });

    Logger.info(
      `Saved log for command ${commandId}: ${status} by agent ${agentId}`
    );

    return log;
  }

  /**
   * Get log by command ID
   */
  static async getLogByCommandId(
    commandId: string
  ): Promise<CommandLog | null> {
    return await CommandLog.findOne({
      where: { commandId },
    });
  }
}

