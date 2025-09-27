import { StatusCodes } from "http-status-codes";
import User from "../models/user.model.js";
import { BadRequestError, UnauthorizedError } from "../errors/index.js";
import { logger, sendResponse, generateTokens } from "../utils/index.js";
import { config } from "../config/index.js";

export const register = async (req, res, next) => {
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

export const login = async (req, res, next) => {
	try {
		const { email, password } = req.body;

		const user = await User.findOne({ email }).select("+password");
		if (!user) {
			throw new UnauthorizedError("Invalid credentials.");
		}

		const isPasswordCorrect = await user.comparePassword(password);
		if (!isPasswordCorrect) {
			throw new UnauthorizedError("Invalid credentials.");
		}

		// Token generation
		const tokenPayload = { userId: user.userId, role: user.role };
		const { accessToken, refreshToken } = generateTokens(tokenPayload);

		// Http cookie for refreshToken
		res.cookie("refreshToken", refreshToken, {
			httpOnly: true,
			secure: config.nodeEnv === "production",
			signed: true,
			maxAge: 7 * 24 * 60 * 60 * 1000,
		});

		// Response
		const userResponse = user.toObject();
		delete userResponse.password;

		return res.status(StatusCodes.OK).json(
			sendResponse({
				success: true,
				message: "User logged in successfully.",
				data: { user: userResponse, accessToken },
			})
		);
	} catch (error) {
		next(error);
	}
};
