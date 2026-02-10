import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Retrieve database credentials from environment variables 
const dbUsername: string | undefined = process.env.DB_USERNAME;
const dbPassword: string | undefined = process.env.DB_PASSWORD;

// Validate environment variables
if (!dbUsername || !dbPassword) {
    throw new Error("❌ Database credentials are missing in environment variables");
}

const dbUrl: string = `mongodb+srv://${dbUsername}:${dbPassword}@bankingmanagementcluste.ydiokc3.mongodb.net/ShopCart?retryWrites=true&w=majority&appName=BankingManagementCluster`

const dbConnection = async (): Promise<void> => {
    try {
        // ----------------- Connection Event Listeners -----------------
        mongoose.connection.on("connecting", () => {
            console.log("🟡 MongoDB connecting...");
        });

        mongoose.connection.on("connected", () => {
            console.log("🟢 MongoDB connected");
        });

        mongoose.connection.on("open", () => {
            console.log("🟢 MongoDB connection open (ready)");
        });

        mongoose.connection.on("disconnecting", () => {
            console.log("🟠 MongoDB disconnecting...");
        });

        mongoose.connection.on("disconnected", () => {
            console.log("🔴 MongoDB disconnected");
        });

        mongoose.connection.on("reconnected", () => {
            console.log("🟢 MongoDB reconnected");
        });

        mongoose.connection.on("close", () => {
            console.log("⚫ MongoDB connection closed");
        });

        mongoose.connection.on("error", (err: Error) => {
            console.error("❌ MongoDB connection error:", err);
        });

        // ----------------- Connect to MongoDB -----------------
        await mongoose.connect(
            dbUrl,
        );

    } catch (error) {
        console.error("❌ MongoDB initial connection failed:", error);
        process.exit(1);
    }
};

export default dbConnection;