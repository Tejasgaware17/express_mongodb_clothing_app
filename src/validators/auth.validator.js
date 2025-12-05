import { body } from "express-validator";

export const registerValidator = [
	body("firstName").notEmpty().withMessage("First name is required.").trim(),

	body("lastName").notEmpty().withMessage("Last name is required.").trim(),

	body("email")
		.notEmpty()
		.withMessage("Email is required.")
		.isEmail()
		.withMessage("Please provide a valid email address.")
		.trim()
		.normalizeEmail(),

	body("password")
		.notEmpty()
		.withMessage("Password is required.")
		.trim()
		.isLength({ min: 8 })
		.withMessage("Password must be at least 8 characters long.")
		.matches(
			/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
		)
		.withMessage(
			"Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character."
		),
];

export const loginValidator = [
	body("email")
		.notEmpty()
		.withMessage("Email is required.")
		.isEmail()
		.withMessage("Please provide a valid email address.")
		.trim(),

	body("password").notEmpty().withMessage("Password is required.").trim(),
];
