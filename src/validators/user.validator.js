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

export const addressValidator = [
	body("label")
		.notEmpty()
		.withMessage("An address label is required.")
		.trim()
		.toLowerCase(),

	body("area").notEmpty().withMessage("Area is required.").trim(),

	body("city").notEmpty().withMessage("City is required.").trim(),

	body("state").notEmpty().withMessage("State is required.").trim(),

	body("postalCode")
		.notEmpty()
		.withMessage("Postal code is required.")
		.trim()
		.isPostalCode("IN")
		.withMessage("Please provide a valid Indian postal code."),
];
