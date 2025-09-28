import { UnauthorizedError } from "../errors/index.js";
import { verifyToken } from "../utils/index.js";
import { config } from "../config/index.js";

const authenticateUser = (req, res, next) => {
	const authHeader = req.headers.authorization;
	if (!authHeader || !authHeader.startsWith("Bearer ")) {
		throw new UnauthorizedError("Authentication Invalid: No token provided.");
	}

	const token = authHeader.split(" ")[1];

	try {
		// Token verification
		const { payload } = verifyToken(token, config.jwtAccessSecret);

		req.user = { userId: payload.userId, role: payload.role };
		next();
	} catch (error) {
		throw new UnauthorizedError(
			"Authentication Invalid: Token is invalid or expired."
		);
	}
};

export { authenticateUser };
