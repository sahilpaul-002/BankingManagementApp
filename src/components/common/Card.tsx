import React from 'react'

export default function Card() {
    return (
        <div className="cardComponent-container w-full h-full backdrop-blur-3xl flex items-center justify-center rounded-3xl p-2!">
            <div className="cardComponent-card relative w-full h-full min-w-[400px] min-h-[240px] rounded-3xl bg-black shadow-[0_0_10px_16px_rgba(128,128,128,0.35)] p-8! flex flex-col justify-between overflow-hidden">
                {/* Subtle matte texture overlay */}
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />

                {/* Top row */}
                <div className="cardComponent-card-topRow flex items-center justify-between z-10">
                    {/* Chip */}
                    <div className="cardComponent-card-topRow-chip w-12 h-9 rounded-md bg-gradient-to-br from-yellow-300/80 to-yellow-500/60 border border-yellow-200/30 shadow-inner" />

                    {/* Network logo */}
                    <div className="cardComponent-card-topRow-networkLogo flex items-center -space-x-3">
                        <div className="w-9 h-9 rounded-full bg-red-500/80" />
                        <div className="w-9 h-9 rounded-full bg-orange-400/80" />
                    </div>
                </div>

                {/* Card number */}
                <div className="cardComponent-card-topRow-cardNumber z-10">
                    <p className="text-white/80 tracking-tight text-lg font-mono font-light flex justify-start items-center gap-2">
                        {/* 4291 &nbsp; 8374 &nbsp; 9182 &nbsp; 3746 */}
                        <span>••••</span>
                        <span>••••</span>
                        <span>••••</span>
                        <span>3746</span>
                    </p>
                </div>

                {/* Bottom row */}
                <div className="cardComponent-card-topRow-bottomRow flex items-end justify-between z-10">
                    <div>
                        <p className="text-white/40 text-xs uppercase tracking-widest mb-1">Card Holder</p>
                        <p className="text-white/90 text-sm font-medium tracking-wider">•••• MORGAN</p>
                    </div>
                    <div>
                        <p className="text-white/40 text-xs uppercase tracking-widest mb-1">Expires</p>
                        <p className="text-white/90 text-sm font-medium tracking-wider">08 / 28</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
