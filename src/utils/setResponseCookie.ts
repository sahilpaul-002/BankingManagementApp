import type {Response} from "express";
import generateJwtToken from "./generateJwtToken..js";
import type { successResponseJson } from "../types/responseJson.js";

const setResponseCookie = (res: Response, jwtTokenValue: string): successResponseJson => {
    try {
        // Create Access Token
        const jwtAuthToken = generateJwtToken(jwtTokenValue);

        // Set response signed cookies
        res.cookie("accessToken", jwtAuthToken, {
            signed: true,

            httpOnly: true,

            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",

            maxAge: 1000 * 60 * 12, // 12 minutes
        })

        return {status: "SUCCESS", message: "Response cookie set successfullly.", data: {jwtAuthToken: jwtAuthToken}};
    }
    catch (error) {
        throw new Error("Failed to set response cookies");
    }
}

export default setResponseCookie;