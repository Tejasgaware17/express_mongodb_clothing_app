import { StatusCodes } from "http-status-codes";
import { User, Review, Product } from "../models/index.js";
import { sendResponse } from "../utils/index.js";
import { BadRequestError, NotFoundError } from "../errors/index.js";

export const createReview = async (req, res, next) => {
	try {
		const { productId } = req.params;
		const { rating, comment } = req.body;
		const user = await User.findOne({ userId: req.user.userId });
		if (!user) {
			throw new UnauthorizedError("User not found.");
		}

		const product = await Product.findOne({ productId });
		if (!product) {
			throw new NotFoundError(`No product found with id: ${productId}`);
		}
		const alreadySubmitted = await Review.findOne({
			product: product._id,
			user: user._id,
		});
		if (alreadySubmitted) {
			throw new BadRequestError(
				"You have already submitted a review for this product."
			);
		}
        
		const review = await Review.create({
			rating,
			comment,
			product: product._id,
			user: user._id,
		});

		return res.status(StatusCodes.CREATED).json(
			sendResponse({
				success: true,
				message: "Review submitted successfully.",
				data: review,
			})
		);
	} catch (error) {
		next(error);
	}
};
