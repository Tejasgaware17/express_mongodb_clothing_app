import { body } from "express-validator";

export const updateUserValidator = [
	body("firstName")
		.optional()
		.notEmpty()
		.withMessage("First name cannot be empty.")
		.trim(),

	body("lastName")
		.optional()
		.notEmpty()
		.withMessage("Last name cannot be empty.")
		.trim(),

	body("phone")
		.optional()
		.trim()
		.matches(/^\d{10}$/)
		.withMessage("Please provide a valid 10-digit phone number."),

	body("gender")
		.optional()
		.toLowerCase()
		.isIn(["male", "female", "other"])
		.withMessage("Invalid gender specified."),
];
