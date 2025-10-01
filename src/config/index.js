import dotenv from "dotenv";
dotenv.config();

export { default as connectDatabase } from "./db.js";

export const config = {
	port: process.env.PORT || 5000,
	mongoURI: process.env.MONGO_URI,
	cookieSecret: process.env.COOKIE_SECRET,
	jwtAccessSecret: process.env.JWT_ACCESS_SECRET,
	jwtAccessExp: process.env.JWT_ACCESS_EXP || "15m",
	jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
	jwtRefreshExp: process.env.JWT_REFRESH_EXP || "7d",
	bcryptSaltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12,
	maxAddressesPerUser: parseInt(process.env.MAX_ADDRESSES_PER_USER) || 3,
};
