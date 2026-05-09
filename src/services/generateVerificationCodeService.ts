// src/utils/generateVerificationCode.ts

interface verificationCodeResponseType {
    verificationCode: string
    expiresAt: Date
}

export const generateVerificationCodeService =
    (): verificationCodeResponseType => {

        // Generate random 6 digit code
        const verificationCode = Math.floor(
            100000 + Math.random() * 900000
        ).toString();

        // Current time
        const currentTime = new Date();

        // Expiry time = 4 minutes
        const expiresAt = new Date(
            currentTime.getTime() + 4 * 60 * 1000
        );

        return {
            verificationCode,
            expiresAt
        };
    };