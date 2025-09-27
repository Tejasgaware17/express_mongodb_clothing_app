import { Router } from "express";
import { registerValidator, loginValidator } from "../validators/index.js";
import handleValidationErrors from "../middlewares/handleValidationErrors.middleware.js";
import { register, login } from "../controllers/auth.controller.js";

const router = Router();

router.post("/register", registerValidator, handleValidationErrors, register);

router.post("/login", loginValidator, handleValidationErrors, login);

export default router;
