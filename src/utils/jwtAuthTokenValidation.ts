import jwt, { type JwtPayload } from "jsonwebtoken"
import type { Request, Response, NextFunction } from "express"
import type { failedResponseJson, successResponseJson } from "../types/responseJson.js"
import verifyJwtAuth from "../utils/verifyJwtAuth.js"
import extractJwtTokenValue from "./extractJwtTokenValue.js"
import setResponseCookie from "./setResponseCookie.js"

interface jwtAuthDataType extends JwtPayload {
  accessToken: string
  userType: string
}

const jwtAuthTokenValidation = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response<failedResponseJson> | void> => {
  const jwtAuthToken: string = req.signedCookies?.authToken
  const jwtRefreshToken: string = req.signedCookies?.refreshToken
  const sessionAccessToken: string | undefined = req.session?.sessiondata?.accessToken
  const sessionUserType: string | undefined = req.session?.userType
  const sessionClientId: string | undefined = req.session?.sessiondata?.clientId;
  const sessionBusinessId: string | undefined = req.session?.sessiondata?.businessId;

  try {
    if (!sessionAccessToken || !sessionUserType || !sessionClientId || !sessionBusinessId) {
      return res.status(400).json({ status: "UNAUTHENTICATED", message: "Session not authenticated" })
    }

    // Extract token value of sessiondata access token
    const jwtTokenVerificationResult: successResponseJson = extractJwtTokenValue(sessionAccessToken as string);
    if (jwtTokenVerificationResult.status !== "SUCCESS") {
      return res.status(400).json({ status: "INTERNAL_SERVER_ERROR", message: "Failed to extract JWT token value from sessiondata access token" });
    }
    const accessToken: string = (jwtTokenVerificationResult.data as { jwtTokenValue?: string })?.jwtTokenValue as string
    const jwtSecretKey: string = process.env.JWT_SECRET_KEY || "e4b7c2a9d1f6e8c3b5a7d9f2c4e1a6b8d3f0c7a9e5b2d4"


    if (!jwtAuthToken || !jwtRefreshToken) {
      res.status(400).json({
        status: "UNAUTHORIZED",
        message: "Missing authentication token"
      })
      return
    }

    const jwtAuthVerifyResponse = await verifyJwtAuth(
      jwtAuthToken,
      jwtRefreshToken,
      accessToken,
      sessionUserType,
      jwtSecretKey
    )

    if (jwtAuthVerifyResponse?.status === "NEW_TOKEN") {
      const authToken: string = jwtAuthVerifyResponse?.jwtAuthToken;

      // Set Auth Token Cookie
      const setResponseAuthCookieResult: successResponseJson = setResponseCookie(res, "authToken", authToken, 1000 * 60 * 12);
      if (setResponseAuthCookieResult.status.toUpperCase() !== "SUCCESS") {
        return res.status(400).json({ status: "INTERNAL_SERVER_ERROR", message: "Failed to set response cookie" });
      }

      // res.cookie("authToken", authToken, {
      //   httpOnly: true,
      //   secure:
      //     (process.env.NODE_ENV ?? "").toUpperCase() === "DEVELOPMENT"
      //       ? false
      //       : true,
      //   sameSite:
      //     (process.env.NODE_ENV ?? "").toUpperCase() === "DEVELOPMENT"
      //       ? "lax"
      //       : "none",
      //   signed: true,
      //   maxAge: 12 * 60 * 1000
      // })

      next()
      return
    }

    if (jwtAuthVerifyResponse?.status !== "SUCCESS") {
      res.status(400).json({
        status: "UNAUTHORIZED",
        message: "Error occurred while verifying authentication token"
      })
      return
    }

    const jwtAuthData = jwtAuthVerifyResponse.jwtAuthData

    if (jwtAuthData?.accessToken !== accessToken || jwtAuthData?.userType !== sessionUserType) {
      res.status(400).json({
        status: "UNAUTHORIZED",
        message: "Invalid or tampered authentication token",
      })
      return
    }

    next()
  } catch (err) {
    res.status(400).json({
      status: "INTERNAL_SERVER_ERROR",
      message: "Internal server error",
      error: err
    })
  }
}

export default jwtAuthTokenValidation