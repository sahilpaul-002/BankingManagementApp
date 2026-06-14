import React, { Activity, useState } from 'react'
import CustomInput from '../common/CustomInput'
import CustomPasswordInput from '../common/CustomPasswordInput'
import CustomButton from '../common/CustomButton';
import { Link } from 'react-router';
import z from 'zod';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSignInMutation } from '@/redux/features/user/userApi';

export default function SignInPage() {
  // State to manage the password visibility
  const [showPassword, setShowPassword] = useState<boolean>(false);

  // SignIn Api Mutation
  const [signIn, { isLoading, error, data, isSuccess, reset: resetMutation }] = useSignInMutation()

  // ------------------------------------- ZOD + REACT HOOK FORM ------------------------------------- \\
  // Configure Zod Validation
  const signInFormValidationSchema = z.object({
    email: z
      .string()
      .min(1, "Email required")
      .email("Invalid email"),
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

  const onSigninFormSubmit: SubmitHandler<SigninFormData> = async (formData) => {
    // console.log(formData);
    const { email, password } = formData
    try {
      const signInResponse = await signIn({ email, password }).unwrap()
      console.log('Success:', signInResponse)
      console.log(data);
    } catch (err) {
      console.log('Error:', err)
    }
  };

  // Formdata Watch
  const password = watch("password");
  // ------------------------------------ XXXXXXXXXXXXXXXXXXXXXX ------------------------------------ \\

  return (
    <div className="signinPage-wrapper w-full h-fit flex justify-center items-center px-6! xl:px-10! py-2!">
      <div className="signinPage-container w-full h-full flex flex-col justify-start items-center gap-4">
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
              <CustomPasswordInput id={"signinForm-input-password"} label={"Password"} type={showPassword ? "text" : "password"} placeholder={"••••••••"} autoComplete="current-password" inputClassname={"px-4!"} showPassword={showPassword} setShowPassword={setShowPassword} password={password} error={errors?.password?.message} {...register("password")} />

              {/* Forgot Password */}
              <div className="signinPage-signinForm-forgotPassword-container">
                <span className="signinPage-singinForm-createAccount-text me-1! text-[12px] sm:text-[14px] text-[var(--color-link1)] hover:text-[var(--color-link2)] font-semibold tracking-normal hover:underline! cursor-pointer">Forgot Password ?</span>
              </div>
            </div>

            {/* Button */}
            <div className="signinPage-signinForm-button-wrapper w-full h-fit flex justify-center items-center mt-6!">
              <div className="signinPage-signinForm-button-container w-[200px] sm:w-[260px] h-[30px] sm:h-[40px]">
                <CustomButton id={"signPage-signinForm-button"} label={"Sign In"} showButtonLoader={isLoading} variant={"navy"} />
              </div>
            </div>

            {/* Create New Account */}
            <div className="signinPage-signinForm-createNewAccount-container w-full h-fit flex justify-center items-center">
              <div className="signinPage-signinForm-createNewAccount w-fit h-fit">
                <span className="signinPage-singinForm-createAccount-text me-1! text-[12px] sm:text-[14px] text-[var(--color-text3)] tracking-normal inline-block">Create a new account -</span>
                <span className="signinPage-singinForm-createAccount-text ms-1! text-[12px] sm:text-[14px] text-[var(--color-link1)] hover:text-[var(--color-link2)] font-semibold tracking-normal hover:underline! inline-block cursor-pointer">
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
