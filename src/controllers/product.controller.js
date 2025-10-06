import { StatusCodes } from "http-status-codes";
import { TopWear, BottomWear, Category } from "../models/index.js";
import { sendResponse } from "../utils/index.js";
import { NotFoundError } from "../errors/index.js";

export const createProduct = async (req, res, next) => {
	try {
		const { productType, category: categoryId, ...productData } = req.body;

		const category = await Category.findById(categoryId);
		if (!category) {
			throw new NotFoundError(`No category found with id: ${categoryId}`);
		}

		productData.category = categoryId;
		let product;
		if (productType === "top-wear") {
			product = await TopWear.create(productData);
		} else if (productType === "bottom-wear") {
			product = await BottomWear.create(productData);
		} else {
			throw new BadRequestError("Invalid product type specified.");
		}

		return res.status(StatusCodes.CREATED).json(
			sendResponse({
				success: true,
				message: "Product created successfully.",
				data: product,
			})
		);
	} catch (errors) {
		next(errors);
	}
};
