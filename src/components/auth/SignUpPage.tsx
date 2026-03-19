import React, { Activity, useEffect, useState } from 'react'
import CustomInput from '../common/CustomInput';
import CustomPasswordInput from '../common/CustomPasswordInput';
import CustomButton from '../common/CustomButton';
import CustomSelect from '../common/CustomSelect';
import { CircleArrowLeft, CircleArrowRight } from 'lucide-react';
import CustomDatePicker from '../common/CustomDatePicker';
import mobileCountryCodesLists from '@/utils/mobileCountryCodesList';
import { Controller, useForm, type SubmitHandler, type SubmitErrorHandler } from "react-hook-form"
import { Link, useNavigate } from 'react-router';
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"

export default function SignUpPage() {
    // Configure useNavigate
    const nav = useNavigate();

    // ---------------------------------- LOGIC TO GET COUNTRY CODES LIST ---------------------------------- \\
    // State to manage countryCodes list
    const [mobileDialCodes, setMobileDialCodes] = useState<Array<{ label: string; value: string }> | null>(null);
    const [mobileCountryCodes, setMobileCountryCodes] = useState<Array<string> | null>(null);
    // UseState to get mobile country codes values
    useEffect(() => {
        const listMobileCountryCodes = mobileCountryCodesLists();
        const mobileDialCodesList = listMobileCountryCodes.map(item => ({
            id: item.name,
            label: item.name,
            value: item.code
        }));
        setMobileDialCodes(mobileDialCodesList);
        // console.log(mobileCountryCodes);

        const mobileCountryCodes = listMobileCountryCodes.map(item => item.name);
        setMobileCountryCodes(mobileCountryCodes);
        // console.log(mobileCountryCodes);
    }, [])
    // -------------------------------- XXXXXXXXXXXXXXXXXXXXXXXXXXX -------------------------------- \\

    // State to manage the password visibility
    const [showPassword, setShowPassword] = useState<boolean>(false);
    // State to manage form step
    const [formStep, setFormStep] = useState<number>(1);

    // useEffect(() => {
    //     const formattedDate = date?.toISOString()
    //     console.log(formattedDate);
    // }, [date])

    // ------------------------------------- ZOD + REACT HOOK FORM ------------------------------------- \\
    // Configure Zod Validation
    const signupFormValidationSchema = z.object({
        fullName: z
            .string()
            .min(4, "Full name must be alteast 4 characters"),
        email: z
            .string()
            .email("Invalid email"),
        password: z.string()
            .min(8, 'Password must be atleast of 8 characters')
            .regex(/[A-Z]/, 'Password must contain a uppercase character')
            .regex(/[a-z]/, 'Password must contain a lowercase character')
            .regex(/\d/, 'Password must contain a digit')
            .regex(/[!@#$%^&*]/, 'Password must contain special characters'),
        confirmPassword: z
            .string(),
        gender: z
            .string()
            .min(1, "Please select a gender"),

        dialCode: z
            .string()
            .min(1, "Please select a dial code"),

        countryCode: z
            .string()
            .min(1, "Please select a country"),

        phoneNumber: z
            .string()
            .min(4, "Phone number must be atleast of 4 digits")
            .max(15, "Phone number can be of maximum of 15 digits")
            .regex(/^[0-9]+$/, "Phone number must contain only digits"),
        dateOfBirth: z
            .date({ error: issue => issue.input === undefined ? "Date of birth required" : "Invalid date of birth" })
            .refine((date) => {
                const today = new Date();
                const minDate = new Date(
                    today.getFullYear() - 18,
                    today.getMonth(),
                    today.getDate()
                );
                return date <= minDate;
            }, {
                message: "You must be at least 18 years old",
            }),
    }).refine((d) => d.password === d.confirmPassword, {
        message: ('settings.passwords_dont_match'),
        path: ['confirm_password'],
    });
    type SignupFormData = z.infer<typeof signupFormValidationSchema>

    // React Hook Form Validation
    const {
        register,
        handleSubmit,
        watch,
        control,
        formState: { errors },
        reset
    } = useForm<SignupFormData>({
        resolver: zodResolver(signupFormValidationSchema),
    })

    const onValid: SubmitHandler<SignupFormData> = (data) => {
        console.log(data);
    };

    const onError: SubmitErrorHandler<SignupFormData> = (errors) => {
        const step1Fields = [
            "fullName",
            "email",
            "password",
            "confirmPassword",
            "gender",
        ] as const;

        const hasStep1Error = step1Fields.some((field) => errors[field]);

        if (hasStep1Error) {
            setFormStep(1);
        };
    };

    const onSignupFormSubmit = handleSubmit(onValid, onError);

    // Formdata Watch
    const password = watch("password");
    // ------------------------------------ XXXXXXXXXXXXXXXXXXXXXX ------------------------------------ \\

    return (
        <div className="signupPage-wrapper w-full min-h-screen flex justify-center items- center px-0! lg:px-20! py-2!">
            <div className="signupPage-container w-[80vw] md:w-[50vw] min-h-[80vh] lg:w-full lg:h-full flex flex-col justify-start items-center gap-4">
                {/* Welcome Text */}
                <span className="signupPage-text w-fit h-fit text-[36px] sm:text-[6vw] md:text-[4vw] xl:text-[3.6vw] text-[var(--color-text1)] font-semibold tracking-tight">
                    Create Account
                </span>

                {/* Logo */}
                <div className="signupPage-logo bg-amber-300 w-[160px] h-[100px]"></div>

                {/* Signin Link */}
                <div className="signinPage-signinForm-createNewAccount-container w-full h-fit flex justify-center items-center">
                    <div className="signinPage-signinForm-createNewAccount w-fit h-fit">
                        <span className="signinPage-singinForm-createAccount-text me-1! text-[12px] sm:text-[14px] text-[var(--color-text3)] tracking-tight inline-block">Already have an account -</span>
                        <span className="signinPage-singinForm-createAccount-text ms-1! text-[12px] sm:text-[14px] text-[var(--color-link1)] hover:text-[var(--color-link2)] font-semibold tracking-tight hover:underline! inline-block cursor-pointer">
                            <Link to="/">Sign In</Link>
                        </span>
                    </div>
                </div>

                {/* Signup Form */}
                <form className="signupForm-signupForm-wrapper w-full h-full" noValidate onSubmit={onSignupFormSubmit}>
                    <div className="signupPage-signupForm-container w-full h-full">
                        {/* Form step 1*/}
                        <Activity mode={formStep === 1 ? 'visible' : 'hidden'}>
                            <div className="signupPage-signupForm1-container w-full h-fit space-y-6!">
                                {/* Full Name */}
                                <CustomInput id={"signupForm1-input-email"} label={"Full Name"} type={"text"} placeholder={"Enter full name"} inputClassname={"px-4!"} autoFocus={true} error={errors?.fullName?.message} {...register("fullName")} />

                                {/* Email */}
                                <CustomInput id={"signupForm1-input-email"} label={"Email"} type={"email"} placeholder={"Enter Email"} inputClassname={"px-4!"} autoComplete={"email"} error={errors?.email?.message} {...register("email")} />

                                {/* Password */}
                                <CustomPasswordInput id={"signupForm1-input-password"} label={"Password"} type={showPassword ? "text" : "password"} placeholder={"••••••••"} autoComplete="current-password" inputClassname={"px-4!"} showPassword={showPassword} setShowPassword={setShowPassword} error={errors?.password?.message} password={password} {...register("password")} />

                                {/* Confirm Password */}
                                <CustomPasswordInput id={"signupForm1-input-confirmPassword"} label={"Confirm Password"} type={showPassword ? "text" : "password"} placeholder={"••••••••"} autoComplete="current-password" inputClassname={"px-4!"} showPassword={showPassword} setShowPassword={setShowPassword} error={errors?.password?.message} {...register("confirmPassword")} />

                                {/* Gender */}
                                <Controller
                                    name="gender"
                                    control={control}
                                    defaultValue=""
                                    render={({ field }) => (
                                        <>
                                            <div className="signupForm2-genderSelect-wrapper w-full h-fit flex flex-col justify-center items-start gap-2">
                                                <span className="signupForm1-genderSelect-text text-sm font-semibold tracking-tight">Gender</span>
                                                <CustomSelect
                                                    id="signupForm1-input-select-gender"
                                                    label="Select Gender"
                                                    labels={["Male", "Female", "Other"]}
                                                    className="w-full h-full"
                                                    value={field.value}
                                                    onChange={field.onChange}
                                                    error={errors?.gender?.message}
                                                />
                                            </div>
                                        </>
                                    )}
                                />

                                {/* Button */}
                                <div className="signupPage-signupForm1-button-wrapper w-full h-fit flex justify-center items-center mb-[30px]!">
                                    <div className="signupPage-signupForm1-button-container w-fit h-fit text-[var(--color-text1)] hover:text-[var(--color-text3)] cursor-pointer" onClick={() => { setFormStep(2) }}>
                                        <CircleArrowRight size={24} />
                                    </div>
                                </div>
                            </div>
                        </Activity>

                        {/* Form step 2 */}
                        <Activity mode={formStep === 2 ? 'visible' : 'hidden'}>
                            <div className="signupPage-signupForm2-container w-full h-fit space-y-6!">

                                {/* Dial Code + Country Code */}
                                <div className="signupPage-signupForm2-dialCode-countryCode-container w-full h-fit flex flex-col sm:flex-row justify-center items-center gap-2">
                                    {/* Phone Dial Code */}
                                    <Controller
                                        name="dialCode"
                                        control={control}
                                        defaultValue=""
                                        render={({ field }) => (
                                            <>
                                                <div className="signupForm2-dialCodeSelect-wrapper w-full h-fit flex flex-col justify-center items-start gap-2">
                                                    <span className="signupForm2-phoneDialCode-text text-sm font-semibold tracking-tight">Phone Dial Code</span>
                                                    <CustomSelect
                                                        id="signupForm1-input-select-phoneDialCode"
                                                        label="Select Dial Code"
                                                        labels={mobileDialCodes}
                                                        className="w-full   h-full"
                                                        value={field.value}
                                                        onChange={field.onChange}
                                                        error={errors?.countryCode?.message}
                                                    />
                                                </div>
                                            </>
                                        )}
                                    />

                                    {/* Country Code */}
                                    <Controller
                                        name="countryCode"
                                        control={control}
                                        defaultValue=""
                                        render={({ field }) => (
                                            <>
                                                <div className="signupForm2-countryCodeSelect-wrapper w-full h-fit flex flex-col justify-between items-start gap-2">
                                                    <span className="signupForm2-countryCodeSelect-text text-sm font-semibold tracking-tight">Country Code</span>
                                                    <CustomSelect
                                                        id="signupForm1-input-select-countryCode"
                                                        label="Select Country Code"
                                                        labels={mobileCountryCodes}
                                                        className="w-full h-full"
                                                        value={field.value}
                                                        onChange={field.onChange}
                                                        error={errors?.countryCode?.message}
                                                    />
                                                </div>
                                            </>
                                        )}
                                    />
                                </div>
                                {/* Phone Dial Code */}
                                {/* <Controller
                                    name="dialCode"
                                    control={control}
                                    defaultValue=""
                                    render={({ field }) => (
                                        <>
                                            <div className="signupForm2-dialCodeSelect-wrapper w-full h-fit flex flex-col justify-center items-start gap-2">
                                                <span className="signupForm2-phoneDialCode-text text-sm font-semibold tracking-tight">Phone Dial Code</span>
                                                <CustomSelect
                                                    id="signupForm1-input-select-phoneDialCode"
                                                    label="Select Dial Code"
                                                    labels={mobileDialCodes}
                                                    className="w-full h-full"
                                                    value={field.value}
                                                    onChange={field.onChange}
                                                    error={errors?.countryCode?.message}
                                                />
                                            </div>
                                        </>
                                    )}
                                /> */}

                                {/* Country Code */}
                                {/* <Controller
                                    name="countryCode"
                                    control={control}
                                    defaultValue=""
                                    render={({ field }) => (
                                        <>
                                            <div className="signupForm2-countryCodeSelect-wrapper w-full h-fit flex flex-col justify-center items-start gap-2">
                                                <span className="signupForm2-countryCodeSelect-text text-sm font-semibold tracking-tight">Country Code</span>
                                                <CustomSelect
                                                    id="signupForm1-input-select-countryCode"
                                                    label="Select Country Code"
                                                    labels={mobileCountryCodes}
                                                    className="w-full h-full"
                                                    value={field.value}
                                                    onChange={field.onChange}
                                                    error={errors?.countryCode?.message}
                                                />
                                            </div>
                                        </>
                                    )}
                                /> */}

                                {/* Phone Number */}
                                <CustomInput id={"signupForm2-input-phoneNumber"} label={"Phone Number"} type={"text"} placeholder={"Enter phone number"} inputClassname={"px-4!"} hint={"* Enter number without country code"} error={errors?.phoneNumber?.message} {...register("phoneNumber")} />

                                {/* DOB */}
                                <Controller
                                    name="dateOfBirth"
                                    control={control}
                                    // defaultValue={undefined}
                                    render={({ field }) => (
                                        <>
                                            <div className="signupForm2-dateOfBirthSelect-wrapper w-full h-fit flex flex-col justify-center items-start gap-2">
                                                <span className="signupForm2-dateOfBirthSelect-text text-sm font-semibold tracking-tight">Date of Birth</span>
                                                <CustomDatePicker
                                                    id="signupForm2-input-select-dateOfBirth"
                                                    label="Pick a date"
                                                    date={field.value}
                                                    setDate={field.onChange}
                                                    className="w-full"
                                                    max={new Date()}
                                                    hint={"* Date of birth must be above 18 years"}
                                                    error={errors?.dateOfBirth?.message}
                                                />
                                            </div>
                                        </>
                                    )}
                                />

                                {/* Button */}
                                <div className="signupPage-signupForm2-button-wrapper w-full h-fit flex justify-center items-center">
                                    <div className="signupPage-signupForm-button-container w-[200px] sm:w-[260px] h-[30px] sm:h-[40px]">
                                        <CustomButton id={"signPage-signinForm-button"} label={"Sign In"} />
                                    </div>
                                </div>

                                {/* Back Button */}
                                <div className="signupPage-signupForm2-button-wrapper w-full h-fit flex justify-center items-center mb-[30px]!">
                                    <div className="signupPage-signupForm1-button-container w-fit h-fit text-[var(--color-text1)] hover:text-[var(--color-text3)] cursor-pointer" onClick={() => { setFormStep(1) }}>
                                        <CircleArrowLeft size={24} />
                                    </div>
                                </div>
                            </div>
                        </Activity>
                    </div>
                </form>
            </div>
        </div>
    )
}
