import React, { Activity, useEffect, useState } from 'react'
import CustomInput from '../common/CustomInputComponent'
import CustomPasswordInput from '../common/CustomPasswordInputComponent'
import CustomButton from '../common/CustomButtonComponent';
import { Link, useNavigate } from 'react-router';
import z from 'zod';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSignInMutation } from '@/redux/features/user/userApi';
import { toast } from 'react-toastify';
import ShowInConsole from '@/utils/ShowInConsole';

export default function SignInComponent() {
  // Restore email in session storage
  useEffect(() => {
    sessionStorage.removeItem("userEmail")
  }, []);

  // Configure useNavigate
  const navigate = useNavigate();

  // State to manage the password visibility
  const [showPassword, setShowPassword] = useState<boolean>(false);

  // ------------------------------------- ZOD + REACT HOOK FORM ------------------------------------- \\
  // Configure Zod Validation
  const signInFormValidationSchema = z.object({
    email: z
      .string()
      .min(1, "Email required")
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
  });
  type SigninFormData = z.infer<typeof signInFormValidationSchema>

  // React Hook Form Validation
  const {
    register,
    handleSubmit,
    watch,
    control,
    formState: { errors },
    reset: resetReactHookForm
  } = useForm<SigninFormData>({
    resolver: zodResolver(signInFormValidationSchema),
    mode: 'onTouched',
    reValidateMode: 'onChange',
  })

  // SignIn Api Mutation
  const [signIn, { isLoading }] = useSignInMutation()
  // Function to handle form submission
  const onSigninFormSubmit: SubmitHandler<SigninFormData> = async (formData) => {
    const { email, password } = formData
    try {
      let redirectionStep: "SEND-VERIFY-EMAIL" | "VERIFY-EMAIL" | "SELECT-2FA" | "SEND-EMAIL-OTP" | "VERIFY-TOTP" | "SMS-OTP" | null = null;
      const result = await signIn({ email, password }).unwrap()

      ShowInConsole("Sign in response:", result);
      const successMessage = result?.message || ""
      const normalizedMessage = successMessage.toLowerCase();

      switch (true) {
        case normalizedMessage.includes("user login successfull, email verification code sent to the email"):
          toast.success("Sign in successful! Redirecting to email verification.");
          redirectionStep = "VERIFY-EMAIL";
          break;

        case normalizedMessage.includes("user login successfull, but failed to send email verification code"):
          toast.success("Sign in successful but failed to generate email verification code.");
          redirectionStep = "SEND-VERIFY-EMAIL";
          break;

        case normalizedMessage.includes("user login successfull, 2fa not enabled"):
          toast.success("Sign in successful! Redirecting to 2-factor-authentication method selection.");
          redirectionStep = "SELECT-2FA";
          break;

        case normalizedMessage.includes("user login successful, 2fa enabled"):
          if (result?.data?.twoFaType === "EMAIL-OTP") {
            toast.success("Sign in successful! Redirecting to 2-factor-authentication using email.");
            redirectionStep = "SEND-EMAIL-OTP";
          }
          else if (result?.data?.twoFaType === "TOTP") {
            toast.success("Sign in successful! Redirecting to 2-factor-authentication using authenticator.");
            redirectionStep = "VERIFY-TOTP";
          }
          else {
            toast.success("Sign in successful! Redirecting to 2-factor-authentication using SMS.");
            redirectionStep = "SMS-OTP";
          }
          break;

        default:
          toast.error("Sign in service is facing issue. Please try again later. If issue persist please contact support.");
          redirectionStep = null;
          break;
      }

      if (redirectionStep === "SEND-VERIFY-EMAIL") {
        setTimeout(() => {
          navigate("/sendEmailVerificationCode");
        }, 500)
      }
      else if (redirectionStep === "VERIFY-EMAIL") {
        setTimeout(() => {
          navigate("/verifyEmail");
        }, 500)
      }
      else if (redirectionStep === "SELECT-2FA") {
        setTimeout(() => {
          navigate("/select2FaMethod");
        }, 500)
      }
      else if (redirectionStep === "SEND-EMAIL-OTP") {
        setTimeout(() => {
          navigate("/send2FaCode/emailOtp");
        }, 500)
      }
      else if (redirectionStep === "VERIFY-TOTP") {
        setTimeout(() => {
          navigate("/verify2FaCode/totp");
        }, 500)
      }
    }
    catch (err: any) {
      ShowInConsole('Sign in error:', err)

      const errorMessage =
        err?.data?.message ||
        err?.message ||
        "Sign in service is facing issue. Please try again later. If issue persist please contact support.";

      const normalizedMessage = errorMessage.toLowerCase();

      switch (true) {
        case normalizedMessage.includes("user does not exist"):
          toast.error("No account found with this email. Please check your email or contact support.");
          break;

        case normalizedMessage.includes("invalid credentials"):
          toast.error("Sign in service failed due to invalid credentials.");
          break;

        case normalizedMessage.includes("user configuration does not match"):
          toast.error("Account is not authorized to access this application. Please check your email or contact support.");
          break;

        default:
          toast.error("Sign in service is facing issue. Please try again later. If issue persist please contact support.");
          break;
      }
    }
  };

  // Formdata Watch
  const password = watch("password");
  // ------------------------------------ XXXXXXXXXXXXXXXXXXXXXX ------------------------------------ \\

  return (
    <div className="signinPage-wrapper w-full h-fit flex justify-center items-center px-16! lg:px-13! xl:px-14! py-2!">
      <div className="signinPage-container w-full h-fit flex flex-col justify-start items-center gap-4">
        {/* Logo */}
        <div className="signinPage-logo bg-amber-100 w-[100px] h-[60px] xl:w-[120px] xl:h-[50px]"></div>

        {/* Sign In Text */}
        <div className="signinPage-text w-full h-fit flex flex-col items-center text-center gap-2">
          <h2 className="signinText text-2xl font-bold tracking-normal text-[var(--gold)]">
            Sign in
          </h2>
          {/* <p className="text-sm text-[var(--nav-text)]"> */}
          <p className="text-sm text-[var(--line-strong)]">
            Welcome back. Access your crypto & fiat wallet.
          </p>
        </div>

        {/* Signin Form */}
        <form className='signinPage-signinForm-wrapper w-full h-fit' onSubmit={handleSubmit(onSigninFormSubmit)}>
          <div className="signinPage-signinForm-container w-full h-fit space-y-2!">
            {/* Email */}
            <CustomInput id={"signinForm-input-email"} label={"Email"} type={"email"} placeholder={"Enter Email"} fieldLabelClassname={"text-[var(--line-strong)]"} inputClassname={"px-4! text-[var(--line-strong)]"} autoFocus={true} autoComplete={"email"} error={errors?.email?.message} {...register("email")} />

            <div className="signinPage-signinForm-password-forgotPassword-container w-full h-fit flex flex-col justify-center items-end gap-1">
              {/* Password */}
              <CustomPasswordInput id={"signinForm-input-password"} label={"Password"} type={showPassword ? "text" : "password"} placeholder={"Enter Password"} autoComplete="current-password" fieldLabelClassname={"text-[var(--line-strong)]"} inputClassname={"px-4! text-[var(--line-strong)]"} showValidationRules={false} showPassword={showPassword} setShowPassword={setShowPassword} password={password} error={errors?.password?.message} {...register("password")} />

              {/* Forgot Password */}
              <div className="signinPage-signinForm-forgotPassword-container">
                <Link to="/sendResetPasswordCode" className="signinPage-singinForm-createAccount-text me-1! text-sm text-[var(--color-link1)] hover:text-[var(--color-link2)] font-semibold tracking-normal hover:underline! cursor-pointer">Forgot Password ?</Link>
              </div>
            </div>

            {/* Button */}
            <div className="signinPage-signinForm-button-wrapper w-full h-fit flex justify-center items-center mt-6!">
              <div className="signinPage-signinForm-button-container w-[200px] sm:w-[260px] h-[30px] sm:h-[40px]">
                <CustomButton id={"signPage-signinForm-button"} label={"Sign In"} type="submit" showButtonLoader={isLoading} variant={"navy"} />
              </div>
            </div>

            {/* Create New Account */}
            <div className="signinPage-signinForm-createNewAccount-container w-full h-fit flex justify-center items-center">
              <div className="signinPage-signinForm-createNewAccount w-fit h-fit">
                <span className="signinPage-singinForm-createAccount-text me-1! text-sm text-[var(--line-strong)] tracking-normal inline-block">Create a new account -</span>
                <span className="signinPage-singinForm-createAccount-text ms-1! text-sm text-[var(--color-link1)] hover:text-[var(--color-link2)] font-semibold tracking-normal hover:underline! inline-block cursor-pointer">
                  <Link to="/signup">Sign Up</Link>
                </span>
              </div>
            </div>
          </div>
        </form >
      </div>
    </div >
  )
}
