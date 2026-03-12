import React from 'react'
import BrandingComponent from '../components/auth/BrandingComponent';
import { Outlet } from 'react-router';

export default function AuthPage() {

    // Get current year for footer
    const currentYear = new Date().getFullYear();
    const dnsDetails: { dashboard_name?: string } = {}

    return (
        <div className="authPage-container w-full h-full ">
            {/* Header */}
            {/* <div className="authPage-header-container w-full h-[50px] bg-red-400 fixed top-0 left-0 z-[99]">

            </div> */}

            {/* Main Content */}
            <div className="authPage-mainContent w-full h-full flex justify-center items-center relative">
                <BrandingComponent />
                
                <div className="authPage-mainContent-authPages-wrapper absolute top-0 right-0 z-90">
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
                        <span className="authPage-footer-copyrightText text-blue-800 hover:text-blue-900 text-start text-[12px] font-semibold tracking-tight hover:underline cursor-pointer">Terms & Condition</span>

                        {/* Separator */}
                        <div className="authPage-footer-separator text-[var(--color-text3)]">|</div>

                        {/* Terms & Condition Text */}
                        <span className="authPage-footer-privacyPolicyText text-blue-800 hover:text-blue-900 text-start text-[12px] font-semibold tracking-tight hover:underline cursor-pointer">Privacy Policy</span>
                    </div>
                </div>
            </div>
        </div>
    )
}
