import React from 'react'
import BrandingComponent from '../components/auth/BrandingComponent';
import { Outlet } from 'react-router';
import SignInPage from '@/components/auth/SignInPage';

export default function AuthPage() {

    // Get current year for footer
    const currentYear = new Date().getFullYear();
    const dnsDetails: { dashboard_name?: string } = {}

    return (
        <div className="authPage-container w-full min-h-[99vh] bg-gradient-to-br from-black via-zinc-800 to-zinc-700 relative">
            {/* Checker Boxes Design */}
            <div
                className="checkBoxPageDesignocontainer w-full h-full pointer-events-none absolute inset-0 opacity-30 blur-[0.3px] bg-[linear-gradient(rgba(255,255,255,0.25)_1px,transparent_2px),linear-gradient(90deg,rgba(255,255,255,0.25)_1px,transparent_2px)] bg-[size:64px_64px]" />

            {/* Radial Blur Circles */}
            <div className="brandingComponent-radialBlur-circles w-[150px] h-[100px] bg-white blur-3xl absolute top-0 left-0 z-70"></div>
            <div className="brandingComponent-radialBlur-circles w-[200px] h-[200px] bg-white blur-3xl absolute top-[20vh] left-[40vw] z-70"></div>
            <div className="brandingComponent-radialBlur-circles w-[150px] h-[100px] bg-gray-600 blur-3xl absolute bottom-0 left-0 z-70"></div>

            {/* Header */}
            {/* <div className="authPage-header-container w-full h-[50px] bg-red-400 fixed top-0 left-0 z-[99]">

            </div> */}

            {/* Main Content */}
            {/* <div className="authPage-mainContent w-full min-h-full relative"> */}
            <div className="authPage-mainContent w-full min-h-full flex justify-center items-start">
                <div className="authPage-mainContent-brnadingContainer-wrapper w-fit h-fit hidden lg:flex">
                    <BrandingComponent />
                </div>

                <div className="authPage-mainContent-authPages-wrapper bg-[var(--color-800)] w-screen lg:w-[50vw] min-h-full lg:rounded-l-4xl p-4!">
                    <Outlet />
                </div>
            </div>

            {/* Footer */}
            <div className="authPage-footer-container w-full h-[50px] px-4! fixed bottom-0 left-0 z-[99]">
                <div className="authPage-footer-texts w-full h-full flex flex-col sm:flex-row justify-center lg:justify-between items-center gap-1">
                    {/* Copy Right Text */}
                    <span className="authPage-footer-copyrightText text-[var(--color-text2)] lg:text-[var(--color-text5)] text-start text-[12px] font-normal tracking-tight">CopyRight © {currentYear} {dnsDetails?.dashboard_name || 'Banking Management App'} - All Right Reserved.</span>

                    {/* Separator */}
                    <div className="authPage-footer-separator text-[var(--color-text3)] hidden sm:inline-block lg:hidden">|</div>

                    <div className="authPage-footer-termsConditon-privacyPolicy-texts w-fit h-fir flex justify-center items-center gap-2">
                        {/* Terms & Condition Text */}
                        <span className="authPage-footer-copyrightText text-[var(--color-link1)] hover:text-[var(--color-link2)] text-start text-[12px] font-semibold tracking-tight hover:underline cursor-pointer">Terms & Condition</span>

                        {/* Separator */}
                        <div className="authPage-footer-separator text-[var(--color-text3)]">|</div>

                        {/* Terms & Condition Text */}
                        <span className="authPage-footer-privacyPolicyText text-[var(--color-link1)] hover:text-[var(--color-link2)] text-start text-[12px] font-semibold tracking-tight hover:underline cursor-pointer">Privacy Policy</span>
                    </div>
                </div>
            </div>
        </div>
    )
}
