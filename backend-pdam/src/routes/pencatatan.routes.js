import express from "express";
import * as controller from "../controllers/pencatatan.controller.js";
import authMiddleware from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/", authMiddleware, controller.getAll);
router.get("/:id", authMiddleware, controller.getById);
router.post("/generate", authMiddleware, controller.generateBulanan);
router.put("/:id/update-meter",authMiddleware,controller.updateMeterAkhir);
// router.post("/", authMiddleware, controller.create);
// router.get("/belum-bayar", authMiddleware, controller.getBelumBayar);

export default router;
