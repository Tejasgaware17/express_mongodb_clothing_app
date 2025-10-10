import mongoose, { Schema, model } from "mongoose";

const ReviewSchema = new Schema(
	{
		rating: {
			type: Number,
			min: 1,
			max: 5,
			required: [true, "Please provide a rating (1-5)."],
		},
		comment: {
			type: String,
			trim: true,
			maxlength: [500, "Review cannot be more than 500 characters."],
		},
		user: {
			type: Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		product: {
			type: Schema.Types.ObjectId,
			ref: "Product",
			required: true,
		},
	},
	{ timestamps: true }
);

ReviewSchema.index({ product: 1, user: 1 }, { unique: true });

// Calculating and updating the average ratings for the product
ReviewSchema.statics.calculateAverageRating = async function (productId) {
	const reviewStats = await this.aggregate([
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
		await mongoose.model("Product").findByIdAndUpdate(productId, {
			ratings: {
				average: reviewStats[0]?.averageRating.toFixed(1) || 0,
				count: reviewStats[0]?.numberOfReviews || 0,
			},
		});
	} catch (error) {
		logger.error(
			`Failed to update product ratings for product ${productId}:`,
			error
		);
	}
};

ReviewSchema.post("save", function () {
	this.constructor.calculateAverageRating(this.product);
});

ReviewSchema.post("remove", function () {
	this.constructor.calculateAverageRating(this.product);
});

export const Review = model("Review", ReviewSchema);
