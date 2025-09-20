import { StatusCodes } from "http-status-codes";
import AppError from "./AppError.js";

class ValidationError extends AppError {
	constructor(message = "Validation Error") {
		super(message, StatusCodes.UNPROCESSABLE_ENTITY);
	}
}

export default ValidationError;
