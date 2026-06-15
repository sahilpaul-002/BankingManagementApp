import React, { Activity, useEffect, useState } from 'react'
import BrandingComponent from '../components/auth/BrandingComponent';
import { Outlet } from 'react-router';
import FormSkeleton from "../components/common/FormSkeletonComponent";
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
            {/* Gold glow bottom-left */}
            <div className="pointer-events-none absolute -bottom-40 -right-32 h-[40vw] w-[40vw] rounded-full bg-[var(--gold)] opacity-[0.07] blur-[160px] animate-[pulseGlow_8s_ease-in-out_infinite]" />

            {/* Header */}
            {/* <div className="authPage-header-container w-full h-[50px] bg-red-400 fixed top-0 left-0 z-[99]">

            </div> */}

            {/* Main Content */}
            <div className="authPage-mainContent w-full min-h-screen">
                <div className="authPage-brand-login-wrapper relative z-10 flex min-h-screen w-full flex-col xl:grid xl:grid-cols-[1.40fr_1fr]">
                    {/* Left Branding */}
                    <section className="authPage-mainContent-brnadingContainer-wrapper hidden xl:block">
                        <div className="authPage-mainContent-brnadingContainer h-full">
                            <BrandingComponent />
                        </div>
                    </section>

                    {/* Right Login */}
                    <section className="authPage-mainContent-loginContainer-wrapper flex h-screen items-center justify-center px-6! lg:px-20! py-12!">
                        <div className="authForm-container-wrapper relative w-fit xl:w-full h-full rounded-xl border-2 border-[#C1A050]/50 bg-[linear-gradient(180deg,#0f172a,#0b1120)] ring-1 ring-[#C0C0C0]/20 shadow-[0_0_0_1px_rgba(193,160,80,0.25), 0_0_60px_rgba(192,192,192,0.18), 0_0_120px_rgba(193,160,80,0.20), 0_30px_100px_rgba(0,0,0,0.65)] transition-all duration-500 hover:shadow-[0_0_0_1px_rgba(203,171,88,0.35), 0_0_80px_rgba(192,192,192,0.22), 0_0_140px_rgba(187,152,71,0.24), 0_35px_120px_rgba(0,0,0,0.70)]" >
                            <Activity mode={!dnsConfig ? "visible" : "hidden"}>
                                <FormSkeleton />
                            </Activity>
                            <Activity mode={dnsConfig ? "visible" : "hidden"}>
                                <div className="authForm-container w-full h-full flex flex-col justify-between items-center py-4!">
                                    <Outlet />
                                    {/* Footer */}
                                    <div className="authPage-footer-container w-full h-fit px-4!">
                                        <div className="authPage-footer-texts w-full h-full flex flex-col justify-center items-center">
                                            <div className="authPage-footer-termsConditon-privacyPolicy-texts w-fit h-fit flex justify-center items-center gap-2">
                                                {/* Terms & Condition Text */}
                                                <span className="authPage-footer-copyrightText text-[var(--color-link1)] hover:text-[var(--color-link2)] text-start text-[12px] font-semibold tracking-normal hover:underline cursor-pointer">Terms & Condition</span>

                                                {/* Separator */}
                                                <div className="authPage-footer-separator text-[var(--gold)]">|</div>

                                                {/* Terms & Condition Text */}
                                                <span className="authPage-footer-privacyPolicyText text-[var(--color-link1)] hover:text-[var(--color-link2)] text-start text-[12px] font-semibold tracking-normal hover:underline cursor-pointer">Privacy Policy</span>
                                            </div>

                                            {/* Separator */}
                                            <div className="authPage-footer-separator text-[var(--gold))] hidden">|</div>

                                            {/* Copy Right Text */}
                                            <span className="authPage-footer-copyrightText text-[var(--nav-text-strong)] text-center text-[12px] font-normal tracking-normal">CopyRight © {currentYear} {dnsDetails?.dashboard_name || 'Banking Management App'} - All Right Reserved.</span>
                                        </div>
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
