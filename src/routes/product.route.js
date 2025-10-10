import { Router } from "express";
import {
	createProduct,
	getAllProducts,
	getProduct,
	updateProduct,
	deleteProduct,
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

export default router;
