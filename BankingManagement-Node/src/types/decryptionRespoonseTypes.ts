import type { failedResponseJson } from "./responseJson.js";

export type decryptionSuccessJson = {
    status: "SUCCESS";
    decryptedText: string;
};

export type decryptionFailedJson = failedResponseJson;