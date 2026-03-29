import jwt from "jsonwebtoken";
import dotenv from "dotenv"
import type { successResponseJson } from "../types/responseJson.js";

// Load environment variable
dotenv.config();
const jswtSecretKey: string = process.env.JWT_SECRET_KEY || "e4b7c2a9d1f6e8c3b5a7d9f2c4e1a6b8d3f0c7a9e5b2d4"

const extractJwtTokenValue = (token: string): successResponseJson => {
    try {
        const decodedToken: jwt.JwtPayload = jwt.verify(token, jswtSecretKey) as object;
        return {status: "SUCCESS", message: "JWT token valid and data extracted.", data: {jwtTokenValue: decodedToken}};
    } catch (error) {
        throw new Error("Invalid JWT token");
    }
}

export default extractJwtTokenValue;