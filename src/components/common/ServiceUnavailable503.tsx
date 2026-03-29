import { useEffect, useState } from "react";
import CustomButton from "./CustomButton";
import { useGetDnsConfigQuery, useLazyGetDnsConfigQuery } from "@/redux/features/config/configApi";
import { useNavigate } from "react-router";

type PulseRing = {
    delay: string;
    size: string;
    opacity: string;
};

const PULSE_RINGS: PulseRing[] = [
    { delay: "0s", size: "w-24 h-24", opacity: "opacity-20" },
    { delay: "0.6s", size: "w-36 h-36", opacity: "opacity-15" },
    { delay: "1.2s", size: "w-48 h-48", opacity: "opacity-10" },
];

const GEAR_ANGLES: number[] = [0, 45, 90, 135, 180, 225, 270, 315];

export default function ServiceUnavailable503() {

    // Configure useNavigate
    const navigate = useNavigate();

    // Dns Config Query
    const [fetchDnsConfigQueryTrigger, { isSuccess, data, isError, error }] = useLazyGetDnsConfigQuery()
    // Function to call dnsConfig api on try again click
    const onTryAgainClick = (): void => {
        fetchDnsConfigQueryTrigger({
            domainName: 'business.banking-management.com'
        });

        // Check Dns Config Status
        if (isSuccess) {
            console.log("Dns data: ", data);
            navigate("/");
        }
        if (isError) {
            console.error(error);
        }
    }

    // State to manage the animated dots in subheading
    const [dots, setDots] = useState<number>(0);

    // State to manage the recovery progress bar value
    const [progress, setProgress] = useState<number>(12);

    // ------------------------------------- ANIMATION EFFECTS ------------------------------------- \\
    useEffect(() => {
        const dotInterval = setInterval(() => {
            setDots((d) => (d + 1) % 4);
        }, 500);

        const progressInterval = setInterval(() => {
            setProgress((p) => {
                const next = p + Math.random() * 3;
                return next > 72 ? 72 : next;
            });
        }, 800);

        return () => {
            clearInterval(dotInterval);
            clearInterval(progressInterval);
        };
    }, []);
    // ------------------------------------ XXXXXXXXXXXXXXXXXXXXXX ------------------------------------ \\

    return (
        <div className="serviceUnavailable503-wrapper w-full min-h-screen flex justify-center items-center overflow-hidden relative bg-stone-50">

            {/* Grid Background */}
            <div
                className="serviceUnavailable503-gridBg absolute inset-0 opacity-[0.03] pointer-events-none"
                style={{
                    backgroundImage:
                        "linear-gradient(#78716c 1px, transparent 1px), linear-gradient(90deg, #78716c 1px, transparent 1px)",
                    backgroundSize: "40px 40px",
                }}
            />

            {/* Top Accent Bar */}
            <div className="serviceUnavailable503-accentBar absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-400 via-rose-500 to-red-600" />

            {/* Main Container */}
            <div className="serviceUnavailable503-container relative z-10 w-[85vw] sm:w-[60vw] md:w-[50vw] lg:w-[440px] h-fit flex flex-col justify-start items-center text-center gap-0">

                {/* Gear Icon */}
                <div className="serviceUnavailable503-iconWrapper relative flex items-center justify-center mb-10!">

                    {/* Pulse Rings */}
                    {PULSE_RINGS.map((ring: PulseRing, i: number) => (
                        <span
                            key={i}
                            className={`serviceUnavailable503-pulseRing absolute ${ring.size} ${ring.opacity} rounded-full bg-red-400`}
                            style={{
                                animation: `ping 2.4s cubic-bezier(0,0,0.2,1) infinite`,
                                animationDelay: ring.delay,
                            }}
                        />
                    ))}

                    {/* Gear Icon Box */}
                    <div className="serviceUnavailable503-iconBox relative z-10 w-20 h-20 rounded-2xl bg-white border border-stone-200 shadow-lg shadow-stone-200/60 flex items-center justify-center">
                        <svg width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="22" cy="22" r="11" stroke="#ef4444" strokeWidth="2.4" fill="none" />
                            <circle cx="22" cy="22" r="4.5" fill="#ef4444" />
                            {GEAR_ANGLES.map((angle: number, i: number) => {
                                const rad = (angle * Math.PI) / 180;
                                return (
                                    <line
                                        key={i}
                                        x1={22 + 11 * Math.cos(rad)} y1={22 + 11 * Math.sin(rad)}
                                        x2={22 + 15 * Math.cos(rad)} y2={22 + 15 * Math.sin(rad)}
                                        stroke="#ef4444" strokeWidth="2.4" strokeLinecap="round"
                                    />
                                );
                            })}
                        </svg>
                    </div>
                </div>

                {/* Error Badge */}
                <div className="serviceUnavailable503-badge inline-flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold tracking-widest uppercase px-4 py-1.5 rounded-full mb-5!">
                    <span className="serviceUnavailable503-badgeDot w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse inline-block" />
                    Error 503
                </div>

                {/* Heading */}
                <h1
                    className="serviceUnavailable503-heading w-fit h-fit text-center text-[28px] sm:text-[5vw] md:text-[3.5vw] lg:text-[2.4vw] text-[var(--color-text1)] font-black tracking-tight leading-tight mb-3!"
                    style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}
                >
                    Service Unavailable
                </h1>

                {/* Subheading */}
                <p className="serviceUnavailable503-subheading text-[12px] sm:text-[14px] text-[var(--color-text3)] leading-relaxed mb-8 max-w-sm">
                    Our servers are taking a short breather. We're working hard to get
                    everything back online{Array(dots + 1).join(".")}
                </p>

                {/* Progress Bar */}
                <div className="serviceUnavailable503-progressBar-wrapper w-full h-fit mb-8!">
                    <div className="serviceUnavailable503-progressBar-labelRow flex justify-between text-[11px] text-stone-400 mb-2 font-medium">
                        <span className="serviceUnavailable503-progressBar-label">Recovery in progress</span>
                        <span className="serviceUnavailable503-progressBar-percent">{Math.round(progress)}%</span>
                    </div>
                    <div className="serviceUnavailable503-progressBar-track w-full h-1.5 bg-stone-200 rounded-full overflow-hidden">
                        <div
                            className="serviceUnavailable503-progressBar-fill h-full bg-gradient-to-r from-emerald-400 to-green-500 rounded-full transition-all duration-700 ease-out"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>

                {/* Try Again Button */}
                <div className="serviceUnavailable503-button-wrapper w-full h-fit flex justify-center items-center">
                    <div className="serviceUnavailablePage-button-container w-[200px] sm:w-[260px] h-[30px] sm:h-[40px]" onClick={() => onTryAgainClick()}>
                        <CustomButton id={"serviceUnavailablePage-button"} label={"Try Again"} />
                    </div>
                </div>

                {/* Contact Support */}
                <div className="serviceUnavailable503-footer w-full h-fit flex justify-center items-center mt-6!">
                    <span className="serviceUnavailable503-footer-text text-[12px] sm:text-[14px] text-[var(--color-text3)] tracking-tight inline-block me-1!">
                        Need immediate help? -
                    </span>
                    <span className="serviceUnavailable503-footer-link ms-1! text-[12px] sm:text-[14px] text-[var(--color-link1)] hover:text-[var(--color-link2)] font-semibold tracking-tight hover:underline! inline-block cursor-pointer">
                        Contact Support
                    </span>
                </div>

            </div>

            {/* Keyframe Styles */}
            <style>{`
        @keyframes ping {
          75%, 100% { transform: scale(2); opacity: 0; }
        }
      `}</style>

        </div>
    );
}