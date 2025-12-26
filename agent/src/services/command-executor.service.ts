import axios from "axios";
import { Logger } from "../utils/logger";

interface CommandPayload {
  ms?: number;
  url?: string;
}

interface ExecutionResult {
  status: "COMPLETED" | "FAILED";
  result: object | null;
  error: string | null;
}

export class CommandExecutorService {
  private static randomFailureRate = parseFloat(
    process.env.RANDOM_FAILURE_RATE || "0.3",
  );

  /**
   * Execute a command based on its type
   */
  static async execute(
    commandId: string,
    type: string,
    payload: CommandPayload,
    randomFailures: boolean,
  ): Promise<ExecutionResult> {
    Logger.info(`Executing command ${commandId} of type ${type}`);

    // Check for random failure (30% chance)
    if (randomFailures && Math.random() < this.randomFailureRate) {
      Logger.warn(
        `Command ${commandId}: Random failure triggered (30% chance)`,
      );
      process.exit(1);
    }

    try {
      switch (type) {
        case "DELAY":
          return await this.executeDelay(payload);

        case "HTTP_GET_JSON":
          return await this.executeHttpGet(payload);

        default:
          return {
            status: "FAILED",
            result: null,
            error: `Unknown command type: ${type}`,
          };
      }
    } catch (error: any) {
      Logger.error(`Command execution failed: ${error.message}`);
      return {
        status: "FAILED",
        result: null,
        error: error.message,
      };
    }
  }

  /**
   * Execute DELAY command
   */
  private static async executeDelay(
    payload: CommandPayload,
  ): Promise<ExecutionResult> {
    const ms = payload.ms || 0;
    Logger.info(`Delaying for ${ms}ms`);

    await this.sleep(ms);

    return {
      status: "COMPLETED",
      result: { delayedMs: ms },
      error: null,
    };
  }

  /**
   * Execute HTTP_GET_JSON command
   */
  private static async executeHttpGet(
    payload: CommandPayload,
  ): Promise<ExecutionResult> {
    if (!payload.url) {
      return {
        status: "FAILED",
        result: null,
        error: "URL is required for HTTP_GET_JSON command",
      };
    }

    Logger.info(`Making HTTP GET request to ${payload.url}`);

    try {
      const response = await axios.get(payload.url, {
        timeout: 30000,
      });

      return {
        status: "COMPLETED",
        result: {
          statusCode: response.status,
          data: response.data,
        },
        error: null,
      };
    } catch (error: any) {
      return {
        status: "FAILED",
        result: null,
        error: error.message,
      };
    }
  }

  /**
   * Sleep utility
   */
  private static sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
