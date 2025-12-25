import { Request, Response } from "express";
import { AgentService } from "../services/agent.service";
import { Logger } from "../utils/logger";

export class AgentController {
  /**
   * Health check endpoint
   */
  static check(req: Request, res: Response) {
    res.status(200).json({ status: "ok" });
  }

  /**
   * Get agent status (is agent running a command?)
   */
  static getStatus(req: Request, res: Response) {
    try {
      const { agentId } = req.params;
      const isRunning = AgentService.isAgentRunning(agentId);

      res.json({ isRunning });
    } catch (error) {
      Logger.error(`Error getting agent status: ${error}`);
      res.status(500).json({ error: "Failed to get agent status" });
    }
  }

  /**
   * Get all agents (for debugging)
   */
  static getAllAgents(req: Request, res: Response) {
    try {
      const agents = AgentService.getAllAgents();
      res.json({ agents });
    } catch (error) {
      Logger.error(`Error getting agents: ${error}`);
      res.status(500).json({ error: "Failed to get agents" });
    }
  }
}

