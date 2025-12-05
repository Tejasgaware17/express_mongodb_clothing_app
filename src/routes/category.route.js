import { Router } from "express";
import {
	createCategory,
	getAllCategories,
	getCategory,
	updateCategory,
	deleteCategory,
} from "../controllers/index.js";
import {
	authenticateUser,
	authorizePermissions,
	handleValidationErrors,
} from "../middlewares/index.js";
import {
	createCategoryValidator,
	updateCategoryValidator,
} from "../validators/index.js";

const router = Router();

// PUBLIC ROUTES
router.get("/", getAllCategories);
router.get("/:slug", getCategory);

// ADMIN-ONLY CREATE ROUTE
router.post(
	"/",
	authenticateUser,
	authorizePermissions("admin"),
	createCategoryValidator,
	handleValidationErrors,
	createCategory
);

// ADMIN-ONLY UPDATE AND DELETE ROUTES
router
	.route("/:slug")
	.all(authenticateUser, authorizePermissions("admin"))
	.patch(updateCategoryValidator, handleValidationErrors, updateCategory)
	.delete(deleteCategory);

export default router;
