import { StatusCodes } from "http-status-codes";
import AppError from "./AppError.js";

class ConflictError extends AppError {
	constructor(message = "Conflict") {
		super(message, StatusCodes.CONFLICT);
	}
}

export default ConflictError;
