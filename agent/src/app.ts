import express from "express";
import { router as agentRoutes } from "./routes/agent.routes";
import { router as logRoutes } from "./routes/log.routes";

export const app = express();

app.use(express.json());

// Routes
app.use("/", agentRoutes);
app.use("/", logRoutes);

