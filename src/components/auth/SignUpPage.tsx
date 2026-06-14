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
import { useSignUpMutation } from '@/redux/features/user/userApi';

export default function SignUpPage() {
    // SignUp Api Mutation
    const [signUp, { isLoading, error, data, isSuccess, reset: resetMutation }] = useSignUpMutation()

    // Configure useNavigate
    const nav = useNavigate();

    // ---------------------------------- LOGIC TO GET COUNTRY CODES LIST ---------------------------------- \\
    // State to manage countryCodes list
    const [mobileDialCodes, setMobileDialCodes] = useState<Array<{ label: string; value: string }> | null>(null);
    const [mobileCountryCodes, setMobileCountryCodes] = useState<Array<{ label: string; value: string }> | null>(null);
    // UseState to get mobile country codes values
    useEffect(() => {
        const listMobileCountryCodes = mobileCountryCodesLists();
        const mobileDialCodesList = listMobileCountryCodes.map(item => ({
            id: item.name,
            label: item.country,
            value: item.code
        }));
        setMobileDialCodes(mobileDialCodesList);
        // console.log(mobileDialCodesList);

        const mobileCountryCodes = listMobileCountryCodes.map(item => ({
            id: item.name,
            label: item.name,
            value: item.country
        }));
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
            .min(4, "Full name must be alteast 4 characters")
            .regex(
                /^[A-Za-z0-9 .'-]+$/,
                "Full name can only contain letters, numbers, spaces, dots (.), apostrophes ('), and hyphens (-)"),
        email: z
            .string()
            .min(1, "Email is required")
            .email("Invalid email")
            .regex(
                /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                'Invalid email format'
            ),
        password: z.string()
            .min(8, 'Password must be atleast of 8 characters')
            .regex(/[A-Z]/, 'Password must contain a uppercase character')
            .regex(/[a-z]/, 'Password must contain a lowercase character')
            .regex(/\d/, 'Password must contain a digit')
            .regex(/[!@#$%^&*]/, 'Password must contain special characters'),
        confirmPassword: z
            .string()
            .min(1, "Confirm password is required"),
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
        message: ('Password do not match'),
        path: ['confirmPassword'],
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
        mode: 'onTouched',
        reValidateMode: 'onChange',
    })

    const onValid: SubmitHandler<SignupFormData> = async (formData) => {
        console.log(formData);
        try {
            const signUpResponse = await signUp(formData).unwrap()
            console.log('Success:', signUpResponse)
            console.log(data);
        }
        catch (error) {
            console.log('Error:', error)
        }
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
        <div className="signupPage-wrapper w-full h-fit flex justify-center items-center px-6! xl:px-10! py-4!">
            <div className="signupPage-containerw-full h-fit flex flex-col justify-start items-center gap-4">
                {/* Logo */}
                <div className="signinPage-logo bg-amber-100 w-[100px] h-[60px] xl:w-[120px] xl:h-[50px]"></div>

                {/* Welcome Text */}
                <span className="signupPage-text text-2xl font-bold tracking-normal text-[var(--gold)]">
                    Create Account
                </span>

                {/* Signin Link */}
                <div className="signinPage-signinForm-createNewAccount-container w-full h-fit flex justify-center items-center">
                    <div className="signinPage-signinForm-createNewAccount w-fit h-fit">
                        <span className="signinPage-singinForm-createAccount-text me-1! text-[12px] sm:text-[14px] text-[var(--color-text3)] tracking-normal inline-block">Already have an account -</span>
                        <span className="signinPage-singinForm-createAccount-text ms-1! text-[12px] sm:text-[14px] text-[var(--color-link1)] hover:text-[var(--color-link2)] font-semibold tracking-normal hover:underline! inline-block cursor-pointer">
                            <Link to="/">Sign In</Link>
                        </span>
                    </div>
                </div>

                {/* Signup Form */}
                <form className="signupForm-signupForm-wrapper w-full h-fit" noValidate onSubmit={onSignupFormSubmit}>
                    <div className="signupPage-signupForm-container w-full h-full">
                        {/* Form step 1*/}
                        <Activity mode={formStep === 1 ? 'visible' : 'hidden'}>
                            <div className="signupPage-signupForm1-container w-full h-fit space-y-2!">
                                {/* Full Name */}
                                <CustomInput id={"signupForm1-input-email"} label={"Full Name"} type={"text"} placeholder={"Enter full name"} inputClassname={"px-4!"} autoFocus={true} error={errors?.fullName?.message} {...register("fullName")} />

                                {/* Email */}
                                <CustomInput id={"signupForm1-input-email"} label={"Email"} type={"email"} placeholder={"Enter Email"} inputClassname={"px-4!"} autoComplete={"email"} error={errors?.email?.message} {...register("email")} />

                                {/* Password */}
                                <CustomPasswordInput id={"signupForm1-input-password"} label={"Password"} type={showPassword ? "text" : "password"} placeholder={"••••••••"} autoComplete="current-password" inputClassname={"px-4!"} showPassword={showPassword} setShowPassword={setShowPassword} error={errors?.password?.message} password={password} {...register("password")} />

                                {/* Confirm Password */}
                                <CustomPasswordInput id={"signupForm1-input-confirmPassword"} label={"Confirm Password"} type={showPassword ? "text" : "password"} placeholder={"••••••••"} autoComplete="current-password" inputClassname={"px-4!"} showPassword={showPassword} setShowPassword={setShowPassword} error={errors?.password?.message} {...register("confirmPassword")} />

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
                                                    className="w-full h-full"
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
                                />

                                {/* Phone Number */}
                                <CustomInput id={"signupForm2-input-phoneNumber"} label={"Phone Number"} type={"text"} placeholder={"Enter phone number"} inputClassname={"px-4!"} hint={"* Enter number without country code"} error={errors?.phoneNumber?.message} {...register("phoneNumber")} />

                                {/* Direction buttons */}
                                <div className="directionButtons-container w-fit h-fit m-auto! flex justify-center items-center gap-2">
                                    {/* Back Button */}
                                    <div className="signupPage-signupForm2-button-wrapper w-full h-fit flex justify-center items-center mb-[30px]!">
                                        <div className="signupPage-signupForm1-button-container w-fit h-fit text-[var(--color-text1)] hover:text-[var(--color-text3)] cursor-pointer" onClick={() => { setFormStep(1) }}>
                                            <CircleArrowLeft size={24} />
                                        </div>
                                    </div>

                                    {/* Front Button */}
                                    <div className="signupPage-signupForm1-button-wrapper w-full h-fit flex justify-center items-center mb-[30px]!">
                                        <div className="signupPage-signupForm1-button-container w-fit h-fit text-[var(--color-text1)] hover:text-[var(--color-text3)] cursor-pointer" onClick={() => { setFormStep(3) }}>
                                            <CircleArrowRight size={24} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Activity>

                        {/* Form step 3 */}
                        <Activity mode={formStep === 3 ? 'visible' : 'hidden'}>
                            <div className="signupPage-signupForm2-container w-full h-fit space-y-6!">

                                {/* Gender */}
                                <Controller
                                    name="gender"
                                    control={control}
                                    defaultValue=""
                                    render={({ field }) => (
                                        <>
                                            <div className="signupForm2-genderSelect-wrapper w-full h-fit flex flex-col justify-center items-start gap-2">
                                                <span className="signupForm1-genderSelect-text text-sm font-semibold tracking-normal">Gender</span>
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

                                {/* DOB */}
                                <Controller
                                    name="dateOfBirth"
                                    control={control}
                                    // defaultValue={undefined}
                                    render={({ field }) => (
                                        <>
                                            <div className="signupForm2-dateOfBirthSelect-wrapper w-full h-fit flex flex-col justify-center items-start gap-2">
                                                <span className="signupForm2-dateOfBirthSelect-text text-sm font-semibold tracking-normal">Date of Birth</span>
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
                                <div className="signupPage-signupForm2-button-wrapper w-full h-fit flex justify-center items-center mt-5!">
                                    <div className="signupPage-signupForm-button-container w-[200px] sm:w-[260px] h-[30px] sm:h-[40px]">
                                        <CustomButton id={"signPage-signinForm-button"} label={"Sign Up"} variant={"navy"} />
                                    </div>
                                </div>

                                {/* Back Button */}
                                <div className="signupPage-signupForm2-button-wrapper w-full h-fit flex justify-center items-center mb-[30px]!">
                                    <div className="signupPage-signupForm1-button-container w-fit h-fit text-[var(--color-text1)] hover:text-[var(--color-text3)] cursor-pointer" onClick={() => { setFormStep(2) }}>
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
