import { StatusCodes } from "http-status-codes";
import crypto from "crypto";
import User from "../models/user.model.js";
import { BadRequestError, UnauthorizedError } from "../errors/index.js";
import {
	logger,
	sendResponse,
	generateTokens,
	verifyToken,
} from "../utils/index.js";
import { config } from "../config/index.js";

export const register = async (req, res, next) => {
	try {
		const { firstName, lastName, email, password, phone, gender } = req.body;

		const existingUser = await User.findOne({ email });
		if (existingUser) {
			throw new BadRequestError(`User with email ${email} already exists.`);
		}

		const user = await User.create({
			name: { first: firstName, last: lastName },
			email,
			password,
			phone,
			gender,
		});

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
		if (!user || !(await user.comparePassword(password))) {
			throw new UnauthorizedError("Invalid credentials.");
		}

		// Token generation
		const tokenPayload = { userId: user.userId, role: user.role };
		const { accessToken, refreshToken } = generateTokens(tokenPayload);

		// Hash the refresh token before saving
		const hashedRefreshToken = crypto
			.createHash("sha256")
			.update(refreshToken)
			.digest("hex");

		user.refreshTokens.push(hashedRefreshToken);
		await user.save();

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
		delete userResponse.refreshTokens;

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

export const refreshToken = async (req, res, next) => {
	try {
		const { refreshToken: incomingToken } = req.signedCookies;
		if (!incomingToken) {
			throw new UnauthorizedError("Authentication invalid.");
		}

		const { payload } = verifyToken(incomingToken, config.jwtRefreshSecret);
		if (!payload) {
			throw new UnauthorizedError("Authentication invalid.");
		}

		const hashedIncomingToken = crypto
			.createHash("sha256")
			.update(incomingToken)
			.digest("hex");

		const user = await User.findOne({
			userId: payload.userId,
			refreshTokens: hashedIncomingToken,
		});
		if (!user) {
			throw new UnauthorizedError(
				"Authentication invalid. Token has been invalidated."
			);
		}

		// Generating new tokens
		const tokenPayload = { userId: user.userId, role: user.role };
		const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
			generateTokens(tokenPayload);

		const hashedNewRefreshToken = crypto
			.createHash("sha256")
			.update(newRefreshToken)
			.digest("hex");

		// Rotating tokens in the database
		user.refreshTokens = user.refreshTokens.filter(
			(rt) => rt !== hashedIncomingToken
		);
		user.refreshTokens.push(hashedNewRefreshToken);
		await user.save();

		res.cookie("refreshToken", newRefreshToken, {
			httpOnly: true,
			secure: config.nodeEnv === "production",
			signed: true,
			maxAge: 7 * 24 * 60 * 60 * 1000,
		});

		return res.status(StatusCodes.OK).json(
			sendResponse({
				success: true,
				message: "Access token refreshed successfully.",
				data: { accessToken: newAccessToken },
			})
		);
	} catch (error) {
		next(error);
	}
};

export const logout = async (req, res, next) => {
	try {
		const { refreshToken } = req.signedCookies;
		if (refreshToken) {
			const hashedRefreshToken = crypto
				.createHash("sha256")
				.update(refreshToken)
				.digest("hex");

			// Deleting the token from the user's document
			await User.findOneAndUpdate(
				{ refreshTokens: hashedRefreshToken },
				{ $pull: { refreshTokens: hashedRefreshToken } }
			);
		}

		res.cookie("refreshToken", "", {
			httpOnly: true,
			expires: new Date(0),
		});

		return res.status(StatusCodes.OK).json(
			sendResponse({
				success: true,
				message: "User logged out successfully.",
			})
		);
	} catch (error) {
		next(error);
	}
};
