// import jwt from "jsonwebtoken"
// import dotenv from "dotenv"
// import { object } from "zod";

// // Load environment variable
// dotenv.config();
// const jwtSecretKey: string = process.env.JWT_SECRET_KEY || "e4b7c2a9d1f6e8c3b5a7d9f2c4e1a6b8d3f0c7a9e5b2d4"

// const generateJwtToken = (data: string | {accessToken: string, email: string, id: string, role: string} | {accessToken: string, email: string, id: string}): string => {
//     try {
//         // Generate JWT token
//         const jwtToken: string = jwt.sign({jwtTokenData: data}, jwtSecretKey, { expiresIn: "12m" }); 
//         return jwtToken;
//     }
//     catch (error) {
//         throw new Error("Failed to generate JWT token");
//     }
// }

// export default generateJwtToken;

import jwt, { type SignOptions } from "jsonwebtoken"
import dotenv from "dotenv"

dotenv.config()

type authTokenType = {
    accessToken: string
    userType: string
}

type refreshTokenType = {
    accessToken: string
    clientId: string
    businessId: string
}

type JwtPayloadType = string | authTokenType | refreshTokenType

const generateJwtToken = (
    data: JwtPayloadType,
    expiration?: SignOptions["expiresIn"],
    secretKey?: string,
): string => {
    try {
        const jwtSecretKey: string =
            secretKey ||
            process.env.JWT_SECRET_KEY ||
            "e4b7c2a9d1f6e8c3b5a7d9f2c4e1a6b8d3f0c7a9e5b2d4"

        let options: SignOptions | undefined

        if (expiration) {
            options = { expiresIn: expiration }
        }

        const jwtToken = jwt.sign(
            data,
            jwtSecretKey,
            options
        )

        return jwtToken
    } catch (error) {
        throw new Error("Failed to generate JWT token")
    }
}

export default generateJwtToken