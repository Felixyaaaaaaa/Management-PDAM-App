import express from "express";
import * as controller from "../controllers/pelanggan.controller.js";
import authMiddleware from "../middleware/auth.middleware.js";

const router = express.Router();

// protected routes
router.get("/", authMiddleware, controller.getAll);
router.get("/:id", authMiddleware, controller.getById);
router.post("/", authMiddleware, controller.create);
router.put("/:id", authMiddleware, controller.update);
router.delete("/:id", authMiddleware, controller.remove);

// reset meter
router.put("/:id/reset-meter", authMiddleware, controller.resetMeter);

export default router;
