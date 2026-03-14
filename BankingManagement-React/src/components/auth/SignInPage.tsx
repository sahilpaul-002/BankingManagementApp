import React from 'react'
import CustomInput from '../common/CustomInput'

export default function SignInPage() {
  return (
    // <div className="signinPage-wrapper bg-[var(--color-800)] w-[100vw] lg:w-[56vw] h-[100vh] lg:rounded-l-4xl">
    <div className="signinPage-wrapper bg-amber-200 w-full h-full px-0! lg:px-20! py-2! flex justify-center items-center">
        <div className="signinPage-container bg-red-300 w-[80vw] md:w-[50vw] h-[80vh] lg:w-full lg:h-full flex flex-col justify-start items-center gap-4">
          {/* Welcome Text */}
          <span className="signinPage-text w-fit h-fit bg-green-300 text-[3vw] text-center xl:text-[3.6vw] text-[var(--color-text1)] font-semibold tracking-tight">
            Welcome
          </span>

          {/* Logo */}
          <div className="signinPage-logo w-[160px] h-[100px] bg-red-500"></div>

          {/* Signin Form */}
          <div className="signinPage-signinForm-container w-full h-fit">
            <CustomInput />
          </div>
        </div>
    </div>
  )
}
