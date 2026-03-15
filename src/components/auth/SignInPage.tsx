import React, { useState } from 'react'
import CustomInput from '../common/CustomInput'
import CustomPasswordInput from '../common/CustomPasswordInput'

export default function SignInPage() {
  // State to manage the password visibility
  const [showPassword, setShowPassword] = useState(false);
  return (
    // <div className="signinPage-wrapper bg-[var(--color-800)] w-[100vw] lg:w-[56vw] h-[100vh] lg:rounded-l-4xl">
    <div className="signinPage-wrapper w-full h-full px-0! lg:px-20! py-2! flex justify-center items-center">
        <div className="signinPage-container w-[80vw] md:w-[50vw] h-[80vh] lg:w-full lg:h-full flex flex-col justify-start items-center gap-4">
          {/* Welcome Text */}
          <span className="signinPage-text w-fit h-fit text-[3vw] text-center xl:text-[3.6vw] text-[var(--color-text1)] font-semibold tracking-tight">
            Welcome
          </span>

          {/* Logo */}
          <div className="signinPage-logo w-[160px] h-[100px] bg-red-500"></div>

          {/* Signin Form */}
          <div className="signinPage-signinForm-container w-full h-fit space-y-8!">
            <CustomInput id={"signinForm-input-email"} label={"Email"} type={"email"} placeholder={"Enter Email"} inputClassname={"px-4!"} autoFocus={true} autoComplete={"email"}/>
            <CustomPasswordInput id={"signinForm-input-password"} label={"Password"} type={showPassword ? "text" : "password"} placeholder={"••••••••"} autoComplete="current-password" inputClassname={"px-4!"} showPassword={showPassword} setShowPassword={setShowPassword}/>
          </div>
        </div>
    </div>
  )
}
