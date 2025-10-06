import { body } from "express-validator";
import { isValidObjectId } from "mongoose";

export const createProductValidator = [
	// Validation for base product
	body("productType")
		.notEmpty()
		.withMessage("Product type is required.")
		.isIn(["top-wear", "bottom-wear"])
		.withMessage("Invalid product type."),

	body("price")
		.notEmpty()
		.withMessage("Price is required.")
		.isNumeric()
		.withMessage("Price must be a number."),

	body("description").notEmpty().withMessage("Description is required.").trim(),

	body("gender")
		.notEmpty()
		.withMessage("Gender is required.")
		.isIn(["men", "women", "unisex"])
		.withMessage("Invalid gender."),

	body("category")
		.notEmpty()
		.withMessage("Category is required.")
		.custom((value) => {
			if (!isValidObjectId(value)) {
				throw new Error("Invalid category ID.");
			}
			return true;
		}),

	// Validation for product styles
	body("style").isObject().withMessage("Style information is required."),
	body("style.fit").notEmpty().withMessage("Fit is required for style."),
	body("style.material")
		.notEmpty()
		.withMessage("Material is required for style."),
	body("style.pattern")
		.notEmpty()
		.withMessage("Pattern is required for style."),

	// Validation for product variants
	body("variants")
		.isArray({ min: 1 })
		.withMessage("At least one product variant is required."),
	body("variants.*.color").notEmpty().withMessage("Variant color is required."),
	body("variants.*.sizes")
		.isArray({ min: 1 })
		.withMessage("At least one size is required for each variant."),
	body("variants.*.sizes.*.size").notEmpty().withMessage("Size is required."),
	body("variants.*.sizes.*.stock")
		.isNumeric()
		.withMessage("Stock must be a number."),
];

export const updateProductValidator = [
	body("price").optional().isNumeric().withMessage("Price must be a number."),

	body("description")
		.optional()
		.notEmpty()
		.withMessage("Description cannot be empty.")
		.trim(),

	body("gender")
		.optional()
		.isIn(["men", "women", "unisex"])
		.withMessage("Invalid gender."),

	body("category")
		.optional()
		.custom((value) => {
			if (!isValidObjectId(value)) {
				throw new Error("Invalid category ID.");
			}
			return true;
		}),
];