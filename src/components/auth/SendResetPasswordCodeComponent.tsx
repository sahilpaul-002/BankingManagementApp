import React, { Activity, useState } from 'react'
import CustomInput from '../common/CustomInputComponent'
import CustomButton from '../common/CustomButtonComponent';
import { Link, useNavigate } from 'react-router';
import z from 'zod';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'react-toastify';
import ShowInConsole from '@/utils/ShowInConsole';
import { useSendResetPasswordCodeMutation } from '@/redux/features/twoFa/twoFaApis';

export default function SendResetPasswordCodeComponent() {
    // Configure useNavigate
    const navigate = useNavigate();

    // ------------------------------------- ZOD + REACT HOOK FORM ------------------------------------- \\
    // Configure Zod Validation
    const sendResetPasswordCodeFormValidationSchema = z.object({
        email: z
            .string()
            .min(1, "Email required")
            .email("Invalid email")
            .regex(
                /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                'Invalid email format'
            )
    });
    type sendResetPasswordCodeFormData = z.infer<typeof sendResetPasswordCodeFormValidationSchema>

    // React Hook Form Validation
    const {
        register,
        handleSubmit,
        watch,
        control,
        formState: { errors },
        reset: resetReactHookForm
    } = useForm<sendResetPasswordCodeFormData>({
        resolver: zodResolver(sendResetPasswordCodeFormValidationSchema),
        mode: 'onTouched',
        reValidateMode: 'onChange',
    })

    // SignIn Api Mutation
    const [sendResetPasswordCode, { isLoading }] = useSendResetPasswordCodeMutation()
    // Function to handle form submission
    const onSendEmailVerificationCodeFormSubmit: SubmitHandler<sendResetPasswordCodeFormData> = async (formData) => {
        try {
            const result = await sendResetPasswordCode(formData).unwrap();

            ShowInConsole("Send reset password code response:", result);
            if (result?.status?.toUpperCase() !== "SUCCESS") {
                toast.error("Get reset password verification code service is facing issue. Please try again later. If issue persist please contact support.")
                return
            }

            toast.success("Reset password code sent to email successfully.")

            setTimeout(() => {
                navigate("/verifyForgotPasswordCode", {
                    replace: true,
                    state: {
                        email: formData?.email,
                        previousPath: location.pathname
                    }
                })
            }, 500);
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
    };
    // ------------------------------------ XXXXXXXXXXXXXXXXXXXXXX ------------------------------------ \\

    return (
        <div className="sendResetPasswordCode-wrapper w-full h-fit flex justify-center items-center px-16! lg:px-13! xl:px-14! py-2!">
            <div className="sendResetPasswordCode-container w-full h-fit flex flex-col justify-start items-center gap-4">
                {/* Logo */}
                <div className="sendResetPasswordCode-logo bg-amber-100 w-[100px] h-[60px] xl:w-[120px] xl:h-[50px]"></div>

                {/* Sign In Text */}
                <div className="sendResetPasswordCode-text w-full h-fit flex flex-col items-center text-center gap-2">
                    <h2 className="signinText text-2xl font-bold tracking-normal text-[var(--gold)]">
                        Send Reset Password Code
                    </h2>
                    {/* <p className="text-sm text-[var(--nav-text)]"> */}
                    <p className="text-sm text-[var(--line-strong)]">
                        Send a 6 digit code to your email. Use this code to reset your password.
                    </p>
                </div>

                {/* Signin Form */}
                <form className='sendResetPasswordCode-sendResetPasswordCodeForm-wrapper w-full h-fit' onSubmit={handleSubmit(onSendEmailVerificationCodeFormSubmit)}>
                    <div className="sendResetPasswordCode-sendResetPasswordCodeForm-container w-full h-fit space-y-2!">
                        {/* Email */}
                        <CustomInput id={"sendResetPasswordCodeForm-input-email"} label={"Email"} type={"email"} placeholder={"Enter Email"} fieldLabelClassname={"text-[var(--line-strong)]"} inputClassname={"px-4! text-[var(--line-strong)]"} autoFocus={true} autoComplete={"email"} error={errors?.email?.message} {...register("email")} />

                        {/* Button */}
                        <div className="sendResetPasswordCode-sendResetPasswordCodeForm-button-wrapper w-full h-fit flex justify-center items-center mt-6!">
                            <div className="sendResetPasswordCode-sendResetPasswordCodeForm-button-container w-[200px] sm:w-[260px] h-[30px] sm:h-[40px]">
                                <CustomButton id={"signPage-sendResetPasswordCodeForm-button"} label={"Send Code"} type="submit" showButtonLoader={isLoading} variant={"navy"} />
                            </div>
                        </div>

                        {/* Back To Sign In Button */}
                        <div className="sendResetPasswordCode-sendResetPasswordCodeForm-backToSignin-button-wrapper w-full h-fit flex justify-center items-center gap-1 mt-6!">
                            <span className="sendResetPasswordCode-sendResetPasswordCodeForm-backToSignin-button-text text-[var(--line-strong)]">
                                Back To -
                            </span>
                            <div className="sendResetPasswordCode-sendResetPasswordCodeForm-backToSignin-button-container w-fit h-fit">
                                <CustomButton id={"sendResetPasswordCode-sendResetPasswordCodeForm-backToSignin-button"} type={"button"}
                                    label={"Sign In"}
                                    onClick={() => { navigate("/", {replace: true}) }} showButtonLoader={false} variant={"authLink"}
                                />
                            </div>
                        </div>

                    </div>
                </form >
            </div>
        </div >
    )
}
