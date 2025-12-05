import { sendResponse } from "../utils/index.js";
import { StatusCodes } from "http-status-codes";

const routeNotFoundMiddleware = (req, res) => {
	return res.status(StatusCodes.NOT_FOUND).json(
		sendResponse({
			success: false,
			message: "Route not found!",
		})
	);
};

export default routeNotFoundMiddleware;
