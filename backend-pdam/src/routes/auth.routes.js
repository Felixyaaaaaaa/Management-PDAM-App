import express from "express";
import * as authController from "../controllers/auth.controller.js";
import authMiddleware from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/register", authController.register);
router.post("/login", authController.login);
router.get("/users", authMiddleware, authController.getUsers);
router.get("/users/:id", authMiddleware, authController.getUserById);
router.put("/users/:id", authMiddleware, authController.updateUser);
router.delete("/users/:id", authMiddleware, authController.deleteUser);
router.get("/profile/:id", authMiddleware, authController.profile);

export default router;