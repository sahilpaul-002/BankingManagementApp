import React, { useState } from 'react'
import CustomInput from '../common/CustomInput'
import CustomPasswordInput from '../common/CustomPasswordInput'
import CustomButton from '../common/CustomButton';
import { Link } from 'react-router';

export default function SignInPage() {
  // State to manage the password visibility
  const [showPassword, setShowPassword] = useState<boolean>(false);

  return (
    <div className="signinPage-wrapper w-full min-h-[95.5vh] flex justify-center items- center px-0! lg:px-20! py-2!">
      <div className="signinPage-container w-[80vw] md:w-[50vw] h-[80vh] lg:w-full lg:h-full flex flex-col justify-start items-center gap-4">
        {/* Welcome Text */}
        <span className="signinPage-text w-fit h-fit text-[3vw] text-center xl:text-[3.6vw] text-[var(--color-text1)] font-semibold tracking-tight">
          Welcome
        </span>

        {/* Logo */}
        <div className="signinPage-logo bg-amber-300 w-[160px] h-[100px]"></div>

        {/* Signin Form */}
        <div className="signinPage-signinForm-container w-full h-fit space-y-8!">
          {/* Email */}
          <CustomInput id={"signinForm-input-email"} label={"Email"} type={"email"} placeholder={"Enter Email"} inputClassname={"px-4!"} autoFocus={true} autoComplete={"email"} />

          <div className="signinPage-signinForm-password-forgotPassword-container w-full h-fit flex flex-col justify-center items-end gap-1">
            {/* Password */}
            <CustomPasswordInput id={"signinForm-input-password"} label={"Password"} type={showPassword ? "text" : "password"} placeholder={"••••••••"} autoComplete="current-password" inputClassname={"px-4!"} showPassword={showPassword} setShowPassword={setShowPassword} />

            {/* Forgot Password */}
            <div className="signinPage-signinForm-forgotPassword-container">
              <span className="signinPage-singinForm-createAccount-text me-1! text-[12px] sm:text-[14px] text-[var(--color-link1)] hover:text-[var(--color-link2)] font-semibold tracking-tight hover:underline! cursor-pointer">Forgot Password ?</span>
            </div>
          </div>

          {/* Button */}
          <div className="signinPage-signinForm-button-wrapper w-full h-fit flex justify-center items-center">
            <div className="signinPage-signinForm-button-container w-[200px] sm:w-[260px] h-[30px] sm:h-[40px]">
              <CustomButton id={"signPage-signinForm-button"} label={"Sign In"} />
            </div>
          </div>

          {/* Create New Account */}
          <div className="signinPage-signinForm-createNewAccount-container w-full h-fit flex justify-center items-center">
            <div className="signinPage-signinForm-createNewAccount w-fit h-fit">
              <span className="signinPage-singinForm-createAccount-text me-1! text-[12px] sm:text-[14px] text-[var(--color-text3)] tracking-tight inline-block">Create a new account -</span>
              <span className="signinPage-singinForm-createAccount-text ms-1! text-[12px] sm:text-[14px] text-[var(--color-link1)] hover:text-[var(--color-link2)] font-semibold tracking-tight hover:underline! inline-block cursor-pointer">
                <Link to="/signup">Sign Up</Link>
                </span>
            </div>
          </div>
        </div>


      </div>
    </div>
  )
}
