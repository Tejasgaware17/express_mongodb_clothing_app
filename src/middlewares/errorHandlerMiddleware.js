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
		customError.message = `Duplicate value entered for ${Object.keys(
			err.keyValue
		)} field, please choose another value.`;
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
