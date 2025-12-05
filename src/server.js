import app from "./app.js";
import { connectDatabase, config } from "./config/index.js";
import { logger } from "./utils/index.js";

connectDatabase(config.mongoURI);

app.listen(config.port, () => {
	logger.info(`Server running on port ${config.port}`);
});
