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

export const Review = model("Review", ReviewSchema);
