import { StatusCodes } from "http-status-codes";
import User from "../models/user.model.js";
import { sendResponse } from "../utils/index.js";
import { NotFoundError } from "../errors/index.js";

export const getMe = async (req, res, next) => {
	try {
		const user = await User.findOne({ userId: req.user.userId });
		if (!user) {
			throw new NotFoundError(`No user found with id: ${req.user.userId}`);
		}

		return res.status(StatusCodes.OK).json(
			sendResponse({
				success: true,
				message: "User profile fetched successfully.",
				data: user,
			})
		);
	} catch (error) {
		next(error);
	}
};
