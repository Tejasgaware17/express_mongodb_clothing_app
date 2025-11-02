import { body } from "express-validator";

export const addVariantValidator = [
	body("color").notEmpty().withMessage("Variant color is required.").trim(),

	body("sizes")
		.isArray({ min: 1 })
		.withMessage("At least one size is required."),

	body("sizes.*.size")
		.notEmpty()
		.withMessage("Size is required for each variant."),

	body("sizes.*.stock")
		.notEmpty()
		.withMessage("Stock is required.")
		.isNumeric({ no_symbols: true })
		.withMessage("Stock must be a positive number."),
];

export const addSizeValidator = [
	body("size").notEmpty().withMessage("Size is required."),
	body("stock")
		.notEmpty()
		.withMessage("Stock is required.")
		.isNumeric({ no_symbols: true })
		.withMessage("Stock must be a positive number."),
];

export const updateStockValidator = [
	body("stock")
		.notEmpty().withMessage("Stock is required.")
		.isNumeric({ no_symbols: true }).withMessage("Stock must be a positive number."),
];