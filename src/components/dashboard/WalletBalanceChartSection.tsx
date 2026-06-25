import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';

const FIAT_BALANCE = 10024215;
const CRYPTO_BALANCE = 1370431;
const TOTAL = FIAT_BALANCE + CRYPTO_BALANCE;

function formatCurrency(value: number): string {
    if (value >= 1_000_000) {
        return `$${(value / 1_000_000).toFixed(2)}M`;
    }
    if (value >= 1_000) {
        return `$${(value / 1_000).toFixed(1)}K`;
    }
    return `$${value.toLocaleString()}`;
}

function formatFull(value: number): string {
    return `$${value.toLocaleString('en-US')}`;
}

export default function WalletBalanceChartSection() {
    const option: EChartsOption = {
        tooltip: {
            trigger: 'item',
            formatter: (params: any) => {
                const pct = ((params.value / TOTAL) * 100).toFixed(1);
                return `
                    <div style="font-size:12px; color: var(--ink)">
                        <strong>${params.name}</strong><br/>
                        ${formatFull(params.value)}<br/>
                        <span style="color: var(--ink-soft)">${pct}% of total</span>
                    </div>
                    `;
            },
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--line)',
            borderWidth: 1,
        },
        series: [
            {
                name: 'Wallet Balance',
                type: 'pie',
                radius: ['62%', '88%'],
                center: ['50%', '50%'],
                avoidLabelOverlap: false,
                label: { show: false },
                labelLine: { show: false },
                emphasis: {
                    scale: false,
                    itemStyle: {
                        shadowBlur: 0,
                    },
                },
                data: [
                    {
                        value: FIAT_BALANCE,
                        name: 'Fiat Balance',
                        itemStyle: {
                            color: 'var(--ink-2)',
                            borderRadius: 4,
                            borderWidth: 2,
                            borderColor: 'transparent',
                        },
                        emphasis: {
                            itemStyle: {
                                color: 'var(--ink-soft)',
                            },
                        },
                    },
                    {
                        value: CRYPTO_BALANCE,
                        name: 'Crypto Balance',
                        itemStyle: {
                            color: 'var(--gold)', 
                            borderRadius: 4,
                            borderWidth: 2,
                            borderColor: 'transparent',
                        },
                        emphasis: {
                            itemStyle: {
                                color: 'var(--gold-2)',
                            },
                        },
                    },
                ],
            },
        ],
    };

    const walletPct = ((FIAT_BALANCE / TOTAL) * 100).toFixed(1);
    const cardPct = ((CRYPTO_BALANCE / TOTAL) * 100).toFixed(1);

    return (
        <div className="walletBalance-container w-full h-full px-2! py-4! bg-[var(--bg-surface)] border border-[var(--line)] rounded-lg shadow-[var(--shadow-sm)]">

            {/* Header */}
            <div className="walletBalance-header text-xs sm:text-sm text-[var(--ink-soft)] tracking-widest font-semibold uppercase flex items-center gap-2.5 mb-3!">
                <span className="text-[var(--gold)]">—</span>
                Wallet Balance
            </div>

            {/* Total balance */}
            <div className="walletBalance-total text-xl sm:text-2xl text-[var(--ink)] font-medium mb-2!">
                {formatFull(TOTAL)}
                <span className="text-sm sm:text-md text-[var(--mute)] font-semibold uppercase ml-2!">
                    USD
                </span>
            </div>

            {/* Chart + centre label */}
            <div className="walletBalance-chart-container relative h-34">
                <ReactECharts
                    option={option}
                    style={{ height: '100%', width: '100%' }}
                    opts={{ renderer: 'svg' }}
                />

                {/* Centre label overlay */}
                {/* <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-[10px] sm:text-xs text-[var(--ink-soft)] font-semibold tracking-widest uppercase">
                        Available
                    </span>
                    <span className="text-base sm:text-lg text-[var(--ink)] font-semibold leading-tight mt-0.5!">
                        {formatCurrency(FIAT_BALANCE)}
                    </span>
                </div> */}
            </div>

            {/* Legend */}
            <div className="walletBalance-legend-fiatBalance-wrapper flex flex-col gap-2 mt-4!">
                {/* Fiat Balance row */}
                <div className="walletBalance-fiatBalance-container flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-[3px] bg-[#1B2A4A]" />
                        <span className="text-xs text-[var(--ink-soft)]">Fiat Balance</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-[var(--ink)]">
                            {formatFull(FIAT_BALANCE)}
                        </span>
                        <span className="text-[10px] text-[var(--mute)] w-10 text-right">
                            {walletPct}%
                        </span>
                    </div>
                </div>

                {/* Crypto Balance Row */}
                <div className="walletBalance-cryptoBalance-container flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-[3px] bg-[var(--gold)]" />
                        <span className="text-xs text-[var(--ink-soft)]">Crypto Balance</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-[var(--ink)]">
                            {formatFull(CRYPTO_BALANCE)}
                        </span>
                        <span className="text-[10px] text-[var(--mute)] w-10 text-right">
                            {cardPct}%
                        </span>
                    </div>
                </div>

            </div>
        </div>
    );
}