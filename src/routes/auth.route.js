import { Router } from "express";
import { registerValidator, loginValidator } from "../validators/index.js";
import handleValidationErrors from "../middlewares/handleValidationErrors.middleware.js";

const router = Router();

router.post(
	"/register",
	registerValidator,
	handleValidationErrors,
	(req, res) => {
		res.status(200).json("register route");
	}
);

router.post("/login",
    loginValidator,
    handleValidationErrors,
    (req, res) => {
	res.status(200).json("login route");
});

export default router;
