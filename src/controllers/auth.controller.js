import { StatusCodes } from "http-status-codes";
import User from "../models/user.model.js";
import { BadRequestError } from "../errors/index.js";
import { logger, sendResponse } from "../utils/index.js";

export const registerUser = async (req, res, next) => {
	try {
		const { email, password } = req.body;

		const existingUser = await User.findOne({ email });
		if (existingUser) {
			throw new BadRequestError(`User with email ${email} already exists.`);
		}

		const user = await User.create({ email, password });

        // Response
		const userResponse = user.toObject();
		delete userResponse.password;
		logger.info(`New user registered successfully: ${user.email}`);

		return res.status(StatusCodes.CREATED).json(
			sendResponse({
				success: true,
				message: "User registered successfully.",
				data: userResponse,
			})
		);
	} catch (error) {
		next(error);
	}
};
