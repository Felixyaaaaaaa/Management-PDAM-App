import express from "express";
import * as controller from "../controllers/kasUtamaController.js";
import authMiddleware from "../middleware/auth.middleware.js";

const router = express.Router();

// ============================
// ROUTES
// ============================

router.get("/", authMiddleware, controller.getAll);

router.get("/dashboard", authMiddleware, controller.dashboard);

router.get("/:id", authMiddleware, controller.getById);

router.post("/", authMiddleware, controller.create);

router.put("/:id", authMiddleware, controller.update);

router.delete("/:id", authMiddleware, controller.remove);

export default router;
