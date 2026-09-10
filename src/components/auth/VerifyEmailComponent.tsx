import React, { useEffect, useRef, useState } from 'react'
import CustomButton from '../common/CustomButtonComponent'
import CustomOtpInput from '../common/CustomOtpInputComponent'
import { toast } from 'react-toastify';
import { useSendEmailVerificationCodeMutation, useVerifyEmailCodeMutation } from '@/redux/features/twoFa/twoFaApis';
import { useNavigate } from 'react-router';
import ShowInConsole from '@/utils/ShowInConsole';

export default function VerifyEmailComponent() {
    // Get email from session storage
    const storedEmail = sessionStorage.getItem("userEmail");

    // Configure useNavigate
    const navigate = useNavigate();

    // UseEffect to check is session storage email is present
    useEffect(() => {
        if (!storedEmail) {
            navigate("/sendEmailVerificationCode");

            return;
        }
    }, [storedEmail, navigate]);

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
    const [verifyEmailCode, { isLoading: isVerifyingCode, error: verifyCodeError, data: verifyCodeData, isSuccess: verifyCodeSuccess }] = useVerifyEmailCodeMutation()
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
                navigate("/sendEmailVerificationCode")
            }
            const payload = {
                email: storedEmail || "",
                code: otpValue
            };
            const result = await verifyEmailCode(payload).unwrap();

            ShowInConsole("Verify email verification code response:", result);
            if (result?.status?.toUpperCase() !== "SUCCESS") {
                toast.error("Email verification service is facing issue. Please try again later. If issue persist please contact support.")
                return
            }

            toast.success("Email verified successfully.")

            setTimeout(() => {
                navigate("/select2FaMethod")
            }, 500);
        }
        catch (err: any) {
            ShowInConsole('Verify email verification code service error:', err)
            const errorMessage =
                err?.data?.message ||
                err?.message ||
                "Email verification service is facing issue. Please try again later. If issue persist please contact support.";
            const normalizedMessage = errorMessage.toLowerCase();

            if (normalizedMessage.includes("invalid verification code")) {
                toast.error("Email verification failed due to invalid code");
            }
            else if (normalizedMessage.includes("verification code expired")) {
                toast.error("Email verification failed due to expired code");
            }
            else {
                toast.error("Email verification service is facing issue. Please try again later. If issue persist please contact support.");
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
    const [sendVerifyEmailCode, { isLoading: isSendingCode, error: sendVerificationCodeError, data: sendVerificationCodeData, isSuccess: sendVerificationCodeSuccess }] = useSendEmailVerificationCodeMutation()

    // Function to handle resend code
    const handleResendCode = async () => {
        setOtpError("");
        try {
            // Check email stored in session storage
            if (!storedEmail) {
                navigate("/sendEmailVerificationCode")
            }
            const payload = {
                email: storedEmail || ""
            };
            const result = await sendVerifyEmailCode(payload).unwrap();

            ShowInConsole("Send email verification code response:", result);
            if (result?.status?.toUpperCase() !== "SUCCESS") {
                toast.error("Resend email verification code service failed.")
                return
            }

            toast.success("Email verification code sent to email. Please check email.")

            // Reset timer to 60 seconds
            setTimeRemaining(60)
            setIsResendDisabled(true)
        }
        catch (err: any) {
            ShowInConsole('Resend email verification code service error:', err)
            toast.error("Resend email verification code service failed.");
        }
    }

    return (
        <div className="verifyEmail-wrapper w-full h-fit flex justify-center items-center px-16! lg:px-13! xl:px-14! py-2!">
            <div className="verifyEmail-container w-full h-full flex flex-col justify-start items-center gap-4">
                {/* Logo */}
                <div className="verifyEmail-logo bg-amber-100 w-[100px] h-[60px] xl:w-[120px] xl:h-[50px]"></div>

                {/* Verify Email Text */}
                <div className="verifyEmail-text w-full h-fit flex flex-col items-center text-center gap-2">
                    <h2 className="verifyEmail-text text-2xl font-bold tracking-normal text-[var(--gold)]">
                        Verify Email
                    </h2>
                    {/* <p className="text-sm text-[var(--nav-text)]"> */}
                    <p className="text-sm text-[var(--line-strong)]">
                        A 6 digit verifycation code is sent to your email.
                    </p>
                </div>

                {/* Verify Email Form */}
                <form className='verifyEmail-verifyEmailForm-wrapper w-full h-fit' onSubmit={handleSubmit}>
                    <div className="verifyEmail-verifyEmailForm-container w-full h-fit space-y-2!">
                        {/* Otp Input */}
                        <CustomOtpInput id={"authForm-otp-input"} label={"Enter Otp"} otpValue={otpValue} onChange={handleOtpChange} onPaste={handlePaste} error={otpError} otpLength={6} fieldLabelClassname={"text-[var(--line-strong)] flex justify-center items-center"} otpInputClassName={"px-4! text-[var(--line-strong)]"} otpInputGroupClass={"text-[var(--line-strong)]"} />

                        {/* Submit Button */}
                        <div className="verifyEmail-verifyEmailForm-button-wrapper w-full h-fit flex justify-center items-center mt-6!">
                            <div className="verifyEmail-verifyEmailForm-button-container w-[200px] sm:w-[260px] h-[30px] sm:h-[40px]">
                                <CustomButton id={"verifyEmail-verifyEmailForm-button"} label={"Verify Otp"} type="submit" showButtonLoader={isVerifyingCode} variant={"navy"} />
                            </div>
                        </div>

                        {/* Resend Code Button */}
                        <div className="verifyEmail-verifyEmailForm-resendCode-button-wrapper w-full h-fit flex justify-center items-center mt-6!">
                            <div className="verifyEmail-verifyEmailForm-resendCode-button-container w-fit h-fit">
                                <CustomButton id={"verifyEmail-verifyEmailForm-resendCode-button"}
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

                        {/* Back To Sign In Button */}
                        <div className="verifyEmail-verifyEmailForm-backToSignin-button-wrapper w-full h-fit flex justify-center items-center gap-1 mt-6!">
                            <span className="verifyEmail-verifyEmailForm-backToSignin-button-text text-[var(--line-strong)]">
                                Back To -
                            </span>
                            <div className="verifyEmail-verifyEmailForm-backToSignin-button-container w-fit h-fit">
                                <CustomButton id={"verifyEmail-verifyEmailForm-backToSignin-button"} type={"button"}
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
