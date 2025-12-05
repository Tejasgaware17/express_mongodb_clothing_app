import { Schema, model } from "mongoose";
import slugify from "slugify";

const CategorySchema = new Schema(
	{
		name: {
			type: String,
			required: [true, "Category name is required"],
			unique: true,
			trim: true,
			maxlength: [50, "Category name cannot be more than 50 characters"],
		},
		slug: {
			type: String,
			unique: true,
			lowercase: true,
		},
		description: {
			type: String,
			trim: true,
			maxlength: [
				500,
				"Category description cannot be more than 500 characters",
			],
		},
	},
	{ timestamps: true }
);

CategorySchema.pre("save", function (next) {
	if (this.isModified("name")) {
		this.slug = slugify(this.name, { lower: true, strict: true });
	}
	next();
});

const Category = model("Category", CategorySchema);

export { Category };
