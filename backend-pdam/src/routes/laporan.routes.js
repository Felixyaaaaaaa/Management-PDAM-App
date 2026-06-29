import express from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import * as laporan from "../controllers/laporan.controller.js";

const router = express.Router();

router.get("/dashboard", authMiddleware, laporan.dashboard);
router.get("/tagihan", authMiddleware, laporan.laporanTagihan);
router.get("/pendapatan", authMiddleware, laporan.laporanPendapatan);
router.get("/tunggakan", authMiddleware, laporan.laporanTunggakan);
router.get("/laba-rugi", authMiddleware, laporan.laporanLabaRugi);

export default router;