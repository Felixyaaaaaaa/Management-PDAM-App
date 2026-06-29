import express from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import * as controller from "../controllers/pengeluaran.controller.js";

const router = express.Router();


router.get("/", authMiddleware, controller.getAll);
router.post("/", authMiddleware, controller.create);
router.put("/:id", authMiddleware, controller.update);
router.delete("/:id", authMiddleware, controller.delete);

export default router;