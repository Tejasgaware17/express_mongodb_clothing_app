import { Router } from "express";
import {
	createReview,
	getAllReviews,
	updateReview,
} from "../controllers/index.js";
import {
	authenticateUser,
	handleValidationErrors,
} from "../middlewares/index.js";
import {
	createReviewValidator,
	updateReviewValidator,
} from "../validators/index.js";

const router = Router({ mergeParams: true });

router
	.route("/")
	.post(
		authenticateUser,
		createReviewValidator,
		handleValidationErrors,
		createReview
	)
	.get(getAllReviews);

router.patch(
	"/:reviewId",
	authenticateUser,
	updateReviewValidator,
	handleValidationErrors,
	updateReview
);

export default router;
