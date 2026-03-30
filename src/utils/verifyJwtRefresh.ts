import jwt, { type JwtPayload } from "jsonwebtoken";

interface jwtRefreshDtaType extends JwtPayload {
    accessToken: string
    clientId: string
    businessId: string
}

// 🔐 Define return types
type verifyJwtRefreshResponse = {
    status: "SUCCESS";
    jwtAuthData: jwtRefreshDtaType;
} |
{
    status: "EXPIRED";
    message: string;
    expiredAt: Date;
    error: unknown;
} |
{
    status: "INVALID";
    message: string;
    error: unknown;
} |
{
    status: "ERROR";
    error: unknown;
};

// 🔐 Function
const verifyJwtRefresh = async (
    jwtRefreshToken: string,
    jwtRefreshSecretKey?: string
): Promise<verifyJwtRefreshResponse> => {
    try {
        const jwtSecretKey: string =
            jwtRefreshSecretKey ||
            process.env.JWT_SECRET_KEY ||
            "e4b7c2a9d1f6e8c3b5a7d9f2c4e1a6b8d3f0c7a9e5b2d4"

        // Verify token
        const authData = jwt.verify(jwtRefreshToken, jwtSecretKey) as jwtRefreshDtaType;

        return {
            status: "SUCCESS",
            jwtAuthData: authData,
        };
    } catch (error: any) {
        console.log({ status: "ERROR", error });

        if (error.name === "TokenExpiredError") {
            return {
                status: "EXPIRED",
                message: "JWT token has expired",
                expiredAt: error.expiredAt,
                error,
            };
        }
        else if (error.name === "JsonWebTokenError") {
            return {
                status: "INVALID",
                message: "Invalid JWT token",
                error,
            };
        }
        else {
            return {
                status: "ERROR",
                error,
            };
        }
    }
};

export default verifyJwtRefresh;