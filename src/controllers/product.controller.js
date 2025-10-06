import { StatusCodes } from "http-status-codes";
import { TopWear, BottomWear, Category, Product } from "../models/index.js";
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

export const getAllProducts = async (req, res, next) => {
	try {
		const { sort, category, gender, search } = req.query;

		// Filtering
		const queryObject = { isActive: true };
		if (gender) {
			queryObject.gender = gender;
		}
		if (category) {
			const categoryDoc = await Category.findOne({
				slug: category.toLowerCase(),
			});
			if (categoryDoc) {
				queryObject.category = categoryDoc._id;
			}
		}
		if (search) {
			queryObject.title = { $regex: search, $options: "i" }; // Title search
		}

		let result = Product.find(queryObject).populate("category", "name slug");

		// Sorting
		if (sort) {
			const sortList = sort.split(",").join(" ");
			result = result.sort(sortList);
		} else {
			result = result.sort("-createdAt"); // Default sort
		}

		// Pagination
		const page = Number(req.query.page) || 1;
		const limit = Number(req.query.limit) || 10;
		const skip = (page - 1) * limit;
		result = result.skip(skip).limit(limit);

		const products = await result;
		const totalProducts = await Product.countDocuments(queryObject);
		const totalPages = Math.ceil(totalProducts / limit);

		const pagination = {
			totalProducts,
			totalPages,
			currentPage: page,
			limit,
		};

		return res.status(StatusCodes.OK).json(
			sendResponse({
				success: true,
				message: "Products fetched successfully.",
				data: { products, count: products.length },
				meta: pagination,
			})
		);
	} catch (errors) {
		next(errors);
	}
};

export const getProduct = async (req, res, next) => {
	try {
		const { productId } = req.params;
		const product = await Product.findOne({
			productId,
			isActive: true,
		}).populate("category", "name slug");
		if (!product) {
			throw new NotFoundError(`No product found with id: ${productId}`);
		}

		return res.status(StatusCodes.OK).json(
			sendResponse({
				success: true,
				message: "Product fetched successfully.",
				data: product,
			})
		);
	} catch (error) {
		next(error);
	}
};

export const updateProduct = async (req, res, next) => {
	try {
		const { productId } = req.params;
		const updateData = req.body;
		if (updateData.productType) {
			delete updateData.productType;
		}

		const product = await Product.findOneAndUpdate({ productId }, updateData, {
			new: true,
			runValidators: true,
		});
		if (!product) {
			throw new NotFoundError(`No product found with id: ${productId}`);
		}

		return res.status(StatusCodes.OK).json(
			sendResponse({
				success: true,
				message: "Product updated successfully.",
				data: product,
			})
		);
	} catch (error) {
		next(error);
	}
};

export const deleteProduct = async (req, res, next) => {
	try {
		const { productId } = req.params;
		const product = await Product.findOne({ productId });
		if (!product) {
			throw new NotFoundError(`No product found with id: ${productId}`);
		}

		// Delete reviews associated to the product

		await Product.findByIdAndDelete(product._id);

		return res.status(StatusCodes.OK).json(
			sendResponse({
				success: true,
				message: "Product and associated reviews deleted successfully.",
			})
		);
	} catch (error) {
		next(error);
	}
};
