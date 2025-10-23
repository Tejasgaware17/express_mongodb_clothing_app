import { StatusCodes } from "http-status-codes";
import { Category } from "../models/index.js";
import { sendResponse } from "../utils/index.js";
import { BadRequestError, NotFoundError } from "../errors/index.js";
import slugify from "slugify";

export const createCategory = async (req, res, next) => {
	try {
		const { name, description } = req.body;
		const category = await Category.create({ name, description });

		return res.status(StatusCodes.CREATED).json(
			sendResponse({
				success: true,
				message: "Category created successfully.",
				data: category,
			})
		);
	} catch (error) {
		next(error);
	}
};

export const getAllCategories = async (req, res, next) => {
	try {
		const categories = await Category.find({});

		return res.status(StatusCodes.OK).json(
			sendResponse({
				success: true,
				message: "All categories fetched successfully.",
				data: { count: categories.length, categories },
			})
		);
	} catch (error) {
		next(error);
	}
};

export const getCategory = async (req, res, next) => {
	try {
		const { slug } = req.params;
		const category = await Category.findOne({ slug });
		if (!category) {
			throw new NotFoundError(`No category found with slug: ${slug}`);
		}

		return res.status(StatusCodes.OK).json(
			sendResponse({
				success: true,
				message: "Category fetched successfully.",
				data: category,
			})
		);
	} catch (error) {
		next(error);
	}
};

export const updateCategory = async (req, res, next) => {
	try {
		const { slug } = req.params;
		const updateData = req.body;

		if (updateData.name) {
			updateData.slug = slugify(updateData.name, { lower: true, strict: true });
		}

		const category = await Category.findOneAndUpdate({ slug }, updateData, {
			new: true,
			runValidators: true,
		});
		if (!category) {
			throw new NotFoundError(`No category found with slug: ${slug}`);
		}

		return res.status(StatusCodes.OK).json(
			sendResponse({
				success: true,
				message: "Category updated successfully.",
				data: category,
			})
		);
	} catch (error) {
		next(error);
	}
};

export const deleteCategory = async (req, res, next) => {
	try {
		const { slug } = req.params;
		const category = await Category.findOne({ slug });
		if (!category) {
			throw new NotFoundError(`No category found with slug: ${slug}`);
		}

		// Check for products in the associated category
		// const productsInCategory = await Product.countDocuments({
		// 	category: category._id,
		// });
		// if (productsInCategory > 0) {
		// 	throw new BadRequestError(
		// 		"Cannot delete category because it has associated products. Please re-assign or delete those products first."
		// 	);
		// }
		await Category.findByIdAndDelete(category._id);

		return res.status(StatusCodes.OK).json(
			sendResponse({
				success: true,
				message: "Category deleted successfully.",
			})
		);
	} catch (error) {
		next(error);
	}
};
