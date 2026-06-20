import React, { useEffect, useRef, useState } from 'react'
import CustomButton from '../common/CustomButtonComponent'
import { useNavigate } from 'react-router';
import CustonRadioGroupChoiceCardComponent from '../common/CustonRadioGroupChoiceCardComponent';

export default function Select2FaMethodComponent() {
    // Get email from session storage
    const storedEmail = sessionStorage.getItem("userEmail");

    // Configure useNavigate
    const navigate = useNavigate();

    const [select2FaMethodError, setSelect2FaMMethodError] = useState("")

    // ------------------------------------ Select 2Fa Method Submit ------------------------------------ \\
    const [twoFaMethodType, setTwoFaMethodType] = useState("EMAIL-OTP")

    // Function to handle onSubmit
    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!twoFaMethodType) {
            setSelect2FaMMethodError(
                "2-factor-authentication method is required"
            )
            return
        }

        setSelect2FaMMethodError("")

        if (twoFaMethodType === "TOTP") {
            navigate("/send2FaCode/totp", {replace: true})
            return
        }

        if (twoFaMethodType === "EMAIL-OTP") {
            navigate("/send2FaCode/emailOtp", {replace: true})
        }
    }
    // -------------------------------- XXXXXXXXXXXXXXXXXXXXXXXXx -------------------------------- \\

    return (
        <div className="select2FaMethod-wrapper w-full h-fit flex justify-center items-center px-16! lg:px-13! xl:px-14! py-2!">
            <div className="select2FaMethod-container w-full h-full flex flex-col justify-start items-center gap-4">
                {/* Logo */}
                <div className="select2FaMethod-logo bg-amber-100 w-[100px] h-[60px] xl:w-[120px] xl:h-[50px]"></div>

                {/* Verify Email Text */}
                <div className="select2FaMethod-text w-full h-fit flex flex-col items-center text-center gap-2">
                    <h2 className="select2FaMethod-text text-2xl font-bold tracking-normal text-[var(--gold)]">
                        Select Authentication Method
                    </h2>
                    {/* <p className="text-sm text-[var(--nav-text)]"> */}
                    <p className="text-sm text-[var(--line-strong)]">
                        Set the 2-factor-authentication method.
                    </p>
                </div>

                {/* Verify Email Form */}
                <form className='select2FaMethod-select2FaMethodForm-wrapper w-full h-fit' onSubmit={handleSubmit}>
                    <div className="select2FaMethod-select2FaMethodForm-container w-full h-fit space-y-2!">
                        {/* Method Selection */}
                        <CustonRadioGroupChoiceCardComponent id={"authForm-radioGroupChoiceCards"} label={"Select Type"} fieldLegendClassname={"text-center text-[var(--line-strong)]"} defaultItem={"EMAIL-OTP"} feildLabelClassname={"px-4! text-[var(--line-strong)] border-[var(--line)}"} fieldItems={[{ title: "Authenticator App", description: "Use 2-factor-authenticator app to get time-based-otp", value: "TOTP" }, { title: "Email Otp", description: "Get 2-factor-authentication code on your email", value: "EMAIL-OTP" }]} onValueChange={(value) => { setTwoFaMethodType(value); setSelect2FaMMethodError("") }} error={select2FaMethodError} />

                        {/* Submit Button */}
                        <div className="select2FaMethod-select2FaMethodForm-button-wrapper w-full h-fit flex justify-center items-center mt-6!">
                            <div className="select2FaMethod-select2FaMethodForm-button-container w-[200px] sm:w-[260px] h-[30px] sm:h-[40px]">
                                <CustomButton id={"select2FaMethod-select2FaMethodForm-button"} label={"Select Method"} type="submit" variant={"navy"} />
                            </div>
                        </div>

                        {/* Back To Sign In Button */}
                        <div className="select2FaMethod-select2FaMethodForm-backToSignin-button-wrapper w-full h-fit flex justify-center items-center gap-1 mt-6!">
                            <span className="select2FaMethod-select2FaMethodForm-backToSignin-button-text text-[var(--line-strong)]">
                                Back To -
                            </span>
                            <div className="select2FaMethod-select2FaMethodForm-backToSignin-button-container w-fit h-fit">
                                <CustomButton id={"select2FaMethod-select2FaMethodForm-backToSignin-button"} type={"button"}
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
