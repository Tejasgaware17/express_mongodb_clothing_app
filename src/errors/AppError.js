import { StatusCodes } from "http-status-codes";

class AppError extends Error {
	constructor(message, statusCode) {
		super(message);
        this.statusCode = statusCode || StatusCodes.INTERNAL_SERVER_ERROR
		this.name = this.constructor.name
        Error.captureStackTrace(this, this.constructor)
	}
}

export default AppError;
