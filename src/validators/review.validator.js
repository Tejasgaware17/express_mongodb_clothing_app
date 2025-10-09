import { body } from "express-validator";

export const createReviewValidator = [
	body("rating")
		.notEmpty()
		.withMessage("Rating is required.")
		.isFloat({ min: 1, max: 5 })
		.withMessage("Rating must be a number between 1 and 5."),

	body("comment")
		.optional()
		.trim()
		.isLength({ max: 500 })
		.withMessage("Comment cannot be more than 500 characters."),
];
