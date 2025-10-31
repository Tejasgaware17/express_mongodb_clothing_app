import { StatusCodes } from "http-status-codes";
import {
	TopWear,
	BottomWear,
	Category,
	Product,
	Review,
} from "../models/index.js";
import { sendResponse, generateTitle } from "../utils/index.js";
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
		const { style, ...otherUpdates } = req.body;

		const product = await Product.findOne({ productId });
		if (!product) {
			throw new NotFoundError(`No product found with id: ${productId}`);
		}

		const allowedStyleKeys = {
			"top-wear": [
				"fit",
				"material",
				"sleeve",
				"neckline",
				"closure",
				"pattern",
			],
			"bottom-wear": [
				"fit",
				"material",
				"length",
				"rise",
				"closure",
				"pattern",
			],
		};

		let filteredStyle = {};
		if (style && typeof style === "object") {
			const validKeys = allowedStyleKeys[product.productType];
			if (!validKeys) {
				throw new BadRequestError("Cannot update style for this product type.");
			}
			for (const key in style) {
				if (validKeys.includes(key)) {
					filteredStyle[key] = style[key];
				}
			}
		}

		if (
			Object.keys(otherUpdates).length === 0 &&
			Object.keys(filteredStyle).length === 0
		) {
			throw new BadRequestError("No valid fields provided for update.");
		}

		// Checking the existence of a duplicated Product
		if (req.body.style || req.body.gender || req.body.category) {
			const hypotheticalProduct = {
				productType: product.productType,
				category: req.body.category || product.category,
				gender: req.body.gender || product.gender,
				style: { ...product.style.toObject(), ...style },
			};

			const queryObject = {
				productType: hypotheticalProduct.productType,
				category: hypotheticalProduct.category,
				gender: hypotheticalProduct.gender,
				_id: { $ne: product._id },
			};

			const validKeys = allowedStyleKeys[hypotheticalProduct.productType];

			if (validKeys) {
				for (const key of validKeys) {
					if (hypotheticalProduct.style[key]) {
						queryObject[`style.${key}`] = {
							$regex: `^${hypotheticalProduct.style[key]}$`,
							$options: "i",
						};
					}
				}
			}
			const existingProduct = await Product.findOne(queryObject);
			if (existingProduct) {
				throw new BadRequestError(
					"An update cannot result in a duplicate product."
				);
			}
		}

		// UPDATING the product
		Object.assign(product, otherUpdates);
		Object.assign(product.style, filteredStyle);

		if (req.body.style || req.body.category) {
			product.title = await generateTitle(product);
		}

		await product.save();
		await product.populate({ path: "category", select: "name slug" });

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

// VARIANT CONTROLLERS
export const addProductVariant = async (req, res, next) => {
	try {
		const { productId } = req.params;
		const { color, sizes } = req.body;

		const product = await Product.findOne({ productId });
		if (!product) {
			throw new NotFoundError(`No product found with id: ${productId}`);
		}

		const colorExists = product.variants.some(
			(variant) => variant.color.toLowerCase() === color.toLowerCase()
		);
		if (colorExists) {
			throw new BadRequestError(
				`A variant with the color '${color}' already exists for this product.`
			);
		}

		const newVariant = { color, sizes };
		product.variants.push(newVariant);
		await product.save();

		return res.status(StatusCodes.OK).json(
			sendResponse({
				success: true,
				message: "Product variant added successfully.",
				data: product.variants,
			})
		);
	} catch (error) {
		next(error);
	}
};