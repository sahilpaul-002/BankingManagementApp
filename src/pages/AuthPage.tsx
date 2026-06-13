import React, { Activity, useEffect, useState } from 'react'
import BrandingComponent from '../components/auth/BrandingComponent';
import { Outlet } from 'react-router';
import FormSkeleton from "../components/common/FormSkeleton";
import { selectDnsConfigDetails, type dnsConfigDataType } from '@/redux/slice/config/configSlice';
import { useSelector } from 'react-redux';

export default function AuthPage() {
    // State to manage to display service unavailable page\
    const [showServiceUnavailablePage, setShowServiceUnavailablePage] = useState(false);

    // // Dns Config Data
    const dnsConfig: dnsConfigDataType | null = useSelector(selectDnsConfigDetails)

    // Get current year for footer
    const currentYear = new Date().getFullYear();
    const dnsDetails: { dashboard_name?: string } = {}

    return (
        <div className="authPage-container w-screen min-h-screen relative overflow-hidden text-white bg-[var(--nav-bg)]">
            {/* Gold glow top-left */}
            <div className="pointer-events-none absolute -bottom-40 -right-32 h-[40vw] w-[40vw] rounded-full bg-[var(--gold)] opacity-[0.07] blur-[160px] animate-[pulseGlow_8s_ease-in-out_infinite]" />

            {/* Header */}
            {/* <div className="authPage-header-container w-full h-[50px] bg-red-400 fixed top-0 left-0 z-[99]">

            </div> */}

            {/* Main Content */}
            <div className="authPage-mainContent w-full min-h-screen">
                <div className="authPage-brand-login-wrapper relative z-10 flex min-h-screen w-full flex-col xl:grid xl:grid-cols-[1.40fr_1fr]">
                    {/* Left Branding */}
                    <section className="authPage-mainContent-brnadingContainer-wrapper hidden xl:block">
                        <div className="authPage-mainContent-brnadingContainer h-full overflow-hidden">
                            <BrandingComponent />
                        </div>
                    </section>

                    {/* Right Login */}
                    <section className="flex min-h-screen items-center justify-center px-6 py-10 xl:px-10">
                        <div className="loginForm-container-wrapper relative w-fit h-fit rounded-xl border border-indigo-400/20 bg-[linear-gradient(180deg,#0f172a,#0b1120)] shadow-[0_0_0_1px_rgba(129,140,248,0.25),0_0_60px_rgba(99,102,241,0.30),0_0_120px_rgba(59,130,246,0.18),0_30px_100px_rgba(0,0,0,0.65)] transition-all duration-500 hover:shadow-[0_0_0_1px_rgba(129,140,248,0.35),0_0_80px_rgba(99,102,241,0.40),0_0_140px_rgba(59,130,246,0.22),0_35px_120px_rgba(0,0,0,0.7)]">
                            <Activity mode={!dnsConfig ? "visible" : "hidden"}>
                                <FormSkeleton />
                            </Activity>
                            <Activity mode={dnsConfig ? "visible" : "hidden"}>
                                <Outlet />
                                {/* Footer */}
                                <div className="authPage-footer-container w-full h-[60px] px-4! py-2! z-[99]">
                                    <div className="authPage-footer-texts w-full h-full flex flex-col justify-center lg:justify-between items-center gap-1">
                                        <div className="authPage-footer-termsConditon-privacyPolicy-texts w-fit h-fir flex justify-center items-center gap-2">
                                            {/* Terms & Condition Text */}
                                            <span className="authPage-footer-copyrightText text-[var(--color-link1)] hover:text-[var(--color-link2)] text-start text-[12px] font-semibold tracking-tight hover:underline cursor-pointer">Terms & Condition</span>

                                            {/* Separator */}
                                            <div className="authPage-footer-separator text-[var(--color-text3)]">|</div>

                                            {/* Terms & Condition Text */}
                                            <span className="authPage-footer-privacyPolicyText text-[var(--color-link1)] hover:text-[var(--color-link2)] text-start text-[12px] font-semibold tracking-tight hover:underline cursor-pointer">Privacy Policy</span>
                                        </div>

                                        {/* Separator */}
                                        <div className="authPage-footer-separator text-[var(--color-text3)] hidden">|</div>

                                        {/* Copy Right Text */}
                                        <span className="authPage-footer-copyrightText text-[var(--color-text2)] text-start text-[12px] font-normal tracking-tight">CopyRight © {currentYear} {dnsDetails?.dashboard_name || 'Banking Management App'} - All Right Reserved.</span>
                                    </div>
                                </div>
                            </Activity>
                        </div>
                    </section>
                </div>
            </div>
        </div>

    )
}
