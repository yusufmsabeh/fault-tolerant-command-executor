import { Router } from "express";
import { LogController } from "../controllers/log.controller";

export const router = Router();

router.get("/logs/:commandId", LogController.getByCommandId);

