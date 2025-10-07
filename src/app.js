import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";

import { config } from "./config/index.js";
import { StatusCodes } from "http-status-codes";
import { sendResponse } from "./utils/index.js";
import {
	errorHandlerMiddleware,
	routeNotFoundMiddleware,
} from "./middlewares/index.js";
import routes from "./routes/index.js";

const app = express();

// Middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(cookieParser(config.cookieSecret));
app.set("trust proxy", 1);

const limiter = rateLimit({
	windowMs: config.rateLimiterWindowMs,
	max: config.rateLimiterMax,
	message: "Too many requests from this IP, please try again after 15 minutes",
});
app.use(limiter);

// Health
app.get("/api/v1/health", (req, res) => {
	return res.status(StatusCodes.OK).json(
		sendResponse({
			success: true,
			message: "Server is running",
		})
	);
});

// Routes
app.use("/api/v1", routes);

// Error handling middlewares
app.use(routeNotFoundMiddleware);
app.use(errorHandlerMiddleware);

export default app;
