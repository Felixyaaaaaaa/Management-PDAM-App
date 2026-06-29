import express from "express";
import * as controller from "../controllers/tagihan.controller.js";
import authMiddleware from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/", authMiddleware, controller.getAll);
router.get("/belum-bayar", authMiddleware, controller.getBelumBayar);
router.put("/:id", authMiddleware, controller.updateTotalTagihan);
router.get(
  "/list-petugas",
  authMiddleware,
  controller.listPetugas
);
router.get(
  "/list-petugas-app",
  authMiddleware,
  controller.listPetugasApp
);
router.get("/:id", authMiddleware, controller.getById);

export default router;
