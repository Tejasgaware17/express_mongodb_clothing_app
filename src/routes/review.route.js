import { Router } from "express";
import { createReview, getAllReviews } from "../controllers/index.js";
import {
	authenticateUser,
	handleValidationErrors,
} from "../middlewares/index.js";
import { createReviewValidator } from "../validators/index.js";

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

export default router;
