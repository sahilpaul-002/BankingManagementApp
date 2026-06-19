import React, { useEffect, useRef, useState } from 'react'
import CustomButton from '../common/CustomButtonComponent'
import CustomOtpInput from '../common/CustomOtpInputComponent'
import { toast } from 'react-toastify';
import { useSendTwoFaCodeMutation, useSendVerifyEmailCodeMutation, useVerifyEmailCodeMutation, useVerifyTwoFaCodeMutation } from '@/redux/features/twoFa/twoFaApis';
import { replace, useLocation, useNavigate, useParams } from 'react-router';
import ShowInConsole from '@/utils/ShowInConsole';

export default function Verify2FaCodeComponent() {
    // Get 2fa method from url params
    const { twoFatype } = useParams()

    // Get email from session storage
    const storedEmail = sessionStorage.getItem("userEmail");

    // Configure useNavigate
    const navigate = useNavigate();

    // Configure useLocation
    const location = useLocation();

    // UseEffect to check is session storage email is present
    useEffect(() => {
        if (!storedEmail) {
            navigate(`/send2FaCode/${twoFatype}`, { replace: true })

            return;
        }
    }, [storedEmail, navigate]);

    // Check the previos pathname and check if secretKey and qrCodeUrl present
    useEffect(() => {
        if (location.state?.previousPath === "/send2FaCode/totp") {
            const missingSecret =
                !location.state?.secretKey

            const missingQr =
                !location.state?.qrCodeUrl

            if (missingSecret || missingQr) {
                navigate(
                    "/send2FaCode/totp",
                    { replace: true }
                )
            }
        }
    }, [location.state, navigate])

    // Otp Value
    const [otpValue, setOtpValue] = useState<string>("");
    const [otpError, setOtpError] = useState("");

    // Function to handle otp paste
    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>): void => {
        e.preventDefault();

        const pastedValue = e.clipboardData
            .getData("text")
            .replace(/\D/g, "")
            .slice(0, 6);

        if (!pastedValue) return;

        setOtpValue(pastedValue);

        if (otpError) {
            setOtpError("");
        }
    };

    // Function to handle onChange
    const handleOtpChange = (value: string): void => {
        // Allow only digits
        if (!/^\d*$/.test(value)) return

        // Limit length
        const formattedValue = value.slice(0, 6)

        setOtpValue(formattedValue)

        // Clear error while typing
        if (otpError) {
            setOtpError("")
        }
    }

    // ------------------------------------ Verify Code Submit ------------------------------------ \\
    // Send verify email code Api Mutation
    const [verify2FaCode, { isLoading: isVerifying2FaCode, error: verify2FaCodeError, data: verify2FaCodeData, isSuccess: verify2FaCodeSuccess }] = useVerifyTwoFaCodeMutation()
    // Function to handle onSubmit
    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setOtpError("");
        // Required validation
        if (!otpValue.trim()) {
            setOtpError("OTP is required");
            return;
        }
        // Length validation
        if (otpValue.length !== 6) {
            setOtpError("OTP must be 6 digits");
            return;
        }
        // Numeric validation
        if (!/^\d+$/.test(otpValue)) {
            setOtpError("OTP must contain only numbers");
            return;
        }
        try {
            // Check email stored in session storage
            if (!storedEmail) {
                navigate(`/send2FaCode/${twoFatype}`, { replace: true })
            }
            let codeType
            if (twoFatype === "emailOtp") {
                codeType = "EMAIL-OTP"
            }
            else if (twoFatype === "totp") {
                codeType = "TOTP"
            }
            else {
                codeType = "SMS-OTP"
            }
            const payload = {
                email: storedEmail || "",
                code_type: codeType,
                code: otpValue
            };
            const result = await verify2FaCode(payload).unwrap();

            ShowInConsole("2fa verification code response:", result);
            if (result?.status?.toUpperCase() !== "SUCCESS") {
                toast.error("2 factor authentication service is facing issue. Please try again later. If issue persist please contact support.")
                return
            }

            toast.success("2-factor-authentication code verified successfully.")

            // setTimeout(() => {
            //     navigate("/select2FaMethod")
            // }, 1500);
        }
        catch (err: any) {
            ShowInConsole('2Fa code verification service error:', err)
            const errorMessage =
                err?.data?.message ||
                err?.message ||
                "2 factor authentication service is facing issue. Please try again later. If issue persist please contact support.";
            const normalizedMessage = errorMessage.toLowerCase();

            switch (true) {
                case normalizedMessage.includes("email not in the valid state for 2 factor authentication using email - 2fa not enabled"):
                    toast.error("2-factor-authentication service failed due to icorrect account email state. Please restart the verification process.");
                    setTimeout(() => {
                        navigate("/select2FaMethod", { replace: true })
                    }, 1500)
                    break;

                case normalizedMessage.includes("email not in the valid state for 2 factor authentication using authenticator - 2fa not configured for authenticator"):
                    toast.error("2-factor-authentication service failed due to icorrect account email state. Please restart the verification process.");
                    setTimeout(() => {
                        navigate("/select2FaMethod", { replace: true })
                    }, 1500)
                    break;

                case normalizedMessage.includes("verifiEmailService is facing issue - email not in the correct state for two factor auth verification"):
                    toast.error("2-factor-authentication service failed due to icorrect account email state. Please restart the verification process.");
                    setTimeout(() => {
                        navigate("/select2FaMethod", { replace: true })
                    }, 1500)
                    break;

                case normalizedMessage.includes("verification code expired"):
                    toast.error("2-factor-authentication service failed due to expired code.");
                    break;

                case normalizedMessage.includes("invalid verification code"):
                    toast.error("2-factor-authentication service failed due to invalid code.");
                    break;

                default:
                    toast.error("Sign in service is facing issue. Please try again later. If issue persist please contact support.");
                    break;
            }
        }
    };
    // -------------------------------- XXXXXXXXXXXXXXXXXXXXXXXXx -------------------------------- \\

    // --------------------------------- Resend Code Timer --------------------------------- \\
    const [timeRemaining, setTimeRemaining] = useState<number>(60)
    const [isResendDisabled, setIsResendDisabled] = useState<boolean>(true)

    // Countdown timer effect
    useEffect(() => {
        let interval: number | null = null;

        if (timeRemaining > 0) {
            setIsResendDisabled(true);
            interval = window.setInterval(() => {
                setTimeRemaining((prev) => {
                    if (prev <= 1) {
                        setIsResendDisabled(false);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } else {
            setIsResendDisabled(false);
        }

        return () => {
            if (interval !== null) {
                clearInterval(interval);
            }
        };
    }, [timeRemaining]);
    // ------------------------------- XXXXXXXXXXXXXXXXXXXXXXXXXX ------------------------------- \\

    // --------------------------------- Resend Code --------------------------------- \\
    // Send verify email code Api Mutation
    const [send2FaCode, { isLoading: isSendingCode, error: send2FaCodeError, data: send2FaCodeData, isSuccess: send2FaCodeSuccess }] = useSendTwoFaCodeMutation()
    // Function to handle resend code
    const handleResendCode = async () => {
        setOtpError("");
        try {
            // Check email stored in session storage
            if (!storedEmail) {
                navigate(`/send2FaCode/${twoFatype}`, { replace: true })
            }
            const payload = {
                email: storedEmail as string,
                code_type: "EMAIL-OTP"
            }
            const result = await send2FaCode(payload).unwrap();

            ShowInConsole("Send 2fa code response:", result);
            if (result?.status?.toUpperCase() !== "SUCCESS") {
                toast.error("Resend 2-factor-authentication code service is facing issue. Please try again later. If issue persist please contact support.")
                return
            }

            toast.success("2-factor-authentication code sent to email successfully.")

            // Reset timer to 60 seconds
            setTimeRemaining(60)
            setIsResendDisabled(true)
        }
        catch (err: any) {
            ShowInConsole('Get 2fa code error:', err)
            toast.error("Resend 2-factor-authentication code service is facing issue. Please try again later. If issue persist please contact support.")
        }
    }

    return (
        <div className="verify2FaCode-wrapper w-full h-fit flex justify-center items-center px-16! lg:px-13! xl:px-14! py-2!">
            <div className="verify2FaCode-container w-full h-full flex flex-col justify-start items-center gap-4">
                {/* Logo */}
                <div className="verify2FaCode-logo bg-amber-100 w-[100px] h-[60px] xl:w-[120px] xl:h-[50px]"></div>

                {/* Verify Email Text */}
                <div className="verify2FaCode-text w-full h-fit flex flex-col items-center text-center gap-2">
                    <h2 className="verify2FaCode-text text-2xl font-bold tracking-normal text-[var(--gold)]">
                        Verify Authentication Code
                    </h2>
                    <p className="text-sm text-[var(--line-strong)]">
                        {twoFatype === "emailOtp" ? (
                            `A 6 digit authentication code is sent on email.`
                        ) : (
                            `A 6 digit authentication code is generated on the authenticator app`
                        )}
                    </p>
                </div>

                {/* Authenticator secretKey + qrCodeUrl */}
                {(location.state?.previosPath === "/send2FaCode/totp") && (
                    <div className="verify2FaCode-text w-full h-fit flex flex-col items-center text-center gap-2">
                        {(location.state?.qrCodeUrl) && (
                            <div className="w-[80px] h-[80px]">
                                <img
                                    src={location.state.qrCodeUrl}
                                    alt="Authenticator QR Code"
                                    className="w-full h-full object-contain rounded-lg"
                                />
                            </div>
                        )}
                        {(location.state?.secretKey) && (
                            <span className="verify2FaCode-text text-start text-[10px] font-bold tracking-normal text-[var(--line-strong)]">
                                {`SecretKey : `}
                                <span className='text-[8px]'>{location.state?.secretKey}</span>
                            </span>
                        )}
                    </div>
                )}

                {/* Verify Email Form */}
                <form className='verify2FaCode-verify2FaCodeForm-wrapper w-full h-fit' onSubmit={handleSubmit}>
                    <div className="verify2FaCode-verify2FaCodeForm-container w-full h-fit space-y-2!">
                        {/* Otp Input */}
                        <CustomOtpInput id={"authForm-otp-input"} label={"Enter Otp"} otpValue={otpValue} onChange={handleOtpChange} onPaste={handlePaste} error={otpError} otpLength={6} fieldLabelClassname={"text-[var(--line-strong)] flex justify-center items-center"} otpInputClassName={"px-4! text-[var(--line-strong)]"} otpInputGroupClass={"text-[var(--line-strong)]"} />

                        {/* Submit Button */}
                        <div className="verify2FaCode-verify2FaCodeForm-button-wrapper w-full h-fit flex justify-center items-center mt-6!">
                            <div className="verify2FaCode-verify2FaCodeForm-button-container w-[200px] sm:w-[260px] h-[30px] sm:h-[40px]">
                                <CustomButton id={"verify2FaCode-verify2FaCodeForm-button"} label={"Verify Otp"} type="submit" showButtonLoader={isVerifying2FaCode} variant={"navy"} />
                            </div>
                        </div>

                        {/* Resend Code Button */}
                        {twoFatype === "emailOtp" && (
                            <div className="verify2FaCode-verify2FaCodeForm-resendCode-button-wrapper w-full h-fit flex justify-center items-center mt-6!">
                                <div className="verify2FaCode-verify2FaCodeForm-resendCode-button-container w-fit h-fit">
                                    <CustomButton id={"verify2FaCode-verify2FaCodeForm-resendCode-button"}
                                        type={"button"}
                                        label={isSendingCode
                                            ? 'Resending...'
                                            : isResendDisabled
                                                ? `Resend Code [ ${timeRemaining}s ]`
                                                : 'Resend Code'
                                        }
                                        onClick={handleResendCode} showButtonLoader={false} variant={"authResend"}
                                        disabled={isResendDisabled || isSendingCode}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Back To Sign In Button */}
                        <div className="verify2FaCode-verify2FaCodeForm-backToSignin-button-wrapper w-full h-fit flex justify-center items-center gap-1 mt-6!">
                            <span className="verify2FaCode-verify2FaCodeForm-backToSignin-button-text text-[var(--line-strong)]">
                                Back To -
                            </span>
                            <div className="verify2FaCode-verify2FaCodeForm-backToSignin-button-container w-fit h-fit">
                                <CustomButton id={"verify2FaCode-verify2FaCodeForm-backToSignin-button"} type={"button"}
                                    label={"Sign In"}
                                    onClick={() => { navigate("/") }} showButtonLoader={false} variant={"authLink"}
                                />
                            </div>
                        </div>
                    </div>
                </form >
            </div>
        </div >
    )
}