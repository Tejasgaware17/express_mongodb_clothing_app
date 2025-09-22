import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { StatusCodes } from "http-status-codes";
import sendResponse from "./utils/sendResponse.js";
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
app.set("trust proxy", 1);

const limiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 100,
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
app.use(errorHandlerMiddleware);
app.use(routeNotFoundMiddleware);

export default app;
