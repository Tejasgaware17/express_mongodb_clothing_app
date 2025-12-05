import { Router } from "express";
import { registerValidator, loginValidator } from "../validators/index.js";
import { handleValidationErrors } from "../middlewares/index.js";
import {
	register,
	login,
	refreshToken,
	logout,
} from "../controllers/auth.controller.js";

const router = Router();

router.post("/register", registerValidator, handleValidationErrors, register);

router.post("/login", loginValidator, handleValidationErrors, login);

router.post("/refresh-token", refreshToken);

router.post("/logout", logout);

export default router;
