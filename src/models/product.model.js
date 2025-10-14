import { Schema, model } from "mongoose";
import { v4 as uuidv4 } from "uuid";

// SUB-SCHEMAS
const ImageSchema = new Schema(
	{
		type: {
			type: String,
			enum: ["fullView", "closeView", "normalView"],
			required: true,
		},
		url: { type: String, required: true },
	},
	{ _id: false }
);

const SizeSchema = new Schema(
	{
		size: { type: Schema.Types.Mixed, required: true },
		stock: { type: Number, required: true, min: 0, default: 0 },
	},
	{ _id: false }
);

const VariantSchema = new Schema(
	{
		color: { type: String, required: true, trim: true, lowercase: true },
		sizes: [SizeSchema],
	},
	{ _id: false }
);

// BASE PRODUCT SCHEMA
const productSchemaOptions = {
	timestamps: true,
	discriminatorKey: "productType",
	toJSON: {
		virtuals: true,
		transform: function (doc, ret) {
			delete ret.__v;
		},
	},
	toObject: {
		virtuals: true,
		transform: function (doc, ret) {
			delete ret.__v;
		},
	},
};

const ProductSchema = new Schema(
	{
		productId: { type: String, default: uuidv4, unique: true, index: true },
		title: { type: String, required: true, trim: true },
		price: { type: Number, required: [true, "Price is required"], min: 0 },
		discount: { type: Number, default: 0, min: 0, max: 100 },
		description: {
			type: String,
			required: [true, "Description is required"],
			trim: true,
		},
		gender: {
			type: String,
			enum: ["men", "women", "unisex"],
			required: true,
			lowercase: true,
		},
		category: {
			type: Schema.Types.ObjectId,
			ref: "Category",
			required: true,
		},
		isActive: { type: Boolean, default: true },
		images: [ImageSchema],
		ratings: {
			average: { type: Number, default: 0, min: 0, max: 5 },
			count: { type: Number, default: 0, min: 0 },
		},
		variants: [VariantSchema],
	},
	productSchemaOptions
);

ProductSchema.virtual("sellingPrice").get(function () {
	if (this.price && this.discount > 0) {
		const discountedPrice = (this.price * this.discount) / 100;
		return Math.round(this.price - discountedPrice);
	}
	return this.price;
});

ProductSchema.pre("validate", async function (next) {
	if (!this.isNew) {
		return next();
	}

	try {
		const style = this.style || {};
		const titleParts = [style.fit, style.pattern]; // Product styles

		// Category
		let categoryName = "";
		if (this.category) {
			if (this.category.name) {
				categoryName = this.category.name;
			} else {
				const categoryDoc = await model("Category").findById(this.category);
				if (categoryDoc) {
					categoryName = categoryDoc.name;
				}
			}
		}

		// Combining the parts into a TITLE for product
		const generatedTitle = titleParts
			.filter((part) => part)
			.join(" ")
			.toUpperCase();
		this.title = `${generatedTitle} ${categoryName.toUpperCase()}`.trim();
		if (!this.title) {
			this.title = `${this.productType
				.toUpperCase()
				.replace("WEAR", "")} - ${categoryName.toUpperCase()}`.trim();
		}

		next();
	} catch (error) {
		next(error);
	}
});

const Product = model("Product", ProductSchema);

// DISCRIMINATOR TOP-WEAR
const TopWear = Product.discriminator(
	"top-wear",
	new Schema({
		style: {
			fit: String,
			material: String,
			sleeve: String,
			neckline: String,
			closure: String,
			pattern: String,
		},
	})
);

// DISCRIMINATOR BOTTOM-WEAR
const BottomWear = Product.discriminator(
	"bottom-wear",
	new Schema({
		style: {
			fit: String,
			material: String,
			length: String,
			rise: String,
			closure: String,
			pattern: String,
		},
	})
);

export { Product, TopWear, BottomWear };
