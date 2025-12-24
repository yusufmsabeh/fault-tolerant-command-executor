import { Router } from "express";
import { TestController } from "../controllers/test.controller";

export const router = Router();

router.get("/health", TestController.health);

