import { StatusCodes } from "http-status-codes";
import AppError from "./AppError.js";

class InternalServerError extends AppError {
	constructor(message = "Internal Server Error") {
		super(message, StatusCodes.INTERNAL_SERVER_ERROR);
	}
}

export default InternalServerError;
