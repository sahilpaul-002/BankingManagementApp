import React, { useEffect, useRef, useState } from 'react'
import CustomButton from '../common/CustomButtonComponent'
import CustomOtpInput from '../common/CustomOtpInputComponent'
import { toast } from 'react-toastify';
import { useSendResetPasswordCodeMutation, useVerifyResetPasswordCodeMutation } from '@/redux/features/twoFa/twoFaApis';
import { useLocation, useNavigate } from 'react-router';
import ShowInConsole from '@/utils/ShowInConsole';
import CustomPasswordInputComponent from '../common/CustomPasswordInputComponent';
import { useForm, type SubmitHandler } from 'react-hook-form';
import z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

export default function VerifyResetPasswordCodeComponent() {
    // Configure useNavigate
    const navigate = useNavigate();

    // Configure useLocation
    const location = useLocation();

    const storedEmail = location.state?.email

    // Check the previos pathname and check if email is present in location state
    useEffect(() => {
        const email = location.state?.email;
        const previousPath = location.state?.previousPath;

        const invalidAccess =
            !email ||
            previousPath !== "/sendResetPasswordCode";

        if (invalidAccess) {
            navigate(
                "/sendResetPasswordCode",
                { replace: true }
            );
        }
    }, [location.state, navigate]);

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

    // Password visibility
    const [showNewPassword, setShowNewPassword] = useState<boolean>(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);

    // ------------------------------------- ZOD + REACT HOOK FORM ------------------------------------- \\

    // Configure Zod Validation
    const resetPasswordValidationSchema = z.object({
        password: z
            .string()
            .min(1, "Password required")
            .min(8, "Password must be atleast of 8 characters")
            .regex(/[A-Z]/, "Password must contain uppercase character")
            .regex(/[a-z]/, "Password must contain lowercase character")
            .regex(/\d/, "Password must contain a digit")
            .regex(/[!@#$%^&*]/, "Password must contain special character"),

        confirmPassword: z
            .string()
            .min(1, "Confirm password required")
    })
        .refine(
            (data) => data.password === data.confirmPassword,
            {
                path: ["confirmPassword"],
                message: "Passwords do not match"
            }
        );

    type ResetPasswordFormData =
        z.infer<typeof resetPasswordValidationSchema>;

    // React Hook Form Validation
    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
        reset: resetReactHookForm
    } = useForm<ResetPasswordFormData>({
        resolver: zodResolver(
            resetPasswordValidationSchema
        ),
        mode: "onTouched",
        reValidateMode: "onChange"
    });

    // FormData Watch
    const password = watch("password");

    // ------------------------------------ XXXXXXXXXXXXXXXXXXXXXX ------------------------------------ \\

    // ------------------------------------ Verify Code Submit ------------------------------------ \\
    // Send verify email code Api Mutation
    const [verifyResetPasswordCode, { isLoading: isVerifyingCode }] = useVerifyResetPasswordCodeMutation()
    // Function to handle onSubmit
    const onResetPasswordSubmit: SubmitHandler<ResetPasswordFormData> = async (formData) => {
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
                navigate("/sendResetPasswordCode"),
                    { replace: true }
            }
            const payload = {
                email: storedEmail || "",
                code: otpValue,
                password: formData?.password
            };
            const result = await verifyResetPasswordCode(payload).unwrap();

            ShowInConsole("Password reset service response:", result);
            if (result?.status?.toUpperCase() !== "SUCCESS") {
                toast.error("Reset password service is facing issue. Please try again later. If issue persist please contact support.")
                return
            }

            toast.success("Password reset successfully.")

            setTimeout(() => {
                navigate("/")
            }, 500);
        }
        catch (err: any) {
            ShowInConsole('Password reset service error:', err)
            const errorMessage =
                err?.data?.message ||
                err?.message ||
                "Password reset service is facing issue. Please try again later. If issue persist please contact support.";
            const normalizedMessage = errorMessage.toLowerCase();

            if (normalizedMessage.includes("user with the provided email does not exist")) {
                toast.error("Password resset failed due non-existing account. Please try with another email.");
                setTimeout(() => {
                    navigate("/sendResetPasswordCode", { replace: true });
                }, 500)
            }
            else if (normalizedMessage.includes("email not in the correct state for reset password code verification")) {
                toast.error("Password resset failed due to incorrect account state. Please try again with another email.");
                setTimeout(() => {
                    navigate("/sendResetPasswordCode", { replace: true });
                }, 500)
            }
            else if (normalizedMessage.includes("invalid verification code")) {
                toast.error("Password resset failed due to invalid code");
            }
            else if (normalizedMessage.includes("verification code expired")) {
                toast.error("Password resset failed due to expired code");
            }
            else {
                toast.error("Password resset service is facing issue. Please try again later. If issue persist please contact support.");
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
    const [sendResetPasswordCodeCode, { isLoading: isSendingCode }] = useSendResetPasswordCodeMutation()

    // Function to handle resend code
    const handleResendCode = async () => {
        setOtpError("");
        try {
            // Check email stored in session storage
            if (!storedEmail) {
                navigate("/sendResetPasswordCode"),
                    { replace: true }
            }
            const payload = {
                email: storedEmail || ""
            };
            const result = await sendResetPasswordCodeCode(payload).unwrap();

            ShowInConsole("Send reset password code response:", result);
            if (result?.status?.toUpperCase() !== "SUCCESS") {
                toast.error("Get reset password verification code service is facing issue. Please try again later. If issue persist please contact support.")
                return
            }

            toast.success("Reset password code sent to email successfully.")


            // Reset timer to 60 seconds
            setTimeRemaining(60)
            setIsResendDisabled(true)
        }
        catch (err: any) {
            ShowInConsole('Send reset password code error:', err)
            const errorMessage =
                err?.data?.message ||
                err?.message ||
                "Get reset password verification code service is facing issue. Please try again later. If issue persist please contact support.";
            const normalizedMessage = errorMessage.toLowerCase();

            if (normalizedMessage.includes("user with the provided email does not exist")) {
                toast.error("Get reset password code service failed due to non-existing email. Please try with correct email");
            }
            else {
                toast.error("Get reset password verification code service is facing issue. Please try again later. If issue persist please contact support.")
            }
        }
    }

    return (
        <div className="resetPassword-wrapper w-full h-fit flex justify-center items-center px-16! lg:px-13! xl:px-14! py-2!">
            <div className="resetPassword-container w-full h-full flex flex-col justify-start items-center gap-4">
                {/* Logo */}
                <div className="resetPassword-logo bg-amber-100 w-[100px] h-[60px] xl:w-[120px] xl:h-[50px]"></div>

                {/* Verify Email Text */}
                <div className="resetPassword-text w-full h-fit flex flex-col items-center text-center gap-2">
                    <h2 className="resetPassword-text text-2xl font-bold tracking-normal text-[var(--gold)]">
                        Reset Password
                    </h2>
                    {/* <p className="text-sm text-[var(--nav-text)]"> */}
                    <p className="text-sm text-[var(--line-strong)]">
                        A 6 digit verifycation code is sent to email.
                    </p>
                </div>

                {/* Verify Email Form */}
                <form className='resetPassword-resetPasswordForm-wrapper w-full h-fit' onSubmit={handleSubmit(onResetPasswordSubmit)}>
                    <div className="resetPassword-resetPasswordForm-container w-full h-fit space-y-2!">
                        {/* Otp Input */}
                        <CustomOtpInput id={"authForm-otp-input"} label={"Enter Otp"} otpValue={otpValue} onChange={handleOtpChange} onPaste={handlePaste} error={otpError} otpLength={6} fieldLabelClassname={"text-[var(--line-strong)] flex justify-center items-center"} otpInputClassName={"px-4! text-[var(--line-strong)]"} otpInputGroupClass={"text-[var(--line-strong)]"} />

                        <div className="signinPage-signinForm-password-forgotPassword-container w-full h-fit flex flex-col justify-center items-end gap-2">
                            {/* New Password */}
                            <CustomPasswordInputComponent
                                id={"resetPassword-input-password"}
                                label={"New Password"}
                                type={showNewPassword ? "text" : "password"}
                                placeholder={"••••••••"}
                                autoComplete="new-password"
                                fieldLabelClassname={"text-[var(--line-strong)]"}
                                inputClassname={"px-4! text-[var(--line-strong)]"}
                                showPassword={showNewPassword}
                                setShowPassword={setShowNewPassword}
                                password={password}
                                error={errors.password?.message}
                                {...register("password")}
                            />

                            {/* Confirm Password */}
                            <CustomPasswordInputComponent
                                id={"resetPassword-input-confirm-password"}
                                label={"Confirm Password"}
                                type={showConfirmPassword ? "text" : "password"}
                                placeholder={"••••••••"}
                                autoComplete="new-password"
                                fieldLabelClassname={"text-[var(--line-strong)]"}
                                inputClassname={"px-4! text-[var(--line-strong)]"}
                                showValidationRules={false}
                                showPassword={showConfirmPassword}
                                setShowPassword={setShowConfirmPassword}
                                password={watch("confirmPassword")}
                                error={errors.confirmPassword?.message}
                                {...register("confirmPassword")}
                            />
                        </div>

                        {/* Submit Button */}
                        <div className="resetPassword-resetPasswordForm-button-wrapper w-full h-fit flex justify-center items-center mt-6!">
                            <div className="resetPassword-resetPasswordForm-button-container w-[200px] sm:w-[260px] h-[30px] sm:h-[40px]">
                                <CustomButton id={"resetPassword-resetPasswordForm-button"} label={"Verify Otp"} type="submit" showButtonLoader={isVerifyingCode} variant={"navy"} />
                            </div>
                        </div>

                        {/* Resend Code Button */}
                        <div className="resetPassword-resetPasswordForm-resendCode-button-wrapper w-full h-fit flex justify-center items-center mt-6!">
                            <div className="resetPassword-resetPasswordForm-resendCode-button-container w-fit h-fit">
                                <CustomButton id={"resetPassword-resetPasswordForm-resendCode-button"}
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
                        <div className="resetPassword-resetPasswordForm-backToSignin-button-wrapper w-full h-fit flex justify-center items-center gap-1 mt-6!">
                            <span className="resetPassword-resetPasswordForm-backToSignin-button-text text-[var(--line-strong)]">
                                Back To -
                            </span>
                            <div className="resetPassword-resetPasswordForm-backToSignin-button-container w-fit h-fit">
                                <CustomButton id={"resetPassword-resetPasswordForm-backToSignin-button"} type={"button"}
                                    label={"Sign In"}
                                    onClick={() => { navigate("/", { replace: true }) }} showButtonLoader={false} variant={"authLink"}
                                />
                            </div>
                        </div>
                    </div>
                </form >
            </div>
        </div >
    )
}
