import { Router } from "express";
import { CommandController } from "../controllers/command.controller";

export const router = Router();

router.post("/commands", CommandController.create);
router.get("/commands/next", CommandController.next);
router.get("/commands/:id", CommandController.get);
router.patch("/commands/:id", CommandController.updateResult);