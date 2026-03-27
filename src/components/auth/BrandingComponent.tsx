import React from 'react'
import Card from '../common/Card'
import { selectDnsConfigDetails, type DnsConfigData } from '@/redux/slice/config/configSlice'
import { useSelector } from 'react-redux'

export default function BrandingComponent() {
    const dnsConfig: DnsConfigData | null = useSelector(selectDnsConfigDetails)
    
    return (
        <div className="brandingComponent-container w-full min-h-screen text-white">
            {/* Main Branding Component */}
            <div className="brandingComponent-mainBrandingContainer  w-full h-full px-4! py-6! z-90">
                <div className="brandComponent-mainBrandingContainer-brandingTexts w-full h-fit flex flex-col justify-center items-center gap-10">
                    {/* Brand Texts */}
                    <div className="brandComponent-mainBrandingContainer-brandingText-brnadName w-fit h-fit">
                        <h1 className='w-fit h-fit text-[var(--color-text6)] text-[3vw] text-center xl:text-[3.6vw] font-semibold tracking-tight'>{dnsConfig?.dashboard_name || "Banking Management"}</h1>
                    </div>
                    <div className="brandComponent-mainBrandingContainer-brandingText-brnadSlogans w-fit h-fit flex flex-col justify-center items-center gap-1">
                        <span className='w-fit h-fit text-[var(--color-text5)] text-[1.3vw] text-center xl:text-[1.5vw] font-semibold tracking-tight'>
                            {dnsConfig?.slogan_line_1 || "Banking Management"}
                        </span>
                        <span className='w-fit h-fit text-[var(--color-text5)] text-[1.3vw] text-center xl:text-[1.5vw] font-semibold tracking-tight'>
                            {dnsConfig?.slogan_line_2 || "Banking Management"}
                        </span>
                    </div>

                    {/* Cards */}
                    <div className="brandComponent-mainBrandingContainer-cardsContainer w-full xl:w-[40vw] h-[60vh] relative">
                        <div className="brandComponent-mainBrandingContainer-card1 w-fit h-fit -skew-6 absolute bottom-10 left-0">
                            <Card />
                        </div>
                        <div className="brandComponent-mainBrandingContainer-card2 w-fit h-fit skew-12 absolute top-10 right-10 z-80">
                            <Card />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
