import { Router } from "express";
import { createCategory } from "../controllers/index.js";
import {
	authenticateUser,
	authorizePermissions,
	handleValidationErrors,
} from "../middlewares/index.js";
import { createCategoryValidator } from "../validators/index.js";

const router = Router();

router.post(
	"/",
	authenticateUser,
	authorizePermissions("admin"),
	createCategoryValidator,
	handleValidationErrors,
	createCategory
);

export default router;
