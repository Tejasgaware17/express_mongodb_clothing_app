import mongoose from "mongoose";
import { logger } from "../utils/index.js";

export const connectDatabase = async (uri) => {
	try {
		const conn = await mongoose.connect(uri);
		logger.info(`MongoDB connected: ${conn.connection.host}`);
	} catch (error) {
		logger.error(`MongoDB connection error: ${error.message}`);
		process.exit(1);
	}
};
