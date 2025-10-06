import { Router } from "express";
import {
	createProduct,
	getAllProducts,
	getProduct,
	updateProduct,
} from "../controllers/index.js";
import {
	authenticateUser,
	authorizePermissions,
	handleValidationErrors,
} from "../middlewares/index.js";
import {
	createProductValidator,
	updateProductValidator,
} from "../validators/index.js";

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

// ADMIN_ONLY UPDATE ROUTE
router.patch(
	"/:productId",
	authenticateUser,
	authorizePermissions("admin"),
	updateProductValidator,
	handleValidationErrors,
	updateProduct
);

export default router;
