import mongoose from "mongoose";

const connectDatabase = async (uri) => {
	try {
		const conn = await mongoose.connect(uri);
		console.log(`MongoDB connected: ${conn.connection.host}`);
	} catch (error) {
		console.error(`MongoDB connection error: ${error.message}`);
		process.exit(1);
	}
};

export default connectDatabase;
