import { Router } from "express";
import { registerValidator, loginValidator } from "../validators/index.js";
import handleValidationErrors from "../middlewares/handleValidationErrors.middleware.js";
import { authController } from "../controllers/index.js";
import { registerUser } from "../controllers/auth.controller.js";

const router = Router();

router.post(
	"/register",
	registerValidator,
	handleValidationErrors,
	registerUser
);

router.post("/login", loginValidator, handleValidationErrors, (req, res) => {
	res.status(200).json("login route");
});

export default router;
