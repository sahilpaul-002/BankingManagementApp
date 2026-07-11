import jwt, { type JwtPayload } from "jsonwebtoken"
import verifyJwtRefresh from "./verifyJwtRefresh.js"
import generateJwtAuth from "./generateJwtToken.js"

// 🔹 Types
interface jwtAuthDataType extends JwtPayload {
    accessToken: string
    programId: string
    businessId: string
}

type VerifyResponse =
    {
        status: "SUCCESS"
        jwtAuthData: jwtAuthDataType
    }
    | {
        status: "NEW_TOKEN"
        message: string
        jwtAuthToken: string
    }
    | {
        status: "UNAUTHORIZED" | "SERVICE_ERROR" | "EXPIRED" | "INVALID"
        message?: string
        error?: unknown
        expiredAt?: Date
    }

const verifyJwtAuth = async (
    jwtAuthToken: string,
    jwtRefreshToken: string,
    accessToken: string,
    sessionUserType: string,
    jwtAuthSecretKey?: string,
): Promise<VerifyResponse> => {
    const jwtSecretKey: string =
        jwtAuthSecretKey ||
        process.env.JWT_SECRET_KEY ||
        "e4b7c2a9d1f6e8c3b5a7d9f2c4e1a6b8d3f0c7a9e5b2d4"
    try {
        if (!jwtAuthToken || !jwtRefreshToken) {
            return {status: "UNAUTHORIZED", message: "Missing auth token or refresh token"}
        }

        // Verify JWT Auth Token
        const authData = await jwt.verify(jwtAuthToken, jwtSecretKey) as jwtAuthDataType;

        return { status: "SUCCESS", jwtAuthData: authData }
    } catch (error: any) {
        if (error.name === "TokenExpiredError") {
            try {
                const jwtRefreshAuthVerifyResponse = await verifyJwtRefresh(jwtRefreshToken, jwtSecretKey)

                if (jwtRefreshAuthVerifyResponse?.status !== "SUCCESS") {
                    return {
                        status: "UNAUTHORIZED",
                        message: "Error verifying refresh token"
                    }
                }

                const jwtAuthData = jwtRefreshAuthVerifyResponse.jwtAuthData

                if (jwtAuthData?.accessToken !== accessToken) {
                    return {
                        status: "UNAUTHORIZED",
                        message: "Invalid refresh token"
                    }
                }

                const generateJwtAuthToken = await generateJwtAuth(
                    {
                        accessToken: accessToken,
                        userType: sessionUserType
                    },
                    "12m",
                    jwtSecretKey
                )

                if (!generateJwtAuthToken) {
                    return {
                        status: "SERVICE_ERROR",
                        message: "Error generating new JWT token"
                    }
                }

                return {
                    status: "NEW_TOKEN",
                    message: "New auth token generated",
                    jwtAuthToken: generateJwtAuthToken
                }
            } catch (error: any) {
                console.log({ status: "SERVICE_ERROR", error })

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

                return { status: "SERVICE_ERROR", error }
            }
        }

        if (error.name === "JsonWebTokenError") {
            return {
                status: "INVALID",
                message: "Invalid JWT token",
                error
            }
        }

        return { status: "SERVICE_ERROR", error }
    }
}

export default verifyJwtAuth