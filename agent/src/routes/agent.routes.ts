import { Router } from "express";
import { AgentController } from "../controllers/agent.controller";

export const router = Router();

router.get("/check", AgentController.check);
router.get("/agent/status/:agentId", AgentController.getStatus);
router.get("/agents", AgentController.getAllAgents);

