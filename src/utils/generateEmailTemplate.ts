// src/services/emailTemplate.ts

type emailTemplateType =
    | "EMAIL_VERIFICATION_CODE"
    | "FORGET_PASSWORD_CODE"

interface verificationCodePayloadType {
    verificationCode: string
    userName?: string
    dashboardName?: string
}

interface templateResponseType {
    subject: string
    html: string
}

const generateEmailTemplate = (
    templateType: emailTemplateType,
    payload: verificationCodePayloadType
): templateResponseType => {
    const dashboardTitle = payload?.dashboardName || "BMA"

    switch (templateType) {

        case "EMAIL_VERIFICATION_CODE":
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

                            <!-- Header -->
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

                            <!-- Body -->
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
                                    ${payload?.userName
                        ? `Hello ${payload.userName},`
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

                                <!-- Verification Code -->
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
                                        ${payload.verificationCode}
                                    </span>
                                </div>

                                <p style="
                                    font-size: 14px;
                                    color: #6b7280;
                                    line-height: 1.6;
                                ">
                                    This verification code will expire shortly. 
                                    If you did not create this account, please ignore this email.
                                </p>

                            </div>

                            <!-- Footer -->
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
            }

        case "FORGET_PASSWORD_CODE":

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

                    <!-- Header -->
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

                    <!-- Body -->
                    <div style="padding: 40px 30px;">

                        <h2 style="
                            margin-top: 0;
                            color: #111827;
                        ">
                            Password Reset Request
                        </h2>

                        <p style="
                            font-size: 16px;
                            color: #374151;
                            line-height: 1.6;
                        ">
                            ${payload?.userName
                        ? `Hello ${payload.userName},`
                        : "Hello,"
                    }
                        </p>

                        <p style="
                            font-size: 16px;
                            color: #374151;
                            line-height: 1.6;
                        ">
                            We received a request to reset your password.
                            Use the verification code below to continue.
                        </p>

                        <!-- Reset Code -->
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
                                ${payload.verificationCode}
                            </span>
                        </div>

                        <p style="
                            font-size: 14px;
                            color: #6b7280;
                            line-height: 1.6;
                        ">
                            This code will expire shortly.
                            If you did not request a password reset,
                            please ignore this email.
                        </p>

                    </div>

                    <!-- Footer -->
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
            }

        default:
            throw new Error("Invalid email template type")
    }
}

export default generateEmailTemplate;