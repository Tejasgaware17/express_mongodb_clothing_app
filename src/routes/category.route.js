import { Router } from "express";
import {
	createCategory,
	getAllCategories,
	getCategory,
	updateCategory,
} from "../controllers/index.js";
import {
	authenticateUser,
	authorizePermissions,
	handleValidationErrors,
} from "../middlewares/index.js";
import { createCategoryValidator, updateCategoryValidator } from "../validators/index.js";

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

router.patch('/:slug', authenticateUser, authorizePermissions('admin'), updateCategoryValidator, handleValidationErrors, updateCategory)

export default router;
