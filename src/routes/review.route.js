import { Router } from "express";
import { createReview } from "../controllers/index.js";
import {
	authenticateUser,
	handleValidationErrors,
} from "../middlewares/index.js";
import { createReviewValidator } from "../validators/index.js";

const router = Router({ mergeParams: true });

router.post(
	"/",
	authenticateUser,
	createReviewValidator,
	handleValidationErrors,
	createReview
);

export default router;
