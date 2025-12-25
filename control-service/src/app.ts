import express from "express";
import { router as testRouter } from "./routes/test.routes";
import { router as commandsRouter } from "./routes/commands.routes";
import { requestLogger } from "./middleware/request-logger.middleware";

export const app = express();

app.use(express.json());
app.use(requestLogger);
app.use("/api", [testRouter,commandsRouter]);
