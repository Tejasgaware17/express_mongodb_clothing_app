import { Router } from "express";
import {
	createProduct,
	getAllProducts,
	getProduct,
	updateProduct,
	deleteProduct,
	addProductVariant,
} from "../controllers/index.js";
import {
	authenticateUser,
	authorizePermissions,
	handleValidationErrors,
} from "../middlewares/index.js";
import {
	createProductValidator,
	updateProductValidator,
	addVariantValidator,
} from "../validators/index.js";
import reviewRouter from "./review.route.js";

const router = Router();

// REVIEWS
router.use("/:productId/reviews", reviewRouter);

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

// ADMIN_ONLY UPDATE AND DELETE ROUTE
router
	.route("/:productId")
	.all(authenticateUser, authorizePermissions("admin"))
	.patch(updateProductValidator, handleValidationErrors, updateProduct)
	.delete(deleteProduct);

// VARIANT ROUTES
router.post(
	"/:productId/variants",
	authenticateUser,
	authorizePermissions("admin"),
	addVariantValidator,
	handleValidationErrors,
	addProductVariant
);

export default router;
