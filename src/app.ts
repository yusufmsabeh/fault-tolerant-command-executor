import express from "express";
import { router as testRouter } from "./routes/test.routes";
import { requestLogger } from "./middleware/request-logger.middleware";

export const app = express();

app.use(express.json());
app.use(requestLogger);
app.use("/api", testRouter);
