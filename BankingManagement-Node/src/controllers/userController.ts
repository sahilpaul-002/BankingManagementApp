import type { Request, Response } from "express"
import type { failedResponseJson, successResponseJson } from "../types/responseJson.js"
import { asymmetricDecryptionMsg } from "../utils/asymmetricEncryptionDecryption.js";
import type { decryptionFailedJson, decryptionSuccessJson } from "../types/decryptionRespoonseTypes.js";

// ------------------------------ FUNCTION TO SET USERCONTROLLER HEADERS ------------------------------ \\
const userControllerHeader = (req: Request) => {

}
// ------------------------------ xxxxxxxxxxxxxxxxxxxxxxxxxx ------------------------------ \\

// FUNCTION TO PERFORM USER SIGN UP
export const userSignUp = (req: Request, res: Response): Response<successResponseJson | failedResponseJson> | void => {
    // Get encrypted payload
    const encryptedPayload: string = req?.body
    // Decrypt request body
    const decryptionMsgResponse = asymmetricDecryptionMsg(req, encryptedPayload);

    let reqBody: object;
    if (decryptionMsgResponse && decryptionMsgResponse.status.toUpperCase() === "SUCCESS") {
        const successResponse: decryptionSuccessJson = decryptionMsgResponse as decryptionSuccessJson;
        reqBody = JSON.parse(successResponse?.decryptedText);
        // console.log(reqBody)
    }
    else if (decryptionMsgResponse && ["NOT_FOUND", "BAD_REQUEST"].includes(decryptionMsgResponse.status.toUpperCase())) {
        const errorResponse: decryptionFailedJson = decryptionMsgResponse as decryptionFailedJson;
        if (errorResponse?.message?.includes("Assymetric private key not found in session")) {
            return res.status(400).json({ status: "UNAUTHORIZED", message: "Unauthorised Access: Private key not found in session." })
        }
        else if (errorResponse?.message?.includes("Cipher text not found in the function parameter")) {
            return res.status(400).json({ status: "ERROR", message: "Asymmetric decryption service is not working." })
        }
    }
    else {
        return res.status(400).json({ status: "SERVICE_UNAVAILABLE", message: "ASYMMETRIC DECRYPTION SERVICE UNAVAILABLE" })
    }
}