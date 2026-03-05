import jwt from "jsonwebtoken"
import dotenv from "dotenv"

// Load environment variable
dotenv.config();
const jwtSecretKey: string = process.env.JWT_SECRET_KEY || "e4b7c2a9d1f6e8c3b5a7d9f2c4e1a6b8d3f0c7a9e5b2d4"

const generateJwtToken = (value: string): string => {
    try {
        // Generate JWT token
        const jwtToken: string = jwt.sign({jwtTokenValue: value}, jwtSecretKey, { expiresIn: "12m" }); 
        return jwtToken;
    }
    catch (error) {
        throw new Error("Failed to generate JWT token");
    }
}

export default generateJwtToken;