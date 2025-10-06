import { Router } from "express";
import {
	createProduct,
	getAllProducts,
	getProduct,
} from "../controllers/index.js";
import {
	authenticateUser,
	authorizePermissions,
	handleValidationErrors,
} from "../middlewares/index.js";
import { createProductValidator } from "../validators/index.js";

const router = Router();

// PUBLIC ROUTES
router.get("/", getAllProducts);
router.get("/:productId", getProduct);

// ADMIN-ONLY CREATE ROUTE
router.post(
	"/",
	authenticateUser,
	authorizePermissions("admin"),
	createProductValidator,
	handleValidationErrors,
	createProduct
);

export default router;
