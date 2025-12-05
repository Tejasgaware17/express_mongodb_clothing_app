import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";

const consoleFormat = winston.format.combine(
	winston.format.colorize({ all: true }),
	winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
	winston.format.printf(
		(log) => `[${log.timestamp}] ${log.level}: ${log.message}`
	)
);

const fileFormat = winston.format.combine(
	winston.format.timestamp(),
	winston.format.json()
);

// The rotating transport for all logs
const dailyRotateTransport = new DailyRotateFile({
	filename: "logs/application-%DATE%.log",
	datePattern: "YYYY-MM-DD",
	zippedArchive: true,
	maxSize: "15m",
	maxFiles: "7d",
	format: fileFormat,
});

const transports = [
	new winston.transports.File({
		filename: "logs/error.log",
		level: "error",
		format: fileFormat,
	}),
	dailyRotateTransport,
];

if (process.env.NODE_ENV !== "production") {
	transports.push(new winston.transports.Console({ format: consoleFormat }));
}

const logger = winston.createLogger({
	level: process.env.NODE_ENV === "production" ? "info" : "debug",
	levels: winston.config.npm.levels,
	transports,
});

export default logger;
