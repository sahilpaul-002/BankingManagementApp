import type {Response} from "express";
import generateJwtToken from "./generateJwtToken.js";
import type { successResponseJson } from "../types/responseJson.js";

const setResponseCookie = (res: Response, tokenName: string, jwtTokenValue: string, maxAge: number): successResponseJson => {
    try {
        if (!tokenName || !jwtTokenValue) {
            throw new Error("Failed to set response cookies: Token name and value not present");
        }

        // Set response signed cookies
        res.cookie(tokenName, jwtTokenValue, {
            signed: true,

            httpOnly: true,

            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",

            // maxAge: 1000 * 60 * 12, // 12 minutes
            maxAge: maxAge
        })

        return {status: "SUCCESS", message: "Response cookie set successfullly."};
    }
    catch (error) {
        throw new Error("Failed to set response cookies");
    }
}

export default setResponseCookie;