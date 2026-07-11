import jwt, { type JwtPayload } from "jsonwebtoken"
import type { Request, Response, NextFunction } from "express"
import type { failedResponseJson, successResponseJson } from "../types/responseJson.js"
import verifyJwtAuth from "../utils/verifyJwtAuth.js"
import extractJwtTokenValue from "./extractJwtTokenValue.js"
import setResponseCookie from "./setResponseCookie.js"
import { AppErrorClass, ServiceError, ServiceUnavailableError, UnauthenticatedError, UnauthorizedError } from "./AppErrorClass.js"
import logger from "./logger.js"

interface jwtAuthDataType extends JwtPayload {
  accessToken: string
  userType: string
}

const jwtAuthTokenValidation = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response<failedResponseJson> | void> => {
  // Skip portal header check for selcted pathes
  const excludedPaths: string[] = ["/sendResetPasswordCode", "/verifyResetPasswrodCode"];
  if (excludedPaths.some(path => req.path === path || req.path.startsWith(path + "/"))) {
    return next();
  }

  const jwtAuthToken: string = req.signedCookies?.authToken
  const jwtRefreshToken: string = req.signedCookies?.refreshToken
  const sessionAccessToken: string | undefined = req.session?.sessiondata?.accessToken
  const sessionUserType: string | undefined = req.session?.userType
  const sessionProgramId: string | undefined = req.session?.userConfiguration?.programId;
  const sessionBusinessId: string | undefined = req.session?.userConfiguration?.businessId;

  try {
    if (!sessionAccessToken || !sessionUserType || !sessionProgramId || !sessionBusinessId) {
      throw new UnauthenticatedError("Session not authenticated")
    }

    // Extract token value of sessiondata access token
    const jwtTokenVerificationResult: successResponseJson = extractJwtTokenValue(sessionAccessToken as string);
    if (jwtTokenVerificationResult.status !== "SUCCESS") {
      throw new ServiceUnavailableError("ExtractJwtTokenValue service is unavaibale")
    }
    const accessToken: string = (jwtTokenVerificationResult.data as { jwtTokenValue?: string })?.jwtTokenValue as string
    const jwtSecretKey: string = process.env.JWT_SECRET_KEY || "e4b7c2a9d1f6e8c3b5a7d9f2c4e1a6b8d3f0c7a9e5b2d4"


    if (!jwtRefreshToken) {
      throw new UnauthenticatedError("Missing authentication token")
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
      const setResponseAuthCookieResult: successResponseJson = setResponseCookie(res, "authToken", authToken, 1000 * 60 * 20);
      if (setResponseAuthCookieResult.status.toUpperCase() !== "SUCCESS") {
        throw new ServiceUnavailableError("SetResponseCookie service is unavaibale")
      }

      next()
      return
    }

    if (jwtAuthVerifyResponse?.status !== "SUCCESS") {
      throw new UnauthorizedError("Error occurred while verifying authentication token")
    }

    const jwtAuthData = jwtAuthVerifyResponse.jwtAuthData

    if (jwtAuthData?.accessToken !== accessToken || jwtAuthData?.userType !== sessionUserType) {
      throw new UnauthorizedError("Invalid or tampered authentication token")
    }

    next()
  }
  catch (err) {
    const error = err as any;
    const url = req.path || "UNKNOWN_URL";
    const errorStatus = error?.status || "UnknownErrorStatus";

    logger.error(error, {
      serviceName: "JwtAuthValidation",
      // url: req.path,
      // method: req.method
    });
    if (error instanceof AppErrorClass) {
      throw error
    }
    throw new ServiceError(
      `JwtAuthValidation facing issue: [${errorStatus}] ${error.message}`,
      error?.error ? error.error : error
    );
  }
}

export default jwtAuthTokenValidation