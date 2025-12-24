import { Router } from "express";
import { CommandController } from "../controllers/command.controller";

export const router = Router();

router.post("/commands", CommandController.create);