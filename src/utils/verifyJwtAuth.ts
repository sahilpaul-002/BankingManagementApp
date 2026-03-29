import jwt, { type JwtPayload } from "jsonwebtoken"
import verifyJwtRefresh from "./verifyJwtRefresh"
import generateJwtAuth from "./generateJwtAuth"

// 🔹 Types
interface JwtAuthData extends JwtPayload {
    email?: string
    accessToken?: string
}

type VerifyResponse =
    | {
        status: "SUCCESS"
        jwtAuthData: JwtAuthData
    }
    | {
        status: "NEW_TOKEN"
        message: string
        jwtAuthToken: string
    }
    | {
        status: "UNAUTHORIZED" | "ERROR" | "EXPIRED" | "INVALID"
        message?: string
        error?: unknown
        expiredAt?: Date
    }

const verifyJwtAuth = async (
    jwtAuthToken: string,
    jwtRefreshToken: string,
    sessionEmail?: string,
    sessionAccessToken?: string
): Promise<VerifyResponse> => {
    try {
        const jwtSecretKey: string =
            secretKey ||
            process.env.JWT_SECRET_KEY ||
            "e4b7c2a9d1f6e8c3b5a7d9f2c4e1a6b8d3f0c7a9e5b2d4"

        return { status: "SUCCESS", jwtAuthData: authData }
    } catch (error: any) {
        console.log({ status: "ERROR", error })

        if (error.name === "TokenExpiredError") {
            try {
                const jwtRefreshAuthVerifyResponse = await verifyJwtRefresh(jwtRefreshToken)

                if (jwtRefreshAuthVerifyResponse?.status?.toUpperCase() !== "SUCCESS") {
                    return {
                        status: "UNAUTHORIZED",
                        message: "Unauthorized session",
                        error: "Error verifying refresh token"
                    }
                }

                const { email } = jwtRefreshAuthVerifyResponse.jwtAuthData || {}

                if (!email || email !== sessionEmail) {
                    return {
                        status: "UNAUTHORIZED",
                        message: "Unauthorized session",
                        error: "Invalid refresh token"
                    }
                }

                const generateJwtAuthTokenResponse = await generateJwtAuth({
                    authDataObject: {
                        email: sessionEmail,
                        accessToken: sessionAccessToken
                    },
                    expirationTime: "14m"
                })

                if (generateJwtAuthTokenResponse?.status?.toUpperCase() !== "SUCCESS") {
                    return {
                        status: "ERROR",
                        message: "Error generating new JWT token"
                    }
                }

                return {
                    status: "NEW_TOKEN",
                    message: "New auth token generated",
                    jwtAuthToken: generateJwtAuthTokenResponse.jwtAuthToken
                }
            } catch (error: any) {
                console.log({ status: "ERROR", error })

                if (error.name === "TokenExpiredError") {
                    return {
                        status: "EXPIRED",
                        message: "JWT token has expired",
                        expiredAt: error.expiredAt,
                        error
                    }
                }

                if (error.name === "JsonWebTokenError") {
                    return {
                        status: "INVALID",
                        message: "Invalid JWT token",
                        error
                    }
                }

                return { status: "ERROR", error }
            }
        }

        if (error.name === "JsonWebTokenError") {
            return {
                status: "INVALID",
                message: "Invalid JWT token",
                error
            }
        }

        return { status: "ERROR", error }
    }
}

export default verifyJwtAuth