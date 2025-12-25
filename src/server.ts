import { app } from "./app";
import { sequelize } from "./config/database";
import { RecoveryService } from "./services/recovery.service";
import { Logger } from "./utils/logger";

const PORT = process.env.PORT || 3000;

async function start() {
  try {
    // Step 1: Connect to database
    Logger.info("Connecting to database...");
    await sequelize.authenticate();
    Logger.info("Database connected successfully.");

    // Step 2: Run recovery logic (blocks until complete)
    Logger.info("Running startup recovery...");
    await RecoveryService.runStartupRecovery();

    // Step 3: Start accepting HTTP requests
    app.listen(PORT, () => {
      Logger.info(`Server running on port ${PORT}`);
      Logger.info("Server is ready to accept requests.");
    });
  } catch (error) {
    Logger.error(`Failed to start server: ${error}`);
    process.exit(1);
  }
}

start();
