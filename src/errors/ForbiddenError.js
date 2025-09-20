import { StatusCodes } from "http-status-codes";
import AppError from "./AppError.js";

class ForbiddenError extends AppError {
	constructor(message = "Forbidden") {
		super(message, StatusCodes.FORBIDDEN);
	}
}

export default ForbiddenError;
