import express from "express";
import * as controller from "../controllers/pembayaran.controller.js";
import authMiddleware from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/", authMiddleware, controller.create);

export default router;
