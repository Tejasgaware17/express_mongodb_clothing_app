import dotenv from "dotenv";
dotenv.config();

export const config = {
	port: process.env.PORT || 5000,
	mongoURI: process.env.MONGO_URI,
	nodeEnv: process.env.NODE_ENV,
	rateLimiterWindowMs: parseInt(process.env.RATE_LIMITER_WINDOW_MINUTES) * 60 * 1000 || 15 * 60 * 1000,
	rateLimiterMax: parseInt(process.env.RATE_LIMITER_MAX_REQUESTS) || 100,
	cookieSecret: process.env.COOKIE_SECRET,
	jwtAccessSecret: process.env.JWT_ACCESS_SECRET,
	jwtAccessExp: process.env.JWT_ACCESS_EXP || "15m",
	jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
	jwtRefreshExp: process.env.JWT_REFRESH_EXP || "7d",
	bcryptSaltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12,
	maxAddressesPerUser: parseInt(process.env.MAX_ADDRESSES_PER_USER) || 3,
};
