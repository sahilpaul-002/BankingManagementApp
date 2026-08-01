type emailTemplateType =
    | "EMAIL_VERIFICATION_CODE"
    | "FORGET_PASSWORD_CODE"
    | "TWO_FACTOR_AUTH_CODE"
    | "KYC_VERIFICATION"
    | "KYC_REJECTED"
    | "KYC_ACCEPTED"
    | "KYC_ACCEPTED_ADMIN"
    | "USER_BANK_VERIFICATION"
    | "BANK_VERIFICATION_REJECTED"
    | "BANK_VERIFICATION_ACCEPTED"
    | "BANK_VERIFICATION_ACCEPTED_ADMIN"
    | "CARD_TRANSACTION_AUTHORIZATION"

interface verificationCodePayloadType {
    verificationCode: string;
    userName?: string;
    dashboardName?: string;
}

interface kycVerificationCodePayloadType {
    userId: string;
    userName: string;
    poiDocumentUrl: string;
    poaDocumentUrl: string;
    dashboardName?: string;
    approveUrl: string;
    rejectUrl: string;
}

interface kycVerificationRejectedPayloadType {
    userName?: string;
    dashboardName?: string;
}

interface kycVerificationAcceptedPayloadType {
    userName?: string;
    dashboardName?: string;
}

interface kycVerificationAcceptedAdminPayloadType {
    userId: string;
    userName?: string;
    dashboardName?: string;
}

interface userBankVerificationCodePayloadType {
    userId: string,
    userName: string,
    accountHolderName: string,
    accountNumber: string,
    bankName: string,
    dashboardName: string,
    approveUrl: string,
    rejectUrl: string
}

interface userBankAccountVerificationRejectedPayloadType {
    userName?: string;
    dashboardName?: string;
}

interface userBankAccountVerificationAcceptedPayloadType {
    userName?: string;
    dashboardName?: string;
}

interface userBankAccountVerificationAcceptedAdminPayloadType {
    userId: string;
    userName?: string;
    dashboardName?: string;
}

interface cardTransactionAuthorizationPayload {
    userId: string,
    userName: string,
    dashboardName: string,
    cardholderEmail: string,
    transactionId: string,
    maskedCardNumber: string,
    authorizationExpiresAt: string,
    merchantName: string;
    transactionCurrency: string;
    transactionAmount: string;
    approveUrl: string,
    rejectUrl: string
}

interface templateResponseType {
    subject: string;
    html: string;
}

type emailTemplatePayloadType =
    | verificationCodePayloadType
    | kycVerificationCodePayloadType
    | kycVerificationRejectedPayloadType
    | kycVerificationAcceptedPayloadType
    | userBankVerificationCodePayloadType
    | userBankAccountVerificationRejectedPayloadType
    | userBankAccountVerificationAcceptedPayloadType
    | userBankAccountVerificationAcceptedAdminPayloadType
    | cardTransactionAuthorizationPayload

const generateEmailTemplate = (
    templateType: emailTemplateType,
    payload: emailTemplatePayloadType
): templateResponseType => {

    const dashboardTitle = payload?.dashboardName ?? "BMA";

    switch (templateType) {

        // =========================================================
        // EMAIL VERIFICATION
        // =========================================================
        case "EMAIL_VERIFICATION_CODE": {

            const verificationPayload =
                payload as verificationCodePayloadType;

            return {
                subject: "Verify Your Email Address",

                html: `
                <div style="
                    font-family: Arial, sans-serif;
                    background-color: #f4f4f4;
                    padding: 40px 20px;
                ">
                    <div style="
                        max-width: 600px;
                        margin: auto;
                        background: #ffffff;
                        border-radius: 10px;
                        overflow: hidden;
                        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    ">

                        <div style="
                            background: #111827;
                            padding: 20px;
                            text-align: center;
                        ">
                            <h1 style="
                                color: #ffffff;
                                margin: 0;
                                font-size: 24px;
                            ">
                                ${dashboardTitle} Email Verification
                            </h1>
                        </div>

                        <div style="padding: 40px 30px;">

                            <h2 style="
                                margin-top: 0;
                                color: #111827;
                            ">
                                Email Verification
                            </h2>

                            <p style="
                                font-size: 16px;
                                color: #374151;
                                line-height: 1.6;
                            ">
                                ${verificationPayload.userName
                        ? `Hello ${verificationPayload.userName},`
                        : "Hello,"
                    }
                            </p>

                            <p style="
                                font-size: 16px;
                                color: #374151;
                                line-height: 1.6;
                            ">
                                Thank you for signing up. Please use the verification code below to verify your email address.
                            </p>

                            <div style="
                                text-align: center;
                                margin: 35px 0;
                            ">
                                <span style="
                                    display: inline-block;
                                    background: #111827;
                                    color: #ffffff;
                                    padding: 16px 32px;
                                    font-size: 32px;
                                    letter-spacing: 8px;
                                    border-radius: 8px;
                                    font-weight: bold;
                                ">
                                    ${verificationPayload.verificationCode}
                                </span>
                            </div>

                            <p style="
                                font-size: 14px;
                                color: #6b7280;
                                line-height: 1.6;
                            ">
                                This verification code will expire shortly.
                                If you did not create this account,
                                please ignore this email.
                            </p>

                        </div>

                        <div style="
                            background: #f9fafb;
                            padding: 20px;
                            text-align: center;
                            font-size: 13px;
                            color: #6b7280;
                        ">
                            © ${new Date().getFullYear()} ${dashboardTitle}. All rights reserved.
                        </div>

                    </div>
                </div>
                `
            };
        }

        // =========================================================
        // FORGET PASSWORD
        // =========================================================
        case "FORGET_PASSWORD_CODE": {

            const verificationPayload =
                payload as verificationCodePayloadType;

            return {
                subject: "Reset Your Password",

                html: `
                    <div style="
                        font-family: Arial, sans-serif;
                        background-color: #f4f4f4;
                        padding: 40px 20px;
                    ">
                        <div style="
                            max-width: 600px;
                            margin: auto;
                            background: #ffffff;
                            border-radius: 10px;
                            overflow: hidden;
                            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                        ">

                            <!-- HEADER -->
                            <div style="
                                background: #111827;
                                padding: 20px;
                                text-align: center;
                            ">
                                <h1 style="
                                    color: #ffffff;
                                    margin: 0;
                                    font-size: 24px;
                                ">
                                    ${dashboardTitle} Password Reset
                                </h1>
                            </div>

                            <!-- BODY -->
                            <div style="
                                padding: 40px 30px;
                            ">

                                <h2 style="
                                    margin-top: 0;
                                    color: #111827;
                                ">
                                    Reset Your Password
                                </h2>

                                <p style="
                                    font-size: 16px;
                                    color: #374151;
                                    line-height: 1.6;
                                ">
                                    ${verificationPayload.userName
                        ? `Hello ${verificationPayload.userName},`
                        : "Hello,"
                    }
                                </p>

                                <p style="
                                    font-size: 16px;
                                    color: #374151;
                                    line-height: 1.7;
                                ">
                                    We received a request to reset your password.
                                    Use the verification code below to continue.
                                </p>

                                <!-- CODE -->
                                <div style="
                                    text-align: center;
                                    margin: 35px 0;
                                ">
                                    <span style="
                                        display: inline-block;
                                        background: #111827;
                                        color: #ffffff;
                                        padding: 16px 32px;
                                        font-size: 32px;
                                        letter-spacing: 8px;
                                        border-radius: 8px;
                                        font-weight: bold;
                                    ">
                                        ${verificationPayload.verificationCode}
                                    </span>
                                </div>

                                <!-- INFO -->
                                <p style="
                                    font-size: 14px;
                                    color: #6b7280;
                                    line-height: 1.7;
                                ">
                                    This verification code will expire shortly.
                                </p>

                                <div style="
                                    margin-top: 24px;
                                    padding: 16px;
                                    background: #f9fafb;
                                    border-left: 4px solid #111827;
                                    border-radius: 6px;
                                ">
                                    <p style="
                                        margin: 0;
                                        color: #4b5563;
                                        font-size: 14px;
                                        line-height: 1.6;
                                    ">
                                        If you did not request a password reset,
                                        you can safely ignore this email.
                                        Your account will remain secure.
                                    </p>
                                </div>

                            </div>

                            <!-- FOOTER -->
                            <div style="
                                background: #f9fafb;
                                padding: 20px;
                                text-align: center;
                                font-size: 13px;
                                color: #6b7280;
                            ">
                                © ${new Date().getFullYear()} ${dashboardTitle}.
                                All rights reserved.
                            </div>

                        </div>
                    </div>
                    `
            };
        }

        // =========================================================
        // TWO FACTOR AUTH
        // =========================================================
        case "TWO_FACTOR_AUTH_CODE": {
            const verificationPayload =
                payload as verificationCodePayloadType;

            return {
                subject: "Your Two-Factor Authentication Code",

                html: `
                <div style="
                    font-family: Arial, sans-serif;
                    background-color: #f4f4f4;
                    padding: 40px 20px;
                ">
                    <div style="
                        max-width: 600px;
                        margin: auto;
                        background: #ffffff;
                        border-radius: 10px;
                        overflow: hidden;
                        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    ">

                        <div style="
                            background: #111827;
                            padding: 20px;
                            text-align: center;
                        ">
                            <h1 style="
                                color: white;
                                margin: 0;
                                font-size: 24px;
                            ">
                                ${dashboardTitle} Security Verification
                            </h1>
                        </div>

                        <div style="padding: 40px 30px;">

                            <h2 style="
                                margin-top: 0;
                                color: #111827;
                            ">
                                Two-Factor Authentication
                            </h2>

                            <p style="
                                font-size: 16px;
                                color: #374151;
                                line-height: 1.6;
                            ">
                                ${verificationPayload.userName
                        ? `Hello ${verificationPayload.userName},`
                        : "Hello,"
                    }
                            </p>

                            <p style="
                                font-size: 16px;
                                color: #374151;
                                line-height: 1.6;
                            ">
                                Use the authentication code below to complete sign in.
                            </p>

                            <div style="
                                text-align:center;
                                margin:35px 0;
                            ">
                                <span style="
                                    display:inline-block;
                                    background:#111827;
                                    color:white;
                                    padding:16px 32px;
                                    font-size:32px;
                                    letter-spacing:8px;
                                    border-radius:8px;
                                    font-weight:bold;
                                ">
                                    ${verificationPayload.verificationCode}
                                </span>
                            </div>

                            <p style="
                                font-size:14px;
                                color:#6b7280;
                                line-height:1.6;
                            ">
                                Never share this code with anyone.
                                This code expires shortly.
                            </p>

                        </div>

                        <div style="
                            background:#f9fafb;
                            padding:20px;
                            text-align:center;
                            font-size:13px;
                            color:#6b7280;
                        ">
                            © ${new Date().getFullYear()} ${dashboardTitle}. All rights reserved.
                        </div>

                    </div>
                </div>
                `
            };
        }


        // =========================================================
        // KYC VERIFICATION
        // =========================================================
        case "KYC_VERIFICATION": {

            const kycPayload =
                payload as kycVerificationCodePayloadType;

            return {
                subject: "KYC Verification Request",

                html: `
                <div style="
                    font-family: Arial, sans-serif;
                    background-color: #f4f4f4;
                    padding: 40px 20px;
                ">
                    <div style="
                        max-width: 700px;
                        margin: auto;
                        background: #ffffff;
                        border-radius: 10px;
                        overflow: hidden;
                        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    ">

                        <div style="
                            background: #111827;
                            padding: 20px;
                            text-align: center;
                        ">
                            <h1 style="
                                color: #ffffff;
                                margin: 0;
                                font-size: 24px;
                            ">
                                ${dashboardTitle} KYC Verification
                            </h1>
                        </div>

                        <div style="padding: 40px 30px;">

                            <h2 style="
                                margin-top: 0;
                                color: #111827;
                            ">
                                KYC Verification Required
                            </h2>

                            <p>
                                Hello ${kycPayload.userName},
                            </p>

                            <p>
                                The Proof of Identity (POI) and
                                Proof of Address (POA) documents
                                have been submitted for verification.
                            </p>

                            <p>
                                <strong>User ID:</strong>
                                ${kycPayload.userId}
                            </p>

                            <p>
                                <strong>POI Document:</strong>
                                <a 
                                    href="${kycPayload.poiDocumentUrl}"
                                    target="_blank"
                                >
                                    View POI Document
                                </a>
                            </p>

                            <p>
                                <strong>POA Document:</strong>
                                <a 
                                    href="${kycPayload.poaDocumentUrl}"
                                    target="_blank"
                                >
                                    View POA Document
                                </a>
                            </p>

                            <p>
                                Please verify the KYC documents
                                within 2 days.
                            </p>

                            <!-- ACTION BUTTONS -->
                            <div style="
                                margin-top: 35px;
                                text-align: center;
                            ">

                                <a
                                    href="${kycPayload.approveUrl}"
                                    target="_blank"
                                    style="
                                        display: inline-block;
                                        padding: 14px 28px;
                                        margin-right: 10px;
                                        background-color: #16a34a;
                                        color: #ffffff;
                                        text-decoration: none;
                                        border-radius: 6px;
                                        font-weight: bold;
                                    "
                                >
                                    Approve KYC
                                </a>

                                <a
                                    href="${kycPayload.rejectUrl}"
                                    target="_blank"
                                    style="
                                        display: inline-block;
                                        padding: 14px 28px;
                                        background-color: #dc2626;
                                        color: #ffffff;
                                        text-decoration: none;
                                        border-radius: 6px;
                                        font-weight: bold;
                                    "
                                >
                                    Reject KYC
                                </a>

                            </div>

                        </div>

                        <div style="
                            background: #f9fafb;
                            padding: 20px;
                            text-align: center;
                            font-size: 13px;
                            color: #6b7280;
                        ">
                            © ${new Date().getFullYear()} ${dashboardTitle}. All rights reserved.
                        </div>

                    </div>
                </div>
                `
            };
        }


        // =========================================================
        // KYC REJECTED
        // =========================================================
        case "KYC_REJECTED": {

            const rejectedPayload =
                payload as kycVerificationRejectedPayloadType;

            return {
                subject: "KYC Verification Rejected",

                html: `
                <div>
                    <h2>KYC Verification Rejected</h2>

                    <p>
                        ${rejectedPayload.userName
                        ? `Hello ${rejectedPayload.userName},`
                        : "Hello,"}
                    </p>

                    <p>
                        Your KYC verification request has been rejected.
                    </p>

                    <p>
                        Unfortunately, the submitted documents could not be verified.
                    </p>

                    <p>
                        Please review your documents carefully and re-upload valid Proof of Identity (POI) and Proof of Address (POA) documents to continue the verification process.
                    </p>

                    <p>
                        Ensure that:
                    </p>

                    <ul>
                        <li>The documents are clear and readable.</li>
                        <li>The information matches your registered account details.</li>
                        <li>The documents are valid and not expired.</li>
                    </ul>

                    <p>
                        If you have any questions or need assistance, please contact our support team.
                    </p>

                    <br />

                    <p>
                        Thank you for choosing ${dashboardTitle}.
                    </p>

                    <p>
                        Regards,<br />
                        ${dashboardTitle} Team
                    </p>
                </div>
                `
            };
        }

        // =========================================================
        // KYC ACCEPTED
        // =========================================================
        case "KYC_ACCEPTED": {

            const acceptedPayload =
                payload as kycVerificationAcceptedPayloadType;

            return {
                subject: "KYC Verification Accepted",

                html: `
                <div>
                    <h2>KYC Verification Accepted</h2>

                    <p>
                        ${acceptedPayload.userName
                        ? `Hello ${acceptedPayload.userName},`
                        : "Hello,"
                    }
                    </p>

                    <p>
                        Your KYC verification request has been successfully approved.
                    </p>

                    <p>
                        Your account is now fully verified and you can access all platform features and services.
                    </p>

                    <p>
                        Please sign in to your account to continue.
                    </p>

                    <p>
                        If you have any questions or need assistance, please contact our support team.
                    </p>

                    <br />

                    <p>
                        Thank you for choosing ${dashboardTitle}.
                    </p>

                    <p>
                        Regards,<br />
                        ${dashboardTitle} Team
                    </p>
                </div>
                `
            };

        }


        // =========================================================
        // KYC ACCEPTED ADMIN
        // =========================================================
        case "KYC_ACCEPTED_ADMIN": {

            const acceptedPayload =
                payload as kycVerificationAcceptedAdminPayloadType;

            return {
                subject: "User KYC Verification Approved",

                html: `
                <div style="
                    font-family: Arial, sans-serif;
                    background-color: #f4f4f4;
                    padding: 40px 20px;
                ">
                    <div style="
                        max-width: 650px;
                        margin: auto;
                        background: #ffffff;
                        border-radius: 10px;
                        overflow: hidden;
                        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    ">

                        <div style="
                            background: #111827;
                            padding: 20px;
                            text-align: center;
                        ">
                            <h1 style="
                                color: #ffffff;
                                margin: 0;
                                font-size: 24px;
                            ">
                                ${dashboardTitle} Admin Notification
                            </h1>
                        </div>

                        <div style="padding: 35px 30px;">

                            <h2 style="
                                margin-top: 0;
                                color: #111827;
                            ">
                                KYC Verification Approved
                            </h2>

                            <p>
                                ${acceptedPayload.userName
                        ? `Hello ${acceptedPayload.userName},`
                        : "Hello Admin,"
                    }
                            </p>

                            <p>
                                The KYC verification request for the following user
                                has been successfully approved.
                            </p>

                            <p>
                                <strong>User ID:</strong>
                                ${acceptedPayload.userId}
                            </p>

                            <p>
                                <strong>Dashboard Name:</strong>
                                ${acceptedPayload.dashboardName}
                            </p>

                            <p>
                                The user account is now verified and has access
                                to all permitted platform services and features.
                            </p>

                            <br />

                            <p>
                                Regards,<br />
                                ${dashboardTitle} System
                            </p>

                        </div>

                        <div style="
                            background: #f9fafb;
                            padding: 18px;
                            text-align: center;
                            font-size: 13px;
                            color: #6b7280;
                        ">
                            © ${new Date().getFullYear()} ${dashboardTitle}. All rights reserved.
                        </div>

                    </div>
                </div>
                `
            };
        }


        // =========================================================
        // BANK VERIFICATION
        // =========================================================
        case "USER_BANK_VERIFICATION": {

            const bankPayload =
                payload as userBankVerificationCodePayloadType;

            return {
                subject: "Bank Account Verification Request",

                html: `
                <div style="
                    font-family: Arial, sans-serif;
                    background-color: #f4f4f4;
                    padding: 40px 20px;
                ">
                    <div style="
                        max-width: 700px;
                        margin: auto;
                        background: #ffffff;
                        border-radius: 10px;
                        overflow: hidden;
                        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    ">

                        <div style="
                            background: #111827;
                            padding: 20px;
                            text-align: center;
                        ">
                            <h1 style="
                                color: #ffffff;
                                margin: 0;
                                font-size: 24px;
                            ">
                                ${dashboardTitle} Bank Verification
                            </h1>
                        </div>

                        <div style="padding: 40px 30px;">

                            <h2 style="
                                margin-top: 0;
                                color: #111827;
                            ">
                                Bank Account Verification Required
                            </h2>

                            <p>
                                Hello ${bankPayload.userName},
                            </p>

                            <p>
                                A bank account has been submitted
                                for verification.
                            </p>

                            <p>
                                <strong>User ID:</strong>
                                ${bankPayload.userId}
                            </p>

                            <p>
                                <strong>Account Holder Name:</strong>
                                ${bankPayload.accountHolderName}
                            </p>

                            <p>
                                <strong>Account Number:</strong>
                                ${bankPayload.accountNumber}
                            </p>

                            <p>
                                <strong>Bank Name:</strong>
                                ${bankPayload.bankName}
                            </p>

                            <p>
                                Please verify the bank account
                                details within 2 days.
                            </p>

                            <!-- ACTION BUTTONS -->
                            <div style="
                                margin-top: 35px;
                                text-align: center;
                            ">

                                <a
                                    href="${bankPayload.approveUrl}"
                                    target="_blank"
                                    style="
                                        display: inline-block;
                                        padding: 14px 28px;
                                        margin-right: 10px;
                                        background-color: #16a34a;
                                        color: #ffffff;
                                        text-decoration: none;
                                        border-radius: 6px;
                                        font-weight: bold;
                                    "
                                >
                                    Approve Bank
                                </a>

                                <a
                                    href="${bankPayload.rejectUrl}"
                                    target="_blank"
                                    style="
                                        display: inline-block;
                                        padding: 14px 28px;
                                        background-color: #dc2626;
                                        color: #ffffff;
                                        text-decoration: none;
                                        border-radius: 6px;
                                        font-weight: bold;
                                    "
                                >
                                    Reject Bank
                                </a>

                            </div>

                        </div>

                        <div style="
                            background: #f9fafb;
                            padding: 20px;
                            text-align: center;
                            font-size: 13px;
                            color: #6b7280;
                        ">
                            © ${new Date().getFullYear()} ${dashboardTitle}. All rights reserved.
                        </div>

                    </div>
                </div>
                `
            };
        }

        // =========================================================
        // USER BANK ACCOUNT REJECTED
        // =========================================================
        case "BANK_VERIFICATION_REJECTED": {

            const rejectedPayload =
                payload as userBankAccountVerificationRejectedPayloadType;

            return {
                subject: "Bank Account Verification Rejected",

                html: `
                <div>
                    <h2>Bank Account Verification Rejected</h2>

                    <p>
                        ${rejectedPayload.userName
                        ? `Hello ${rejectedPayload.userName},`
                        : "Hello,"}
                    </p>

                    <p>
                        Your bank account verification request has been rejected.
                    </p>

                    <p>
                        Unfortunately, the submitted bank account details could not be verified.
                    </p>

                    <p>
                        Please review your bank account details you have provided.
                    </p>

                    <p>
                        Ensure that the given bank account is active and registerd under your name.
                    </p>

                    <p>
                        If you have any questions or need assistance, please contact our support team.
                    </p>

                    <br />

                    <p>
                        Thank you for choosing ${dashboardTitle}.
                    </p>

                    <p>
                        Regards,<br />
                        ${dashboardTitle} Team
                    </p>
                </div>
                `
            };
        }

        // =========================================================
        // KYC ACCEPTED
        // =========================================================
        case "BANK_VERIFICATION_ACCEPTED": {

            const acceptedPayload =
                payload as userBankAccountVerificationAcceptedPayloadType;

            return {
                subject: "Bank Account Verification Accepted",

                html: `
                <div>
                    <h2>Bank Account Verification Accepted</h2>

                    <p>
                        ${acceptedPayload.userName
                        ? `Hello ${acceptedPayload.userName},`
                        : "Hello,"
                    }
                    </p>

                    <p>
                        Your bank account verification request has been successfully approved.
                    </p>

                    <p>
                        Your bank account is now fully verified and you can access all platform features and services.
                    </p>

                    <p>
                        Please sign in to your account to continue.
                    </p>

                    <p>
                        If you have any questions or need assistance, please contact our support team.
                    </p>

                    <br />

                    <p>
                        Thank you for choosing ${dashboardTitle}.
                    </p>

                    <p>
                        Regards,<br />
                        ${dashboardTitle} Team
                    </p>
                </div>
                `
            };

        }


        // =========================================================
        // USER BANK ACCOUNT ACCEPTED ADMIN
        // =========================================================
        case "BANK_VERIFICATION_ACCEPTED_ADMIN": {

            const acceptedPayload =
                payload as userBankAccountVerificationAcceptedAdminPayloadType;

            return {
                subject: "User Bank Account Verification Approved",

                html: `
                <div style="
                    font-family: Arial, sans-serif;
                    background-color: #f4f4f4;
                    padding: 40px 20px;
                ">
                    <div style="
                        max-width: 650px;
                        margin: auto;
                        background: #ffffff;
                        border-radius: 10px;
                        overflow: hidden;
                        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    ">

                        <div style="
                            background: #111827;
                            padding: 20px;
                            text-align: center;
                        ">
                            <h1 style="
                                color: #ffffff;
                                margin: 0;
                                font-size: 24px;
                            ">
                                ${dashboardTitle} Admin Notification
                            </h1>
                        </div>

                        <div style="padding: 35px 30px;">

                            <h2 style="
                                margin-top: 0;
                                color: #111827;
                            ">
                                User Bank Account Verification Approved
                            </h2>

                            <p>
                                ${acceptedPayload.userName
                        ? `Hello ${acceptedPayload.userName},`
                        : "Hello Admin,"
                    }
                            </p>

                            <p>
                                The bank account verification request for the following user
                                has been successfully approved.
                            </p>

                            <p>
                                <strong>User ID:</strong>
                                ${acceptedPayload.userId}
                            </p>

                            <p>
                                <strong>Dashboard Name:</strong>
                                ${acceptedPayload.dashboardName}
                            </p>

                            <p>
                                The user bank account is now verified and has access
                                to all permitted platform services and features.
                            </p>

                            <br />

                            <p>
                                Regards,<br />
                                ${dashboardTitle} System
                            </p>

                        </div>

                        <div style="
                            background: #f9fafb;
                            padding: 18px;
                            text-align: center;
                            font-size: 13px;
                            color: #6b7280;
                        ">
                            © ${new Date().getFullYear()} ${dashboardTitle}. All rights reserved.
                        </div>

                    </div>
                </div>
                `
            };
        }



        // =========================================================
        // CARD TRANSACTION AUTHORIZATION
        // =========================================================
        case "CARD_TRANSACTION_AUTHORIZATION": {

            const transactionPayload =
                payload as cardTransactionAuthorizationPayload;

            return {
                subject: "Card Transaction Authorization Required",

                html: `
                    <div style="
                        font-family: Arial, Helvetica, sans-serif;
                        background-color:#f4f4f4;
                        padding:40px 20px;
                    ">

                        <div style="
                            max-width:700px;
                            margin:auto;
                            background:#ffffff;
                            border-radius:10px;
                            overflow:hidden;
                            box-shadow:0 2px 10px rgba(0,0,0,0.1);
                        ">

                            <!-- HEADER -->
                            <div style="
                                background:#111827;
                                padding:22px;
                                text-align:center;
                            ">
                                <h1 style="
                                    margin:0;
                                    color:#ffffff;
                                    font-size:24px;
                                ">
                                    ${dashboardTitle} Transaction Authorization
                                </h1>
                            </div>

                            <!-- BODY -->
                            <div style="padding:40px 32px;">

                                <h2 style="
                                    margin-top:0;
                                    color:#111827;
                                ">
                                    Authorization Required
                                </h2>

                                <p style="
                                    color:#374151;
                                    font-size:16px;
                                    line-height:1.7;
                                ">
                                    Hello <strong>${transactionPayload.userName}</strong>,
                                </p>

                                <p style="
                                    color:#374151;
                                    font-size:16px;
                                    line-height:1.7;
                                ">
                                    A card transaction has been initiated using your card.
                                    Before the payment can be processed, you must authorize
                                    this transaction.
                                </p>

                                <!-- STATUS BOX -->
                                <div style="
                                    margin:30px 0;
                                    padding:18px;
                                    border-radius:8px;
                                    background:#FEF3C7;
                                    border-left:5px solid #F59E0B;
                                ">

                                    <div style="
                                        font-size:18px;
                                        font-weight:bold;
                                        color:#92400E;
                                        margin-bottom:10px;
                                    ">
                                        ⏳ Pending Authorization
                                    </div>

                                    <p style="
                                        margin:0;
                                        color:#78350F;
                                        line-height:1.6;
                                    ">
                                        This transaction is currently on hold and is waiting
                                        for your approval or rejection.
                                    </p>

                                </div>

                                <!-- TRANSACTION DETAILS -->
                                <table
                                    cellpadding="10"
                                    cellspacing="0"
                                    width="100%"
                                    style="
                                        border-collapse:collapse;
                                        margin-top:20px;
                                        border:1px solid #E5E7EB;
                                    "
                                >

                                    <tr style="background:#F9FAFB;">
                                        <td><strong>Merchant</strong></td>
                                        <td>${transactionPayload.merchantName}</td>
                                    </tr>

                                    <tr>
                                        <td><strong>Transaction Amount</strong></td>
                                        <td>
                                            <span style="
                                                font-size:18px;
                                                font-weight:bold;
                                                color:#16A34A;
                                            ">
                                                ${transactionPayload.transactionCurrency}
                                                ${transactionPayload.transactionAmount}
                                            </span>
                                        </td>
                                    </tr>

                                    <tr style="background:#F9FAFB;">
                                        <td><strong>Card Number</strong></td>
                                        <td>${transactionPayload.maskedCardNumber}</td>
                                    </tr>

                                    <tr>
                                        <td><strong>Transaction ID</strong></td>
                                        <td>${transactionPayload.transactionId}</td>
                                    </tr>

                                    <tr style="background:#F9FAFB;">
                                        <td><strong>User ID</strong></td>
                                        <td>${transactionPayload.userId}</td>
                                    </tr>

                                    <tr>
                                        <td><strong>Cardholder Email</strong></td>
                                        <td>${transactionPayload.cardholderEmail}</td>
                                    </tr>

                                </table>

                                <!-- EXPIRY BOX -->
                                <div style="
                                    margin-top:28px;
                                    padding:18px;
                                    background:#EFF6FF;
                                    border-left:5px solid #2563EB;
                                    border-radius:8px;
                                ">

                                    <p style="
                                        margin:0;
                                        font-size:16px;
                                        color:#1E3A8A;
                                        font-weight:bold;
                                    ">
                                        ⏱ Authorization Validity
                                    </p>

                                    <p style="
                                        margin-top:12px;
                                        margin-bottom:0;
                                        color:#374151;
                                        line-height:1.8;
                                    ">
                                        This authorization request is valid for
                                        <strong>2 minutes</strong>.
                                    </p>

                                    <p style="
                                        margin-top:8px;
                                        margin-bottom:0;
                                        color:#374151;
                                    ">
                                        <strong>Expires At:</strong>
                                        ${transactionPayload.authorizationExpiresAt}
                                    </p>

                                    <p style="
                                        margin-top:12px;
                                        margin-bottom:0;
                                        color:#6B7280;
                                        font-size:14px;
                                    ">
                                        If no action is taken before the expiry time,
                                        this authorization request will automatically
                                        expire and the transaction will be declined.
                                    </p>

                                </div>

                                <!-- BUTTONS -->
                                <div style="
                                    margin-top:40px;
                                    text-align:center;
                                ">

                                    <a
                                        href="${transactionPayload.approveUrl}"
                                        target="_blank"
                                        style="
                                            display:inline-block;
                                            background:#16A34A;
                                            color:#ffffff;
                                            text-decoration:none;
                                            padding:14px 30px;
                                            border-radius:6px;
                                            font-weight:bold;
                                            margin-right:12px;
                                        "
                                    >
                                        Approve Transaction
                                    </a>

                                    <a
                                        href="${transactionPayload.rejectUrl}"
                                        target="_blank"
                                        style="
                                            display:inline-block;
                                            background:#DC2626;
                                            color:#ffffff;
                                            text-decoration:none;
                                            padding:14px 30px;
                                            border-radius:6px;
                                            font-weight:bold;
                                        "
                                    >
                                        Reject Transaction
                                    </a>

                                </div>

                                <div style="
                                    margin-top:30px;
                                    padding:16px;
                                    background:#FEF3C7;
                                    border-left:4px solid #F59E0B;
                                    border-radius:6px;
                                ">
                                    <p style="
                                        margin:0;
                                        color:#92400E;
                                        font-size:14px;
                                        line-height:1.6;
                                    ">
                                        <strong>Important:</strong>
                                        If the buttons above do not work, simply ignore this email.
                                        The authorization request will automatically expire after
                                        <strong>2 minutes</strong>.
                                    </p>
                                </div>

                                <!-- SECURITY NOTICE -->
                                <div style="
                                    margin-top:40px;
                                    padding:18px;
                                    background:#F9FAFB;
                                    border-left:4px solid #111827;
                                    border-radius:8px;
                                ">

                                    <p style="
                                        margin-top:0;
                                        font-weight:bold;
                                        color:#111827;
                                    ">
                                        Security Notice
                                    </p>

                                    <ul style="
                                        color:#4B5563;
                                        line-height:1.8;
                                        padding-left:20px;
                                        margin-bottom:0;
                                    ">
                                        <li>Approve this transaction only if you recognize it.</li>
                                        <li>If you did not initiate this payment, click <strong>Reject Transaction</strong> immediately.</li>
                                        <li>Never share these authorization links with anyone.</li>
                                        <li>Once approved, the transaction will be processed immediately.</li>
                                    </ul>

                                </div>

                            </div>

                            <!-- FOOTER -->
                            <div style="
                                background:#F9FAFB;
                                padding:20px;
                                text-align:center;
                                font-size:13px;
                                color:#6B7280;
                            ">
                                © ${new Date().getFullYear()} ${dashboardTitle}. All rights reserved.
                            </div>

                        </div>

                    </div>
                    `
            };
        }



        default:
            throw new Error("Invalid email template type");
    }
};

export default generateEmailTemplate;