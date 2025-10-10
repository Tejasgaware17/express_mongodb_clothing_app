import { Schema, model } from "mongoose";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { config } from "../config/index.js";
import AddressSchema from "./address.model.js";

const UserSchema = new Schema(
	{
		userId: {
			type: String,
			default: uuidv4,
			unique: true,
			index: true,
		},
		name: {
			first: {
				type: String,
				required: [true, "First name is required"],
				trim: true,
			},
			last: {
				type: String,
				required: [true, "Last name is required"],
				trim: true,
			},
		},
		email: {
			type: String,
			required: [true, "Email is required"],
			unique: true,
			match: [/.+\@.+\..+/, "Please provide a valid email address"],
			lowercase: true,
			trim: true,
		},
		password: {
			type: String,
			required: [true, "Password is required"],
			minlength: [8, "Password must be at least 8 characters long"],
			select: false,
			trim: true,
		},
		phone: {
			type: String,
			trim: true,
			unique: true,
			sparse: true,
			match: [/^\d{10}$/, "Please provide a valid 10-digit phone number"],
		},
		gender: {
			type: String,
			enum: ["male", "female"],
			lowercase: true,
		},
		role: {
			type: String,
			enum: ["customer", "admin"],
			default: "customer",
			lowercase: true,
			select: false,
		},
		memberStatus: {
			type: String,
			enum: ["regular", "premium"],
			default: "regular",
			lowercase: true,
		},
		addresses: [AddressSchema],
		refreshTokens: [String],
	},
	{ timestamps: true }
);

// Password hashing Middleware
UserSchema.pre("save", async function (next) {
	if (!this.isModified("password")) return;

	const salt = await bcrypt.genSalt(config.bcryptSaltRounds);
	this.password = await bcrypt.hash(this.password, salt);
	next();
});

// Password comparing Method
UserSchema.methods.comparePassword = async function (candidatePassword) {
	return await bcrypt.compare(candidatePassword, this.password);
};

const User = model("User", UserSchema);

export { User };
