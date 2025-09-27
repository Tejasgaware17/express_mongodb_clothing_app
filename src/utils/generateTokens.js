import jwt from "jsonwebtoken";
import { config } from "../config/index.js";

/**
 * Generates Access and Refresh tokens for a given user payload.
 * @param {Object} payload - The user data to include in the token (e.g., userId, role).
 * @returns { {accessToken: string, refreshToken: string} }
 */
export const generateTokens = (payload) => {
	const accessToken = jwt.sign(payload, config.jwtAccessSecret, {
		expiresIn: config.jwtAccessExp,
	});

	const refreshToken = jwt.sign(payload, config.jwtRefreshSecret, {
		expiresIn: config.jwtRefreshExp,
	});

	return { accessToken, refreshToken };
};
