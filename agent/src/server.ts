import "dotenv/config";
import { app } from "./app";
import { sequelize } from "./config/database";
import { AgentService } from "./services/agent.service";
import { PollingService } from "./services/polling.service";
import { Logger } from "./utils/logger";
import { configDotenv } from "dotenv";
configDotenv();
const PORT = process.env.PORT || 3001;

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const config = {
    agentCount: 1,
    killAfter: null as number | null,
    randomFailures: false,
  };

  for (const arg of args) {
    if (arg.startsWith("--agent-count=")) {
      config.agentCount = parseInt(arg.split("=")[1]);
    } else if (arg.startsWith("--kill-after=")) {
      config.killAfter = parseInt(arg.split("=")[1]);
    } else if (arg === "--random-failures") {
      config.randomFailures = true;
    }
  }

  return config;
}

async function start() {
  try {
    // Parse startup flags
    const config = parseArgs();
    Logger.info(
      `Starting Agent Service with config: ${JSON.stringify(config)}`,
    );

    // Step 1: Connect to database
    Logger.info("Connecting to database...");
    await sequelize.authenticate();
    Logger.info("Database connected successfully.");

    // Step 2: Initialize agents
    Logger.info(`Initializing ${config.agentCount} agents...`);
    AgentService.initializeAgents(config.agentCount);

    // Step 3: Start HTTP server
    app.listen(PORT, () => {
      Logger.info(`Agent Service running on port ${PORT}`);
    });

    // Step 4: Start polling for work
    Logger.info("Starting polling for commands...");
    PollingService.startPolling(config.randomFailures);

    // Step 5: Schedule kill if --kill-after is set
    if (config.killAfter) {
      Logger.warn(`Service will crash after ${config.killAfter}ms`);
      setTimeout(() => {
        Logger.error("CRASH: Kill timer expired. Simulating service crash!");
        PollingService.stopPolling();
        process.exit(1);
      }, config.killAfter);
    }

    Logger.info("Agent Service is ready!");
  } catch (error) {
    Logger.error(`Failed to start Agent Service: ${error}`);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on("SIGINT", () => {
  Logger.info("Received SIGINT. Stopping polling...");
  PollingService.stopPolling();
  process.exit(0);
});

process.on("SIGTERM", () => {
  Logger.info("Received SIGTERM. Stopping polling...");
  PollingService.stopPolling();
  process.exit(0);
});

start();
