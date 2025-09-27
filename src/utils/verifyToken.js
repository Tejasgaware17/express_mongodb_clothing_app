import jwt from "jsonwebtoken";

export const verifyToken = (payload, secret) => {
	try {
		const decoded = jwt.verify(payload, secret);
		return {
			payload: decoded,
			expired: false,
		};
	} catch (error) {
		return {
			payload: null,
			expired: error.message.includes("jwt expired"),
		};
	}
};
