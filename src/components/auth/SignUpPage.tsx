import React, { Activity, useEffect, useState } from 'react'
import CustomInput from '../common/CustomInput';
import CustomPasswordInput from '../common/CustomPasswordInput';
import CustomButton from '../common/CustomButton';
import CustomSelect from '../common/CustomSelect';
import { CircleArrowRight } from 'lucide-react';
import CustomDatePicker from '../common/CustomDatePicker';
import mobileCountryCodesLists from '@/utils/mobileCountryCodesList';

export default function SignUpPage() {
    // State to manage countryCodes list
    const [mobileCoutryCodes, setMobileCountryCodes] = useState<Array<{label: string, value: string}> | null>();
    // UseState to get mobile country codes values
    useEffect(() => {
        const listMobileCountryCodes = mobileCountryCodesLists();
        const mobileCountryCodes = listMobileCountryCodes.map(item => ({
            label: item.name,
            value: item.code
        }));
        setMobileCountryCodes(mobileCountryCodes);
        console.log(mobileCountryCodes);
    }, [])

    // State to manage the password visibility
    const [showPassword, setShowPassword] = useState<boolean>(false);

    // State to manage form step
    const [formStep, setFormStep] = useState<number>(1);

    // State to manage the date
    const [date, setDate] = useState<Date | undefined>();

    useEffect(() => {
        const formattedDate = date?.toISOString()
        console.log(formattedDate);
    }, [date])

    return (
        <div className="signupPage-wrapper w-full min-h-[95.5vh] flex justify-center items- center px-0! lg:px-20! py-2!">
            <div className="signupPage-container w-[80vw] md:w-[50vw] h-[80vh] lg:w-full lg:h-full flex flex-col justify-start items-center gap-4">
                {/* Welcome Text */}
                <span className="signupPage-text w-fit h-fit text-[3vw] text-center xl:text-[3.6vw] text-[var(--color-text1)] font-semibold tracking-tight">
                    Create Account
                </span>

                {/* Logo */}
                <div className="signupPage-logo bg-amber-300 w-[160px] h-[100px]"></div>

                {/* Signup Form */}
                <div className="signupPage-signupForm-container w-full h-full">
                    {/* Form step 2 */}
                    <Activity mode={formStep === 1 ? 'visible' : 'hidden'}>
                        <div className="signupPage-signupForm1-container w-full h-fit space-y-6!">
                            {/* Full Name */}
                            <CustomInput id={"signupForm1-input-email"} label={"Full Name"} type={"text"} placeholder={"Enter full name"} inputClassname={"px-4!"} autoFocus={true} />

                            {/* Email */}
                            <CustomInput id={"signupForm1-input-email"} label={"Email"} type={"email"} placeholder={"Enter Email"} inputClassname={"px-4!"} autoComplete={"email"} />

                            {/* Password */}
                            <CustomPasswordInput id={"signupForm1-input-password"} label={"Password"} type={showPassword ? "text" : "password"} placeholder={"••••••••"} autoComplete="current-password" inputClassname={"px-4!"} showPassword={showPassword} setShowPassword={setShowPassword} />

                            {/* Confirm Password */}
                            <CustomPasswordInput id={"signupForm1-input-confirmPassword"} label={"Confirm Password"} type={showPassword ? "text" : "password"} placeholder={"••••••••"} autoComplete="current-password" inputClassname={"px-4!"} showPassword={showPassword} setShowPassword={setShowPassword} />

                            {/* Gender */}
                            <div className="signupForm1-genderSelect-container w-full h-full flex flex-col justify-center items-start gap-1">
                                <span className="signupForm1-genderSelect-text text-sm font-semibold tracking-tight">Gender</span>
                                <CustomSelect id={"signupForm1-input-select-gender"} label={"Select Gender"} labels={["Male", "Female", "Other"]} className={"w-full h-full"} />
                            </div>

                            {/* Button */}
                            <div className="signupPage-signupForm1-button-wrapper w-full h-fit flex justify-center items-center">
                                <div className="signupPage-signupForm1-button-container w-fit h-fit text-[var(--color-text1)] hover:text-[var(--color-text3)] cursor-pointer" onClick={() => { setFormStep(2) }}>
                                    <CircleArrowRight size={24} />
                                </div>
                            </div>
                        </div>
                    </Activity>

                    {/* Form step 2 */}
                    <Activity mode={formStep === 2 ? 'visible' : 'hidden'}>
                        <div className="signupPage-signupForm2-container w-full h-fit space-y-6!">
                            {/* Phone Dial Code */}
                            <div className="signupForm2-phoneCountryCode-container w-full h-full flex flex-col justify-center items-start gap-1">
                                <span className="signupForm2-phoneCountryCode-text text-sm font-semibold tracking-tight">Phone Dial Code</span>
                                <CustomSelect id={"signupForm2-input-select-phoneDialCode"} label={"Select Dial Code"} labels={mobileCoutryCodes} className={"w-full h-full"} value={mobileCoutryCodes}/>
                            </div>

                            {/* Phone Number */}
                            <CustomInput id={"signupForm2-input-email"} label={"Phone Number"} type={"text"} placeholder={"Enter Email"} inputClassname={"px-4!"} />

                            {/* DOB */}
                            <div className="signupForm2-genderSelect-container w-full h-full flex flex-col justify-center items-start gap-1">
                                <span className="signupForm2-genderSelect-text text-sm font-semibold tracking-tight">Date of Birth</span>
                                <CustomDatePicker id={"signupForm2-input-select-datePicker"} label={"Pick a date"} date={date} setDate={setDate} className={"w-full"} max={new Date()} />
                            </div>

                            {/* Country Code */}
                            <div className="signupForm2-genderSelect-container w-full h-full flex flex-col justify-center items-start gap-1">
                                <span className="signupForm2-genderSelect-text text-sm font-semibold tracking-tight">Country Code</span>
                                <CustomSelect id={"signupForm2-input-select-countryCode"} label={"Select Country Code"} labels={["Male", "Female", "Other"]} className={"w-full h-full"} />
                            </div>

                            {/* Button */}
                            <div className="signupPage-signupForm2-button-wrapper w-full h-fit flex justify-center items-center">
                                <div className="signupPage-signupForm-button-container w-[200px] sm:w-[260px] h-[30px] sm:h-[40px]">
                                    <CustomButton id={"signPage-signinForm-button"} label={"Sign In"} />
                                </div>
                            </div>
                        </div>
                    </Activity>
                </div>


            </div>
        </div>
    )
}
