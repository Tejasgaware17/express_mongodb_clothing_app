import { StatusCodes } from "http-status-codes";
import { sendResponse } from "../utils/index.js";

const errorHandlerMiddleware = (err, req, res, next) => {
	let customError = {
		statusCode: err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR,
		message: err.message || "Something went wrong! Please try again later.",
	};

	// Mongoose Validation Error
	if (err.name === "ValidationError") {
		customError.message = Object.values(err.errors)
			.map((item) => item.message)
			.join(", ");
		customError.statusCode = StatusCodes.BAD_REQUEST;
	}

	// Mongoose Duplicate Key Error
	if (err.code && err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        const value = Object.values(err.keyValue)[0];
        
        customError.message = `An account with this ${field} (${value}) already exists. Please use a different ${field}.`;
        customError.statusCode = StatusCodes.BAD_REQUEST;
    }

	// Mongoose Cast Error
	if (err.name === "CastError") {
		customError.message = `No item found with id: ${err.value}`;
		customError.statusCode = StatusCodes.NOT_FOUND;
	}

	return res.status(customError.statusCode).json(
		sendResponse({
			success: false,
			message: customError.message,
		})
	);
};

export default errorHandlerMiddleware;
