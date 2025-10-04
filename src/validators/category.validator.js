import { body } from "express-validator";

export const createCategoryValidator = [
	body("name")
		.notEmpty()
		.withMessage("Category name is required.")
		.trim()
		.isLength({ max: 50 })
		.withMessage("Category name cannot be more than 50 characters."),

	body("description")
		.optional()
		.trim()
		.isLength({ max: 500 })
		.withMessage("Description cannot be more than 500 characters."),
];
