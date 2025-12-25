import axios from "axios";
import { Command } from "../models/command.model";
import { Logger } from "../utils/logger";

interface AgentLog {
  command_id: string;
  status: "COMPLETED" | "FAILED";
  result: object | null;
  error: string | null;
}

export class RecoveryService {
  private static agentServiceUrl = process.env.AGENT_SERVICE_URL || "http://localhost:3001";
  private static timeout = parseInt(process.env.AGENT_SERVICE_TIMEOUT || "5000");
  private static retryInterval = parseInt(process.env.RECOVERY_RETRY_INTERVAL || "10000");

  /**
   * Run recovery logic on server startup
   * Blocks until Agent Service is available and recovery completes
   */
  static async runStartupRecovery(): Promise<void> {
    Logger.info("Starting recovery process...");

    // Wait for Agent Service to be available
    await this.waitForAgentService();

    // Get all RUNNING commands
    const runningCommands = await Command.findAll({
      where: { status: "RUNNING" },
    });

    if (runningCommands.length === 0) {
      Logger.info("No RUNNING commands found. Recovery complete.");
      return;
    }

    Logger.info(`Found ${runningCommands.length} RUNNING commands. Processing...`);

    // Process each command sequentially
    for (const command of runningCommands) {
      await this.recoverCommand(command);
    }

    Logger.info("Recovery process completed successfully.");
  }

  /**
   * Wait for Agent Service to be available
   * Retries every RECOVERY_RETRY_INTERVAL until successful
   */
  private static async waitForAgentService(): Promise<void> {
    while (true) {
      try {
        await axios.get(`${this.agentServiceUrl}/check`, {
          timeout: this.timeout,
        });
        Logger.info("Agent Service is available.");
        return;
      } catch (error) {
        Logger.warn(
          `Agent Service not available. Retrying in ${this.retryInterval / 1000} seconds...`
        );
        await this.sleep(this.retryInterval);
      }
    }
  }

  /**
   * Recover a single command
   */
  private static async recoverCommand(command: Command): Promise<void> {
    try {
      // Step 1: Check for logs
      const logs = await this.fetchCommandLogs(command.id);

      if (logs) {
        // Logs found - agent completed but couldn't update
        await this.updateCommandFromLogs(command, logs);
        return;
      }

      // Step 2: No logs found - check if agent is still running this command
      const agentRunning = await this.isAgentRunningCommand(command.agentId!);

      if (agentRunning) {
        // Agent is still running the command
        Logger.info(
          `Command ${command.id}: Agent ${command.agentId} still running, keeping RUNNING status`
        );
        return;
      }

      // Step 3: Agent crashed - apply idempotent logic
      await this.handleCrashedAgent(command);
    } catch (error) {
      Logger.error(`Error recovering command ${command.id}: ${error}`);
    }
  }

  /**
   * Fetch logs for a command from Agent Service
   * Returns null if no logs found (404)
   */
  private static async fetchCommandLogs(
    commandId: string
  ): Promise<AgentLog | null> {
    try {
      const response = await axios.get<AgentLog>(
        `${this.agentServiceUrl}/logs/${commandId}`,
        { timeout: this.timeout }
      );
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null; // No logs found
      }
      throw error; // Other errors
    }
  }

  /**
   * Check if a specific agent is currently running a command
   */
  private static async isAgentRunningCommand(agentId: string): Promise<boolean> {
    try {
      const response = await axios.get<{ isRunning: boolean }>(
        `${this.agentServiceUrl}/agent/status/${agentId}`,
        { timeout: this.timeout }
      );
      return response.data.isRunning;
    } catch (error) {
      // If we can't reach the agent or get an error, assume it's not running
      return false;
    }
  }

  /**
   * Update command with data from logs
   */
  private static async updateCommandFromLogs(
    command: Command,
    logs: AgentLog
  ): Promise<void> {
    command.status = logs.status;
    command.result = logs.result;
    command.error = logs.error;
    command.completedAt = new Date();
    await command.save();

    Logger.info(
      `Command ${command.id}: Found logs, marked as ${logs.status}`
    );
  }

  /**
   * Handle crashed agent based on isIdempotent flag
   */
  private static async handleCrashedAgent(command: Command): Promise<void> {
    if (command.isIdempotent) {
      // Safe to retry
      command.status = "PENDING";
      await command.save();
      Logger.info(
        `Command ${command.id}: Agent crashed, idempotent=true, reset to PENDING`
      );
    } else {
      // Not safe to retry
      command.status = "FAILED";
      command.error = "Agent crashed during execution";
      command.completedAt = new Date();
      await command.save();
      Logger.info(
        `Command ${command.id}: Agent crashed, idempotent=false, marked as FAILED`
      );
    }
  }

  /**
   * Sleep utility
   */
  private static sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

