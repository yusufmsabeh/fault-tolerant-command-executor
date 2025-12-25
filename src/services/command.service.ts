import { Command } from "../models/command.model";
import { v4 as uuid } from "uuid";
import axios from "axios";
import { Logger } from "../utils/logger";

interface AgentLog {
  command_id: string;
  status: "COMPLETED" | "FAILED";
  result: object | null;
  error: string | null;
}

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

  /**
   * Recover a RUNNING command using the same logic as startup recovery
   * Step 1: Check logs
   * Step 2: Check if agent is still running
   * Step 3: Apply idempotent logic if agent crashed
   */
  static async recoverRunningCommand(commandId: string, agentId: string) {
    const command = await Command.findByPk(commandId);
    if (!command || command.status !== "RUNNING") {
      return;
    }

    const agentServiceUrl =
      process.env.AGENT_SERVICE_URL || "http://localhost:3001";
    const timeout = parseInt(process.env.AGENT_SERVICE_TIMEOUT || "5000");

    try {
      // Step 1: Check for logs in Agent Service
      const logs = await this.fetchCommandLogs(
        commandId,
        agentServiceUrl,
        timeout
      );

      if (logs) {
        // Logs found - agent completed but couldn't update
        command.status = logs.status;
        command.result = logs.result;
        command.error = logs.error;
        command.completedAt = new Date();
        await command.save();
        Logger.info(
          `Command ${commandId}: Found logs, marked as ${logs.status}`
        );
        return;
      }

      // Step 2: No logs found - check if agent is still running this command
      const agentRunning = await this.isAgentRunningCommand(
        agentId,
        agentServiceUrl,
        timeout
      );

      if (agentRunning) {
        // Agent is still running the command - keep it as RUNNING
        Logger.info(
          `Command ${commandId}: Agent ${agentId} still running, keeping RUNNING status`
        );
        return;
      }

      // Step 3: Agent crashed - apply idempotent logic
      if (command.isIdempotent) {
        // Safe to retry
        command.status = "PENDING";
        command.agentId = null;
        await command.save();
        Logger.info(
          `Command ${commandId}: Agent crashed, idempotent=true, reset to PENDING`
        );
      } else {
        // Not safe to retry
        command.status = "FAILED";
        command.error = "Agent crashed during execution";
        command.completedAt = new Date();
        await command.save();
        Logger.info(
          `Command ${commandId}: Agent crashed, idempotent=false, marked as FAILED`
        );
      }
    } catch (error) {
      Logger.error(`Error recovering command ${commandId}: ${error}`);
    }
  }

  /**
   * Fetch logs for a command from Agent Service
   * Returns null if no logs found (404)
   */
  private static async fetchCommandLogs(
    commandId: string,
    agentServiceUrl: string,
    timeout: number
  ): Promise<AgentLog | null> {
    try {
      const response = await axios.get<AgentLog>(
        `${agentServiceUrl}/logs/${commandId}`,
        { timeout }
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
  private static async isAgentRunningCommand(
    agentId: string,
    agentServiceUrl: string,
    timeout: number
  ): Promise<boolean> {
    try {
      const response = await axios.get<{ isRunning: boolean }>(
        `${agentServiceUrl}/agent/status/${agentId}`,
        { timeout }
      );
      return response.data.isRunning;
    } catch (error) {
      // If we can't reach the agent or get an error, assume it's not running
      return false;
    }
  }
}
