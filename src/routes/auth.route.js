import { Router } from "express";
import { registerValidator, loginValidator } from "../validators/index.js";
import handleValidationErrors from "../middlewares/handleValidationErrors.middleware.js";
import {
	register,
	login,
	refreshToken,
} from "../controllers/auth.controller.js";

const router = Router();

router.post("/register", registerValidator, handleValidationErrors, register);

router.post("/login", loginValidator, handleValidationErrors, login);

router.post("/refresh-token", refreshToken);

export default router;
