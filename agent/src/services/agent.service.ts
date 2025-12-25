import { Logger } from "../utils/logger";

export interface Agent {
  id: string;
  name: string;
  state: "ACTIVE" | "RUNNING" | "INACTIVE";
  currentCommandId?: string;
}

export class AgentService {
  private static agents: Agent[] = [
    { id: "agent-1", name: "Agent 1", state: "INACTIVE" },
    { id: "agent-2", name: "Agent 2", state: "INACTIVE" },
    { id: "agent-3", name: "Agent 3", state: "INACTIVE" },
    { id: "agent-4", name: "Agent 4", state: "INACTIVE" },
    { id: "agent-5", name: "Agent 5", state: "INACTIVE" },
  ];

  /**
   * Initialize agents based on agent count
   * Selects first N agents and marks them as ACTIVE
   */
  static initializeAgents(count: number): void {
    const maxCount = parseInt(process.env.MAX_AGENT_COUNT || "5");
    
    if (count > maxCount) {
      Logger.warn(`Requested ${count} agents, but max is ${maxCount}. Using ${maxCount}.`);
      count = maxCount;
    }

    // Mark first N agents as ACTIVE
    for (let i = 0; i < count; i++) {
      this.agents[i].state = "ACTIVE";
      Logger.info(`Agent ${this.agents[i].id} initialized as ACTIVE`);
    }
  }

  /**
   * Get all agents
   */
  static getAllAgents(): Agent[] {
    return this.agents;
  }

  /**
   * Get agent by ID
   */
  static getAgent(agentId: string): Agent | undefined {
    return this.agents.find((a) => a.id === agentId);
  }

  /**
   * Get all ACTIVE agents (ready to work)
   */
  static getActiveAgents(): Agent[] {
    return this.agents.filter((a) => a.state === "ACTIVE");
  }

  /**
   * Mark agent as RUNNING with command ID
   */
  static markAsRunning(agentId: string, commandId: string): void {
    const agent = this.getAgent(agentId);
    if (agent) {
      agent.state = "RUNNING";
      agent.currentCommandId = commandId;
      Logger.info(`Agent ${agentId} is now RUNNING command ${commandId}`);
    }
  }

  /**
   * Mark agent as ACTIVE (ready for next command)
   */
  static markAsActive(agentId: string): void {
    const agent = this.getAgent(agentId);
    if (agent) {
      agent.state = "ACTIVE";
      agent.currentCommandId = undefined;
      Logger.info(`Agent ${agentId} is now ACTIVE (ready for work)`);
    }
  }

  /**
   * Check if agent is currently running a command
   */
  static isAgentRunning(agentId: string): boolean {
    const agent = this.getAgent(agentId);
    return agent?.state === "RUNNING";
  }
}

