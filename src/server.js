import app from "./app.js";
import { connectDatabase, config } from "./config/index.js";

connectDatabase(config.mongoURI);

app.listen(config.port, () => {
	console.log(`Server running on port ${config.port}`);
});
