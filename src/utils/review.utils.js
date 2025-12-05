import { Review, Product } from "../models/index.js";
import logger from "./logger.js";

export const calculateAverageRating = async (productId) => {
	const stats = await Review.aggregate([
		{ $match: { product: productId } },
		{
			$group: {
				_id: "$product",
				numberOfReviews: { $sum: 1 },
				averageRating: { $avg: "$rating" },
			},
		},
	]);

	try {
		await Product.findByIdAndUpdate(productId, {
			ratings: {
				average: stats[0]?.averageRating.toFixed(1) || 0,
				count: stats[0]?.numberOfReviews || 0,
			},
		});
	} catch (error) {
		logger.error(
			`Failed to update product ratings for product ${productId}:`,
			error
		);
	}
};
