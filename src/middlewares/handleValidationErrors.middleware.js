import { validationResult } from "express-validator";
import { StatusCodes } from "http-status-codes";
import { sendResponse } from "../utils/index.js";

const handleValidationErrors = (req, res, next) => {
	const errors = validationResult(req);

	if (!errors.isEmpty()) {
		return res.status(StatusCodes.BAD_REQUEST).json(
			sendResponse({
				success: false,
				message: "Validation failed.",
				errors: errors.array(),
			})
		);
	}

	next();
};

export default handleValidationErrors;
