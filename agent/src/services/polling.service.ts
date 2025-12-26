import axios from "axios";
import { AgentService } from "./agent.service";
import { CommandExecutorService } from "./command-executor.service";
import { LogService } from "./log.service";
import { Logger } from "../utils/logger";
import { configDotenv } from "dotenv";
configDotenv();
interface CommandResponse {
  commandId: string;
  type: string;
  payload: object;
}

export class PollingService {
  private static commandServiceUrl =
    process.env.COMMAND_SERVICE_URL || "http://localhost:3000";
  private static pollingInterval = parseInt(
    process.env.POLLING_INTERVAL || "5000",
  );
  private static timeout = parseInt(
    process.env.COMMAND_SERVICE_TIMEOUT || "5000",
  );
  private static randomFailures = false;
  private static pollingIntervals: Map<string, NodeJS.Timeout> = new Map();

  /**
   * Start polling for all ACTIVE agents
   */
  static startPolling(randomFailures: boolean): void {
    this.randomFailures = randomFailures;
    const activeAgents = AgentService.getActiveAgents();

    Logger.info(
      `Starting polling for ${activeAgents.length} agents (interval: ${this.pollingInterval}ms)`,
    );

    for (const agent of activeAgents) {
      this.startAgentPolling(agent.id);
    }
  }

  /**
   * Start polling for a specific agent
   */
  private static startAgentPolling(agentId: string): void {
    const interval = setInterval(async () => {
      await this.pollForWork(agentId);
    }, this.pollingInterval);

    this.pollingIntervals.set(agentId, interval);
    Logger.info(`Agent ${agentId} polling started`);
  }

  /**
   * Stop all polling
   */
  static stopPolling(): void {
    for (const [agentId, interval] of this.pollingIntervals) {
      clearInterval(interval);
      Logger.info(`Agent ${agentId} polling stopped`);
    }
    this.pollingIntervals.clear();
  }

  /**
   * Poll Command Service for work
   */
  private static async pollForWork(agentId: string): Promise<void> {
    // Only poll if agent is ACTIVE
    if (
      !AgentService.getAgent(agentId) ||
      AgentService.getAgent(agentId)!.state !== "ACTIVE"
    ) {
      return;
    }

    try {
      const response = await axios.get<CommandResponse>(
        `${this.commandServiceUrl}/api/commands/next`,
        {
          headers: {
            "X-Agent-Id": agentId,
          },
          timeout: this.timeout,
        },
      );

      if (response.status === 200 && response.data) {
        await this.handleCommand(agentId, response.data);
      }
    } catch (error: any) {
      if (error.response?.status === 204) {
        // No commands available - this is normal
        return;
      }
      Logger.error(`Polling error for agent ${agentId}: ${error.message}`);
    }
  }

  /**
   * Handle received command
   */
  private static async handleCommand(
    agentId: string,
    command: CommandResponse,
  ): Promise<void> {
    const { commandId, type, payload } = command;
    const startedAt = new Date();

    Logger.info(`Agent ${agentId} received command ${commandId}`);

    // Mark agent as RUNNING
    AgentService.markAsRunning(agentId, commandId);

    try {
      // Execute command
      const result = await CommandExecutorService.execute(
        commandId,
        type,
        payload,
        this.randomFailures,
      );

      const completedAt = new Date();

      // Save log to database
      await LogService.saveLog(
        commandId,
        agentId,
        result.status,
        result.result,
        result.error,
        startedAt,
        completedAt,
      );

      // Report result to Command Service
      await this.reportResult(
        commandId,
        agentId,
        result.status,
        result.result,
        result.error,
      );

      Logger.info(
        `Agent ${agentId} completed command ${commandId}: ${result.status}`,
      );
    } catch (error: any) {
      Logger.error(
        `Agent ${agentId} failed to process command ${commandId}: ${error.message}`,
      );
    } finally {
      // Mark agent as ACTIVE (ready for next command)
      AgentService.markAsActive(agentId);
    }
  }

  /**
   * Report result to Command Service
   */
  private static async reportResult(
    commandId: string,
    agentId: string,
    status: "COMPLETED" | "FAILED",
    result: object | null,
    error: string | null,
  ): Promise<void> {
    try {
      await axios.patch(
        `${this.commandServiceUrl}/api/commands/${commandId}`,
        {
          agentId,
          status,
          result,
          error,
        },
        { timeout: this.timeout },
      );
    } catch (error: any) {
      Logger.error(
        `Failed to report result for command ${commandId}: ${error.message}`,
      );
    }
  }
}
