import { Schema } from "mongoose";
import { v4 as uuidv4 } from "uuid";

const AddressSchema = new Schema(
	{
		addressId: {
			type: String,
			default: uuidv4,
			unique: true,
		},
		label: {
			type: String,
			required: [true, "An address label is required (e.g., Home, Office)."],
			trim: true,
			lowercase: true,
		},
		area: {
			type: String,
			required: [true, "Area is required"],
			trim: true,
		},
		landmark: {
			type: String,
			trim: true,
		},
		city: {
			type: String,
			required: [true, "City is required"],
			trim: true,
		},
		state: {
			type: String,
			required: [true, "State is required"],
			trim: true,
		},
		postalCode: {
			type: String,
			required: [true, "Postal code is required"],
			trim: true,
		},
		country: {
			type: String,
			default: "India",
			trim: true,
		},
	},
	{ _id: false }
);

export default AddressSchema;
