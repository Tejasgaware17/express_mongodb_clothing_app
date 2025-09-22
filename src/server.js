import dotenv from "dotenv";
import app from "./app.js";
import { connectDatabase } from "./config/index.js";

dotenv.config();

connectDatabase(process.env.MONGO_URI);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`);
});
