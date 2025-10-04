import { Router } from "express";
import {
	createCategory,
	getAllCategories,
	getCategory,
} from "../controllers/index.js";
import {
	authenticateUser,
	authorizePermissions,
	handleValidationErrors,
} from "../middlewares/index.js";
import { createCategoryValidator } from "../validators/index.js";

const router = Router();

// PUBLIC ROUTES
router.get("/", getAllCategories);
router.get("/:slug", getCategory);

// ADMIN-ONLY ROUTES
router.post(
	"/",
	authenticateUser,
	authorizePermissions("admin"),
	createCategoryValidator,
	handleValidationErrors,
	createCategory
);

export default router;
