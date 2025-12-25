import { Request, Response } from "express";

export class TestController {
  static async health(req: Request, res: Response) {
    res.status(200).json({ status: 200, message: "server is running well" });
  }
}

