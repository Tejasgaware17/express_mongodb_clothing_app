import jwt from "jsonwebtoken";
import { config } from "../config/index.js";

/**
 * @param {Object} payload
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
