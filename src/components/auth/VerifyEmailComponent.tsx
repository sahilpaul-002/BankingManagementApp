import React, { useState } from 'react'
import CustomButton from '../common/CustomButtonComponent'
import CustomOtpInput from '../common/CustomOtpInputComponent'

export default function VerifyEmailComponent() {
    // Otp Value
    const [otpValue, setOtpValue] = useState<string>("");
    const [otpError, setOtpError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Falllback Dummy Api Call
    const verifyOtpApi = async (otp: string) => {
        return new Promise<{ success: boolean }>((resolve, reject) => {
            setTimeout(() => {
                if (otp === "123456") {
                    resolve({ success: true });
                } else {
                    reject(new Error("Invalid OTP"));
                }
            }, 1500);
        });
    };

    const handleSubmit = async (
        event: React.FormEvent<HTMLFormElement>
    ) => {
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
            setIsSubmitting(true);

            const response = await verifyOtpApi(otpValue);

            if (response.success) {
                console.log("OTP verified successfully");

                // navigate("/dashboard")
                // toast.success("OTP verified")
            }
        } catch (error) {
            setOtpError(
                error instanceof Error
                    ? error.message
                    : "OTP verification failed"
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    // OnChange function
    const handleOtpChange = (value: string) : void => {
        setOtpValue(value);

        if (otpError) {
            setOtpError("");
        }
    }

    return (
        <div className="verifyEmail-wrapper w-full h-fit flex justify-center items-center px-6! xl:px-10! py-2!">
            <div className="verifyEmail-container w-full h-full flex flex-col justify-start items-center gap-4">
                {/* Logo */}
                <div className="signinPage-logo bg-amber-100 w-[100px] h-[60px] xl:w-[120px] xl:h-[50px]"></div>

                {/* Verify Email Text */}
                <div className="signinPage-text w-full h-fit flex flex-col items-center text-center gap-2">
                    <h2 className="signinText text-2xl font-bold tracking-normal text-[var(--gold)]">
                        Verify Email
                    </h2>
                    {/* <p className="text-sm text-[var(--nav-text)]"> */}
                    <p className="text-sm text-[var(--line-strong)]">
                        A 6 digit verifycation code is sent to your emial.
                    </p>
                </div>

                {/* Verify Email Form */}
                <form className='signinPage-signinForm-wrapper w-full h-fit' onSubmit={handleSubmit}>
                    {/* <form className='signinPage-signinForm-wrapper w-full h-fit'> */}
                    <div className="signinPage-signinForm-container w-full h-fit space-y-2!">
                        {/* Otp Input */}
                        <CustomOtpInput id={"authForm-otp-input"} label={"Enter Otp"} otpValue={otpValue} onChange={handleOtpChange} error={otpError} otpLength={6} fieldLabelClassname={"text-[var(--line-strong)]"} otpInputClassName={"px-4! text-[var(--line-strong)]"} />

                        {/* Button */}
                        <div className="signinPage-signinForm-button-wrapper w-full h-fit flex justify-center items-center mt-6!">
                            <div className="signinPage-signinForm-button-container w-[200px] sm:w-[260px] h-[30px] sm:h-[40px]">
                                <CustomButton id={"signPage-signinForm-button"} label={"Verify Otp"} type="submit" showButtonLoader={false} variant={"navy"} />
                            </div>
                        </div>
                    </div>
                </form >
            </div>
        </div >
    )
}
