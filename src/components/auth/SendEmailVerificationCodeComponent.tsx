import React, { Activity, useState } from 'react'
import CustomInput from '../common/CustomInputComponent'
import CustomButton from '../common/CustomButtonComponent';
import { Link, useNavigate } from 'react-router';
import z from 'zod';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'react-toastify';
import ShowInConsole from '@/utils/ShowInConsole';
import { useSendEmailVerificationCodeMutation } from '@/redux/features/twoFa/twoFaApis';

export default function SendEmailVerificationCodeComponent() {
    // Configure useNavigate
    const navigate = useNavigate();

    // ------------------------------------- ZOD + REACT HOOK FORM ------------------------------------- \\
    // Configure Zod Validation
    const sendEmailVerificationCodeFormValidationSchema = z.object({
        email: z
            .string()
            .min(1, "Email required")
            .email("Invalid email")
            .regex(
                /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                'Invalid email format'
            )
    });
    type sendEmailVerificationCodeFormData = z.infer<typeof sendEmailVerificationCodeFormValidationSchema>

    // React Hook Form Validation
    const {
        register,
        handleSubmit,
        watch,
        control,
        formState: { errors },
        reset: resetReactHookForm
    } = useForm<sendEmailVerificationCodeFormData>({
        resolver: zodResolver(sendEmailVerificationCodeFormValidationSchema),
        mode: 'onTouched',
        reValidateMode: 'onChange',
    })

    // SignIn Api Mutation
    const [sendVerificationCode, { isLoading, error, data, isSuccess }] = useSendEmailVerificationCodeMutation()
    // Function to handle form submission
    const onSendEmailVerificationCodeFormSubmit: SubmitHandler<sendEmailVerificationCodeFormData> = async (formData) => {
        try {
            const result = await sendVerificationCode(formData).unwrap();

            ShowInConsole("Send email verification code response:", result);
            if (result?.status?.toUpperCase() !== "SUCCESS") {
                toast.error("Send email verification code service is facing issue. Please try again later. If issue persist please contact support.")
                return
            }

            toast.success("Email verification code sent to email successfully.")

            // Set user email in session storage ( this email is already verified at session validation in node)
            sessionStorage.setItem("userEmail", formData?.email);

            setTimeout(() => {
                navigate("/verifyEmail", {replace: true})
            }, 500);
        }
        catch (err: any) {
            ShowInConsole('Send email verification code error:', err)
            toast.error("Send email verification code service is facing issue. Please try again later. If issue persist please contact support.")
        }
    };
    // ------------------------------------ XXXXXXXXXXXXXXXXXXXXXX ------------------------------------ \\

    return (
        <div className="sendEmailVerificationCode-wrapper w-full h-fit flex justify-center items-center px-16! lg:px-13! xl:px-14! py-2!">
            <div className="sendEmailVerificationCode-container w-full h-fit flex flex-col justify-start items-center gap-4">
                {/* Logo */}
                <div className="sendEmailVerificationCode-logo bg-amber-100 w-[100px] h-[60px] xl:w-[120px] xl:h-[50px]"></div>

                {/* Sign In Text */}
                <div className="sendEmailVerificationCode-text w-full h-fit flex flex-col items-center text-center gap-2">
                    <h2 className="signinText text-2xl font-bold tracking-normal text-[var(--gold)]">
                        Send Verification Code
                    </h2>
                    {/* <p className="text-sm text-[var(--nav-text)]"> */}
                    <p className="text-sm text-[var(--line-strong)]">
                        Send a 6 digit code to your email. Use this code to verify your email.
                    </p>
                </div>

                {/* Signin Form */}
                <form className='sendEmailVerificationCode-sendEmailVerificationCodeForm-wrapper w-full h-fit' onSubmit={handleSubmit(onSendEmailVerificationCodeFormSubmit)}>
                    <div className="sendEmailVerificationCode-sendEmailVerificationCodeForm-container w-full h-fit space-y-2!">
                        {/* Email */}
                        <CustomInput id={"sendEmailVerificationCodeForm-input-email"} label={"Email"} type={"email"} placeholder={"Enter Email"} fieldLabelClassname={"text-[var(--line-strong)]"} inputClassname={"px-4! text-[var(--line-strong)]"} autoFocus={true} autoComplete={"email"} error={errors?.email?.message} {...register("email")} />

                        {/* Button */}
                        <div className="sendEmailVerificationCode-sendEmailVerificationCodeForm-button-wrapper w-full h-fit flex justify-center items-center mt-6!">
                            <div className="sendEmailVerificationCode-sendEmailVerificationCodeForm-button-container w-[200px] sm:w-[260px] h-[30px] sm:h-[40px]">
                                <CustomButton id={"signPage-sendEmailVerificationCodeForm-button"} label={"Send Code"} type="submit" showButtonLoader={isLoading} variant={"navy"} />
                            </div>
                        </div>

                        {/* Back To Sign In Button */}
                        <div className="sendEmailVerificationCode-sendEmailVerificationCodeForm-backToSignin-button-wrapper w-full h-fit flex justify-center items-center gap-1 mt-6!">
                            <span className="sendEmailVerificationCode-sendEmailVerificationCodeForm-backToSignin-button-text text-[var(--line-strong)]">
                                Back To -
                            </span>
                            <div className="sendEmailVerificationCode-sendEmailVerificationCodeForm-backToSignin-button-container w-fit h-fit">
                                <CustomButton id={"sendEmailVerificationCode-sendEmailVerificationCodeForm-backToSignin-button"} type={"button"}
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
