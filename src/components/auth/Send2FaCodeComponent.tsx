import React, { Activity, useEffect, useState } from 'react'
import CustomInput from '../common/CustomInputComponent'
import CustomButton from '../common/CustomButtonComponent';
import { Link, useNavigate, useParams } from 'react-router';
import z from 'zod';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'react-toastify';
import ShowInConsole from '@/utils/ShowInConsole';
import { useSendTwoFaCodeMutation } from '@/redux/features/twoFa/twoFaApis';

export default function Send2FaCodeComponent() {
    // Get 2fa method from url params
    const { twoFatype } = useParams()

    // Get email from session storage
    const storedEmail = sessionStorage.getItem("userEmail");

    // Configure useNavigate
    const navigate = useNavigate();

    // ------------------------------------- ZOD + REACT HOOK FORM ------------------------------------- \\
    // Configure Zod Validation
    const send2FaCodeFormValidationSchema = z.object({
        email: z
            .string()
            .min(1, "Email required")
            .email("Invalid email")
            .regex(
                /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                'Invalid email format'
            )
    });
    type send2FaCodeFormData = z.infer<typeof send2FaCodeFormValidationSchema>

    // React Hook Form Validation
    const {
        register,
        handleSubmit,
        watch,
        control,
        formState: { errors },
        reset: resetReactHookForm
    } = useForm<send2FaCodeFormData>({
        resolver: zodResolver(send2FaCodeFormValidationSchema),
        mode: 'onTouched',
        reValidateMode: 'onChange',
    })

    // Update the hook for data if email present in the session storage
    useEffect(() => {
        if (storedEmail) {
            resetReactHookForm({
                email: storedEmail
            })
        }
    }, [storedEmail, resetReactHookForm])

    // SignIn Api Mutation
    const [send2FaCode, { isLoading }] = useSendTwoFaCodeMutation()
    // Function to handle form submission
    const onSend2FaCodeFormSubmit: SubmitHandler<send2FaCodeFormData> = async (formData) => {
        try {
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
                email: formData?.email,
                code_type: codeType
            }
            const result = await send2FaCode(payload).unwrap();

            ShowInConsole("Send 2fa code response:", result);
            if (result?.status?.toUpperCase() !== "SUCCESS") {
                toast.error("Get 2-factor-authentication code service is facing issue. Please try again later. If issue persist please contact support.")
                return
            }

            if (twoFatype === "emailOtp") {
                toast.success("2-factor-authentication code sent to email successfully.")
            }
            else if (twoFatype === "totp") {
                toast.success("2-factor-authentication code generated successfully.")
            }
            else {
                toast.success("2-factor-authentication code sent to sms successfully.")
            }

            // Set user email in session storage ( this email is already verified at session validation in node)
            sessionStorage.setItem("userEmail", formData?.email);

            setTimeout(() => {
                if (twoFatype === "emailOtp") {
                    navigate("/verify2FaCode/emailOtp")
                }
                else if (twoFatype === "totp") {
                    navigate("/verify2FaCode/totp", {
                        state: {
                            secretKey: result?.data?.secretKey,
                            qrCodeUrl: result?.data?.qrCodeUrl,
                            previosPath: location.pathname
                        }
                    })
                }
                else {
                    navigate("/verify2FaCode/smsOtp")
                }
            }, 500);
        }
        catch (err: any) {
            ShowInConsole('Get 2fa code error:', err)
            toast.error("Get 2-factor-authentication code service is facing issue. Please try again later. If issue persist please contact support.")
        }
    };
    // ------------------------------------ XXXXXXXXXXXXXXXXXXXXXX ------------------------------------ \\

    return (
        <div className="send2FaCode-wrapper w-full h-fit flex justify-center items-center px-16! lg:px-13! xl:px-14! py-2!">
            <div className="send2FaCode-container w-full h-fit flex flex-col justify-start items-center gap-4">
                {/* Logo */}
                <div className="send2FaCode-logo bg-amber-100 w-[100px] h-[60px] xl:w-[120px] xl:h-[50px]"></div>

                {/* Sign In Text */}
                <div className="send2FaCode-text w-full h-fit flex flex-col items-center text-center gap-2">
                    <h2 className="signinText text-2xl font-bold tracking-normal text-[var(--gold)]">
                        Get 2-Factor-Authentication Code
                    </h2>
                    {/* <p className="text-sm text-[var(--nav-text)]"> */}
                    <p className="text-sm text-[var(--line-strong)]">
                        {twoFatype === "emailOtp" ? (
                            `Get a 6 digit code on email. Use this code to verify 2-factor-authentication.`
                        ) : (
                            `Get a 6 digit code on authenticator app. Use this code to verify 2-factor-authentication.`
                        )}
                    </p>
                </div>

                {/* Signin Form */}
                <form className='send2FaCode-send2FaCodeForm-wrapper w-full h-fit' onSubmit={handleSubmit(onSend2FaCodeFormSubmit)}>
                    <div className="send2FaCode-send2FaCodeForm-container w-full h-fit space-y-2!">
                        {/* Email */}
                        <CustomInput id={"send2FaCodeForm-input-email"} label={"Email"} type={"email"} placeholder={"Enter Email"} fieldLabelClassname={"text-[var(--line-strong)]"} inputClassname={"px-4! text-[var(--line-strong)]"} autoFocus={true} autoComplete={"email"} disabled={!!storedEmail} error={errors?.email?.message} {...register("email")} />

                        {/* Button */}
                        <div className="send2FaCode-send2FaCodeForm-button-wrapper w-full h-fit flex justify-center items-center mt-6!">
                            <div className="send2FaCode-send2FaCodeForm-button-container w-[200px] sm:w-[260px] h-[30px] sm:h-[40px]">
                                <CustomButton id={"send2FaCode-send2FaCodeForm-button"} label={"Get Code"} type="submit" showButtonLoader={isLoading} variant={"navy"} />
                            </div>
                        </div>

                        {/* Back To Sign In Button */}
                        <div className="send2FaCode-send2FaCodeForm-backToSignin-button-wrapper w-full h-fit flex justify-center items-center gap-1 mt-6!">
                            <span className="send2FaCode-send2FaCodeForm-backToSignin-button-text text-[var(--line-strong)]">
                                Back To -
                            </span>
                            <div className="send2FaCode-send2FaCodeForm-backToSignin-button-container w-fit h-fit">
                                <CustomButton id={"send2FaCode-send2FaCodeForm-backToSignin-button"} type={"button"}
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
