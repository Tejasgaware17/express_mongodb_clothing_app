import { StatusCodes } from "http-status-codes";
import {
	TopWear,
	BottomWear,
	Category,
	Product,
	Review,
} from "../models/index.js";
import { sendResponse } from "../utils/index.js";
import { NotFoundError, BadRequestError } from "../errors/index.js";

export const createProduct = async (req, res, next) => {
	try {
		const {
			productType,
			category: categoryId,
			gender,
			style,
			price,
			discount,
			description,
			isActive,
			images,
			variants,
		} = req.body;
		const category = await Category.findById(categoryId);
		if (!category) {
			throw new NotFoundError(`No category found with id: ${categoryId}`);
		}

		// Checking the product details
		const queryObject = {
			productType,
			category: categoryId,
			gender,
		};

		if (style && typeof style === "object") {
			for (const key in style) {
				if (Object.prototype.hasOwnProperty.call(style, key)) {
					queryObject[`style.${key}`] = {
						$regex: `^${style[key]}$`,
						$options: "i",
					};
				}
			}
		}

		const existingProduct = await Product.findOne(queryObject);
		if (existingProduct) {
			throw new BadRequestError(
				`This product already exists with the id: ${existingProduct.productId}`
			);
		}

		// Creating the product
		const productModels = {
			"top-wear": TopWear,
			"bottom-wear": BottomWear,
		};
		const ModelToCreate = productModels[productType];
		if (!ModelToCreate) {
			throw new BadRequestError("Invalid product type specified.");
		}
		const productPayload = {
			category: category,
			gender,
			style,
			price,
			discount,
			description,
			isActive,
			images,
			variants,
		};

		const product = await ModelToCreate.create(productPayload);
		await product.populate({
			path: "category",
			select: "name slug",
		});

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
		const { search, gender, category, price, discount, sort, page, limit } =
			req.query;
		const queryObject = { isActive: true };

		// Search
		if (search) {
			const searchRegex = new RegExp(search, "i");
			queryObject.$or = [{ title: searchRegex }, { description: searchRegex }];
		}

		// Filters
		if (gender) {
			queryObject.gender = gender;
		}
		if (category) {
			const categoryDoc = await Category.findOne({
				slug: category.toLowerCase(),
			});
			if (categoryDoc) {
				queryObject.category = categoryDoc._id;
			} else {
				queryObject.category = null; // default
			}
		}

		// Numeric Range Filtering (Price and Discount)
		const numericFilters = {};
		if (price) {
			numericFilters.price = {};
			if (price.gte) numericFilters.price.$gte = Number(price.gte);
			if (price.lte) numericFilters.price.$lte = Number(price.lte);
		}
		if (discount) {
			numericFilters.discount = {};
			if (discount.gte) numericFilters.discount.$gte = Number(discount.gte);
		}
		Object.assign(queryObject, numericFilters);

		let result = Product.find(queryObject);

		// Sorting
		if (sort) {
			const sortList = sort.split(",").join(" ");
			result = result.sort(sortList);
		} else {
			result = result.sort("-createdAt"); // Default sort
		}

		// Pagination
		const pageNum = Number(page) || 1;
		const limitNum = Number(limit) || 10;
		const skip = (pageNum - 1) * limitNum;
		result = result.skip(skip).limit(limitNum);

		const products = await result.populate("category", "name slug");

		const totalProducts = await Product.countDocuments(queryObject);
		const totalPages = Math.ceil(totalProducts / limitNum);
		const pagination = {
			totalProducts,
			totalPages,
			currentPage: pageNum,
			limit: limitNum,
		};

		return res.status(StatusCodes.OK).json(
			sendResponse({
				success: true,
				message: "Products fetched successfully.",
				data: { products, count: products.length },
				meta: pagination,
			})
		);
	} catch (error) {
		next(error);
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

		await Review.deleteMany({ product: product._id });
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
