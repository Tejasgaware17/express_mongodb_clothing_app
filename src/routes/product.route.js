import { Router } from "express";
import {
	createProduct,
	getAllProducts,
	getProduct,
	updateProduct,
	deleteProduct,
	addProductVariant,
	addProductVariantSize,
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
	addSizeValidator,
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

router.post(
	"/:productId/variants/:color/sizes",
	authenticateUser,
	authorizePermissions("admin"),
	addSizeValidator,
	handleValidationErrors,
	addProductVariantSize
);

export default router;
