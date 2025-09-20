import { StatusCodes } from "http-status-codes";
import AppError from "./AppError.js";

class ServiceUnavailableError extends AppError {
	constructor(message = "Service Unavailable") {
		super(message, StatusCodes.SERVICE_UNAVAILABLE);
	}
}

export default ServiceUnavailableError;
