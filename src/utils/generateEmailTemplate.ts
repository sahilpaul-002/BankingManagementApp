// // src/services/emailTemplate.ts

// type emailTemplateType =
//     | "EMAIL_VERIFICATION_CODE"
//     | "FORGET_PASSWORD_CODE"
//     | "TWO_FACTOR_AUTH_CODE"
//     | "KYC_VERIFICATION"
//     | "KYC_REJECTED"

// interface verificationCodePayloadType {
//     verificationCode: string
//     userName?: string
//     dashboardName?: string
// }

// interface kycVerificationCodePayloadType {
//     userId: string
//     userName: string
//     poiDocumentUrl: string
//     poaDocumentUrl: string
//     dashboardName?: string
//     approveUrl: string
//     rejectUrl: string
// }

// interface kycVerificationRejectedPayloadType {
//     userName?: string
//     dashboardName?: string
// }

// interface templateResponseType {
//     subject: string
//     html: string
// }

// const generateEmailTemplate = (
//     templateType: emailTemplateType,
//     payload: verificationCodePayloadType | kycVerificationCodePayloadType |kycVerificationRejectedPayloadType
// ): templateResponseType => {
//     const dashboardTitle = payload?.dashboardName || "BMA"

//     if (templateType !== "KYC_VERIFICATION" && "verificationCode" in payload) {
//         switch (templateType) {
//             case "EMAIL_VERIFICATION_CODE":
//                 return {
//                     subject: "Verify Your Email Address",

//                     html: `
//                     <div style="
//                         font-family: Arial, sans-serif;
//                         background-color: #f4f4f4;
//                         padding: 40px 20px;
//                     ">
//                         <div style="
//                             max-width: 600px;
//                             margin: auto;
//                             background: #ffffff;
//                             border-radius: 10px;
//                             overflow: hidden;
//                             box-shadow: 0 2px 10px rgba(0,0,0,0.1);
//                         ">

//                             <!-- Header -->
//                             <div style="
//                                 background: #111827;
//                                 padding: 20px;
//                                 text-align: center;
//                             ">
//                                 <h1 style="
//                                     color: #ffffff;
//                                     margin: 0;
//                                     font-size: 24px;
//                                 ">
//                                     ${dashboardTitle} Email Verification
//                                 </h1>
//                             </div>

//                             <!-- Body -->
//                             <div style="padding: 40px 30px;">

//                                 <h2 style="
//                                     margin-top: 0;
//                                     color: #111827;
//                                 ">
//                                     Email Verification
//                                 </h2>

//                                 <p style="
//                                     font-size: 16px;
//                                     color: #374151;
//                                     line-height: 1.6;
//                                 ">
//                                     ${payload?.userName
//                             ? `Hello ${payload.userName},`
//                             : "Hello,"
//                         }
//                                 </p>

//                                 <p style="
//                                     font-size: 16px;
//                                     color: #374151;
//                                     line-height: 1.6;
//                                 ">
//                                     Thank you for signing up. Please use the verification code below to verify your email address.
//                                 </p>

//                                 <!-- Verification Code -->
//                                 <div style="
//                                     text-align: center;
//                                     margin: 35px 0;
//                                 ">
//                                     <span style="
//                                         display: inline-block;
//                                         background: #111827;
//                                         color: #ffffff;
//                                         padding: 16px 32px;
//                                         font-size: 32px;
//                                         letter-spacing: 8px;
//                                         border-radius: 8px;
//                                         font-weight: bold;
//                                     ">
//                                         ${payload.verificationCode}
//                                     </span>
//                                 </div>

//                                 <p style="
//                                     font-size: 14px;
//                                     color: #6b7280;
//                                     line-height: 1.6;
//                                 ">
//                                     This verification code will expire shortly. 
//                                     If you did not create this account, please ignore this email.
//                                 </p>

//                             </div>

//                             <!-- Footer -->
//                             <div style="
//                                 background: #f9fafb;
//                                 padding: 20px;
//                                 text-align: center;
//                                 font-size: 13px;
//                                 color: #6b7280;
//                             ">
//                                 © ${new Date().getFullYear()} ${dashboardTitle}. All rights reserved.
//                             </div>

//                         </div>
//                     </div>
//                 `
//                 }

//             case "FORGET_PASSWORD_CODE":

//                 return {
//                     subject: "Reset Your Password",

//                     html: `
//             <div style="
//                 font-family: Arial, sans-serif;
//                 background-color: #f4f4f4;
//                 padding: 40px 20px;
//             ">
//                 <div style="
//                     max-width: 600px;
//                     margin: auto;
//                     background: #ffffff;
//                     border-radius: 10px;
//                     overflow: hidden;
//                     box-shadow: 0 2px 10px rgba(0,0,0,0.1);
//                 ">

//                     <!-- Header -->
//                     <div style="
//                         background: #111827;
//                         padding: 20px;
//                         text-align: center;
//                     ">
//                         <h1 style="
//                             color: #ffffff;
//                             margin: 0;
//                             font-size: 24px;
//                         ">
//                             ${dashboardTitle} Password Reset
//                         </h1>
//                     </div>

//                     <!-- Body -->
//                     <div style="padding: 40px 30px;">

//                         <h2 style="
//                             margin-top: 0;
//                             color: #111827;
//                         ">
//                             Password Reset Request
//                         </h2>

//                         <p style="
//                             font-size: 16px;
//                             color: #374151;
//                             line-height: 1.6;
//                         ">
//                             ${payload?.userName
//                             ? `Hello ${payload.userName},`
//                             : "Hello,"
//                         }
//                         </p>

//                         <p style="
//                             font-size: 16px;
//                             color: #374151;
//                             line-height: 1.6;
//                         ">
//                             We received a request to reset your password.
//                             Use the verification code below to continue.
//                         </p>

//                         <!-- Reset Code -->
//                         <div style="
//                             text-align: center;
//                             margin: 35px 0;
//                         ">
//                             <span style="
//                                 display: inline-block;
//                                 background: #111827;
//                                 color: #ffffff;
//                                 padding: 16px 32px;
//                                 font-size: 32px;
//                                 letter-spacing: 8px;
//                                 border-radius: 8px;
//                                 font-weight: bold;
//                             ">
//                                 ${payload.verificationCode}
//                             </span>
//                         </div>

//                         <p style="
//                             font-size: 14px;
//                             color: #6b7280;
//                             line-height: 1.6;
//                         ">
//                             This code will expire shortly.
//                             If you did not request a password reset,
//                             please ignore this email.
//                         </p>

//                     </div>

//                     <!-- Footer -->
//                     <div style="
//                         background: #f9fafb;
//                         padding: 20px;
//                         text-align: center;
//                         font-size: 13px;
//                         color: #6b7280;
//                     ">
//                         © ${new Date().getFullYear()} ${dashboardTitle}. All rights reserved.
//                     </div>

//                 </div>
//             </div>
//         `
//                 }

//             case "TWO_FACTOR_AUTH_CODE":

//                 return {
//                     subject: "Your Two-Factor Authentication Code",

//                     html: `
//             <div style="
//                 font-family: Arial, sans-serif;
//                 background-color: #f4f4f4;
//                 padding: 40px 20px;
//             ">
//                 <div style="
//                     max-width: 600px;
//                     margin: auto;
//                     background: #ffffff;
//                     border-radius: 10px;
//                     overflow: hidden;
//                     box-shadow: 0 2px 10px rgba(0,0,0,0.1);
//                 ">

//                     <!-- Header -->
//                     <div style="
//                         background: #111827;
//                         padding: 20px;
//                         text-align: center;
//                     ">
//                         <h1 style="
//                             color: #ffffff;
//                             margin: 0;
//                             font-size: 24px;
//                         ">
//                             ${dashboardTitle} Two-Factor Authentication
//                         </h1>
//                     </div>

//                     <!-- Body -->
//                     <div style="padding: 40px 30px;">

//                         <h2 style="
//                             margin-top: 0;
//                             color: #111827;
//                         ">
//                             Security Verification
//                         </h2>

//                         <p style="
//                             font-size: 16px;
//                             color: #374151;
//                             line-height: 1.6;
//                         ">
//                             ${payload?.userName
//                             ? `Hello ${payload.userName},`
//                             : "Hello,"
//                         }
//                         </p>

//                         <p style="
//                             font-size: 16px;
//                             color: #374151;
//                             line-height: 1.6;
//                         ">
//                             We detected a login attempt that requires
//                             two-factor authentication verification.
//                             Use the code below to continue securely.
//                         </p>

//                         <!-- 2FA Code -->
//                         <div style="
//                             text-align: center;
//                             margin: 35px 0;
//                         ">
//                             <span style="
//                                 display: inline-block;
//                                 background: #111827;
//                                 color: #ffffff;
//                                 padding: 16px 32px;
//                                 font-size: 32px;
//                                 letter-spacing: 8px;
//                                 border-radius: 8px;
//                                 font-weight: bold;
//                             ">
//                                 ${payload.verificationCode}
//                             </span>
//                         </div>

//                         <p style="
//                             font-size: 14px;
//                             color: #6b7280;
//                             line-height: 1.6;
//                         ">
//                             This authentication code will expire shortly.
//                             Never share this code with anyone.
//                         </p>

//                         <p style="
//                             font-size: 14px;
//                             color: #ef4444;
//                             line-height: 1.6;
//                             font-weight: bold;
//                         ">
//                             If you did not attempt to sign in,
//                             please secure your account immediately.
//                         </p>

//                     </div>

//                     <!-- Footer -->
//                     <div style="
//                         background: #f9fafb;
//                         padding: 20px;
//                         text-align: center;
//                         font-size: 13px;
//                         color: #6b7280;
//                     ">
//                         © ${new Date().getFullYear()} ${dashboardTitle}. All rights reserved.
//                     </div>

//                 </div>
//             </div>
//         `
//                 }

//             default:
//                 throw new Error("Invalid email template type")
//         }
//     }
//     else {
//         const kycPayload = payload as kycVerificationCodePayloadType

//         return {
//             subject: "KYC Verification Request",

//             html: `
//             <div style="
//                 font-family: Arial, sans-serif;
//                 background-color: #f4f4f4;
//                 padding: 40px 20px;
//             ">
//                 <div style="
//                     max-width: 700px;
//                     margin: auto;
//                     background: #ffffff;
//                     border-radius: 10px;
//                     overflow: hidden;
//                     box-shadow: 0 2px 10px rgba(0,0,0,0.1);
//                 ">

//                     <!-- Header -->
//                     <div style="
//                         background: #111827;
//                         padding: 20px;
//                         text-align: center;
//                     ">
//                         <h1 style="
//                             color: #ffffff;
//                             margin: 0;
//                             font-size: 24px;
//                         ">
//                             ${dashboardTitle} KYC Verification
//                         </h1>
//                     </div>

//                     <!-- Body -->
//                     <div style="padding: 40px 30px;">

//                         <h2 style="
//                             margin-top: 0;
//                             color: #111827;
//                         ">
//                             KYC Verification Required
//                         </h2>

//                         <p style="
//                             font-size: 16px;
//                             color: #374151;
//                             line-height: 1.6;
//                         ">
//                             ${kycPayload.userName
//                     ? `Hello ${kycPayload.userName},`
//                     : "Hello,"
//                 }
//                         </p>

//                         <p style="
//                             font-size: 16px;
//                             color: #374151;
//                             line-height: 1.8;
//                         ">
//                             The Proof of Identity (POI) and Proof of Address (POA)
//                             documents have been submitted for the following user:
//                         </p>

//                         <!-- User Info -->
//                         <div style="
//                             background: #f9fafb;
//                             border: 1px solid #e5e7eb;
//                             border-radius: 8px;
//                             padding: 20px;
//                             margin: 20px 0;
//                         ">
//                             <p style="
//                                 margin: 0;
//                                 font-size: 16px;
//                                 color: #111827;
//                             ">
//                                 <strong>User ID:</strong> ${kycPayload.userId}
//                             </p>
//                         </div>

//                         <!-- Document Links -->
//                         <div style="
//                             margin: 30px 0;
//                         ">
//                             <h3 style="
//                                 color: #111827;
//                                 margin-bottom: 15px;
//                             ">
//                                 Submitted Documents
//                             </h3>

//                             <p style="
//                                 font-size: 15px;
//                                 color: #374151;
//                                 margin-bottom: 10px;
//                             ">
//                                 <strong>POI Document:</strong>
//                             </p>

//                             <a
//                                 href="${kycPayload.poiDocumentUrl}"
//                                 target="_blank"
//                                 style="
//                                     display: inline-block;
//                                     margin-bottom: 20px;
//                                     color: #2563eb;
//                                     text-decoration: none;
//                                     word-break: break-all;
//                                 "
//                             >
//                                 View POI Document
//                             </a>

//                             <p style="
//                                 font-size: 15px;
//                                 color: #374151;
//                                 margin-bottom: 10px;
//                             ">
//                                 <strong>POA Document:</strong>
//                             </p>

//                             <a
//                                 href="${kycPayload.poaDocumentUrl}"
//                                 target="_blank"
//                                 style="
//                                     display: inline-block;
//                                     color: #2563eb;
//                                     text-decoration: none;
//                                     word-break: break-all;
//                                 "
//                             >
//                                 View POA Document
//                             </a>
//                         </div>

//                         <p style="
//                             font-size: 15px;
//                             color: #374151;
//                             line-height: 1.8;
//                         ">
//                             Please verify the KYC documents for the above user
//                             within <strong>2 days</strong>.
//                         </p>

//                         <p style="
//                             font-size: 14px;
//                             color: #ef4444;
//                             font-weight: bold;
//                             line-height: 1.6;
//                         ">
//                             Timely verification is required to avoid delays
//                             in account processing.
//                         </p>

//                     </div>

//                     <!-- Footer -->
//                     <div style="
//                         background: #f9fafb;
//                         padding: 20px;
//                         text-align: center;
//                         font-size: 13px;
//                         color: #6b7280;
//                     ">
//                         © ${new Date().getFullYear()} ${dashboardTitle}. All rights reserved.
//                     </div>

//                 </div>
//             </div>
//         `
//         }
//     }
// }

// export default generateEmailTemplate;

// src/services/emailTemplate.ts

type emailTemplateType =
    | "EMAIL_VERIFICATION_CODE"
    | "FORGET_PASSWORD_CODE"
    | "TWO_FACTOR_AUTH_CODE"
    | "KYC_VERIFICATION"
    | "KYC_REJECTED";

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

interface templateResponseType {
    subject: string;
    html: string;
}

type emailTemplatePayloadType =
    | verificationCodePayloadType
    | kycVerificationCodePayloadType
    | kycVerificationRejectedPayloadType;

const generateEmailTemplate = (
    templateType: emailTemplateType,
    payload: emailTemplatePayloadType
): templateResponseType => {

    const dashboardTitle = payload.dashboardName || "BMA";

    switch (templateType) {
        // EMAIL VERIFICATION
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
                <div>
                    <h2>Password Reset Request</h2>

                    <p>
                        ${verificationPayload.userName
                        ? `Hello ${verificationPayload.userName},`
                        : "Hello,"
                    }
                    </p>

                    <p>
                        Use the verification code below to reset your password.
                    </p>

                    <h1>
                        ${verificationPayload.verificationCode}
                    </h1>

                    <p>
                        This code will expire shortly.
                    </p>
                </div>
                `
            };
        }

        // TWO FACTOR AUTH
        case "TWO_FACTOR_AUTH_CODE": {

            const verificationPayload =
                payload as verificationCodePayloadType;

            return {
                subject: "Your Two-Factor Authentication Code",

                html: `
                <div>
                    <h2>Security Verification</h2>

                    <p>
                        ${verificationPayload.userName
                        ? `Hello ${verificationPayload.userName},`
                        : "Hello,"
                    }
                    </p>

                    <p>
                        Use the code below to complete your login.
                    </p>

                    <h1>
                        ${verificationPayload.verificationCode}
                    </h1>

                    <p>
                        Never share this code with anyone.
                    </p>
                </div>
                `
            };
        }

        // KYC VERIFICATION
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
                                <a href="${kycPayload.poiDocumentUrl}">
                                    View POI Document
                                </a>
                            </p>

                            <p>
                                <strong>POA Document:</strong>
                                <a href="${kycPayload.poaDocumentUrl}">
                                    View POA Document
                                </a>
                            </p>

                            <p>
                                Please verify the KYC documents
                                within 2 days.
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

        // KYC REJECTED
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
                        : "Hello,"
                    }
                    </p>

                    <p>
                        Your KYC verification request has been rejected.
                    </p>

                    <p>
                        Please re-upload valid documents and try again.
                    </p>
                </div>
                `
            };
        }

        default:
            throw new Error("Invalid email template type");
    }
};

export default generateEmailTemplate;