import { StatusCodes } from "http-status-codes";
import { User, Review, Product } from "../models/index.js";
import { sendResponse, calculateAverageRating } from "../utils/index.js";
import {
	BadRequestError,
	NotFoundError,
	UnauthorizedError,
} from "../errors/index.js";

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

		await calculateAverageRating(product._id);

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

export const getAllReviews = async (req, res, next) => {
	try {
		const { productId } = req.params;
		const product = await Product.findOne({ productId });
		if (!product) {
			throw new NotFoundError(`No product found with id: ${productId}`);
		}

		const reviews = await Review.find({ product: product._id }).populate({
			path: "user",
			select: "name",
		});

		return res.status(StatusCodes.OK).json(
			sendResponse({
				success: true,
				message: "Reviews fetched successfully.",
				data: { reviews, count: reviews.length },
			})
		);
	} catch (error) {
		next(error);
	}
};

export const updateReview = async (req, res, next) => {
	try {
		const { reviewId } = req.params;
		const { rating, comment } = req.body;
		const review = await Review.findById(reviewId);
		if (!review) {
			throw new NotFoundError(`No review found with id: ${reviewId}`);
		}

		const user = await User.findOne({ userId: req.user.userId });
		if (review.user.toString() !== user._id.toString()) {
			throw new UnauthorizedError(
				"You are not authorized to edit this review."
			);
		}

		if (rating) review.rating = rating;
		if (comment) review.comment = comment;

		await review.save();
		await calculateAverageRating(review.product);

		return res.status(StatusCodes.OK).json(
			sendResponse({
				success: true,
				message: "Review updated successfully.",
				data: review,
			})
		);
	} catch (error) {
		next(error);
	}
};

export const deleteReview = async (req, res, next) => {
	try {
		const { reviewId } = req.params;

		const review = await Review.findById(reviewId);
		if (!review) {
			throw new NotFoundError(`No review found with id: ${reviewId}`);
		}
		const user = await User.findOne({ userId: req.user.userId });
		if (review.user.toString() !== user._id.toString()) {
			throw new UnauthorizedError(
				"You are not authorized to delete this review."
			);
		}

		const productId = review.product;
		await review.deleteOne();
		await calculateAverageRating(productId);

		return res.status(StatusCodes.OK).json(
			sendResponse({
				success: true,
				message: "Review deleted successfully.",
			})
		);
	} catch (error) {
		next(error);
	}
};
