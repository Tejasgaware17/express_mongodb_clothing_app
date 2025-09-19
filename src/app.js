import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import routes from "./routes/index.js";

const app = express();

// Middlewares
app.use(helmet);
app.use(cors);
app.use(express.json());
app.set("trust proxy", 1);
const limiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 100,
});
app.use(limiter);

// Health
app.get("/api/v1/health", (req, res) => {
	return res.status(200).json({
		success: true,
		message: "Server is running",
		data: {},
		errors: {},
		meta: {},
	});
});

// Routes
app.use("/api/v1", routes);

export default app;
