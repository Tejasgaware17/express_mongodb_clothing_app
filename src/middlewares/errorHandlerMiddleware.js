import { AppError } from "../errors/index.js";
import { StatusCodes } from "http-status-codes";
import sendResponse from "../utils/sendResponse.js";

const errorHandlerMiddleware = (err, req, res, next) => {
	let customError = {
		statusCode: err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR,
		message: err.message || "Something went wrong! try again later",
	};

	return res.status(customError.statusCode).json(
		sendResponse({
			success: false,
			message: customError.message,
			errors: {},
		})
	);
};

export default errorHandlerMiddleware;
