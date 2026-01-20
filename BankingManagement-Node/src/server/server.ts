import app from "./app.js";
import dbConnection from "../configs/dbConnection.js";
import dotenv from "dotenv";

dotenv.config();

const PORT: string | undefined = process.env.PORT;
const DOMAIN: string | undefined = process.env.DOMAIN || "http://localhost";

// Start the server after establishing the database connection
async function startServer(): Promise<void> {

    try {
        await dbConnection();
        app.listen(PORT, () => {
            console.log(`🟢 Server is running on ${DOMAIN}:${PORT}`);
        });
    } catch (error) {
        console.error("❌ Server failed to start:", error);
        process.exit(1);
    }
}

startServer();