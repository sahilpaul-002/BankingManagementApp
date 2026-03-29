import { Request, Response, NextFunction } from "express"
import { failedResponseJson } from "../types/responseJson.js"
import verifyJwtAuth from "../utils/verifyJwtAuth.js"
import type { sessiondata } from "../types/sessionTypes.js"

const jwtAuthTokenValidation = async (
  req: Request & { session: sessiondata },
  res: Response,
  next: NextFunction
): Promise<failedResponseJson | void> => {
  const jwtAuthToken = req.signedCookies?.authToken as string | undefined
  const jwtRefreshToken = req.signedCookies?.refreshToken as string | undefined
  const sessionEmail = req.session?.email
  const sessionAccessToken = req.session?.sessiondata?.accessToken

  if (!jwtAuthToken || !jwtRefreshToken) {
    res.status(400).json({
      status: "BAD_REQUEST",
      message: "Unauthorized session",
      error: "Missing authentication token"
    })
    return
  }

  try {
    const jwtAuthVerifyResponse = await verifyJwtAuth(
      jwtAuthToken,
      jwtRefreshToken,
      sessionEmail,
      sessionAccessToken
    )

    if (jwtAuthVerifyResponse?.status?.toUpperCase() === "NEW_TOKEN") {
      const authToken = jwtAuthVerifyResponse.jwtAuthToken

      res.cookie("authToken", authToken, {
        httpOnly: true,
        secure:
          (process.env.NODE_ENV ?? "").toUpperCase() === "DEVELOPMENT"
            ? false
            : true,
        sameSite:
          (process.env.NODE_ENV ?? "").toUpperCase() === "DEVELOPMENT"
            ? "lax"
            : "none",
        signed: true,
        maxAge: 14 * 60 * 1000
      })

      next()
      return
    }

    if (jwtAuthVerifyResponse?.status?.toUpperCase() !== "SUCCESS") {
      res.status(400).json({
        status: "BAD_REQUEST",
        message: "Unauthorized session",
        error: "Error occurred while verifying authentication token"
      })
      return
    }

    const { email, accessToken } = jwtAuthVerifyResponse.jwtAuthData || {}

    if (
      !email ||
      email !== sessionEmail ||
      !accessToken ||
      accessToken !== sessionAccessToken
    ) {
      res.status(400).json({
        status: "UNAUTHORIZED",
        message: "Unauthorized session",
        error: "Invalid or tampered authentication token"
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