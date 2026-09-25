import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import type { AllWalletBalancesResponseDataType } from '@/types/dashboard/allWalletsBalancesSectionTypes';
import { Activity } from 'react';
import { PieChart } from 'lucide-react';

function formatFull(value: number): string {
    return `$${value.toLocaleString('en-US')}`;
}

function parseBalance(value: string): number {
    const parsedValue = Number.parseFloat(value);

    return Number.isFinite(parsedValue) ? parsedValue : 0;
}

interface WalletBalanceChartSectionPropsType {
    walletsBalances: AllWalletBalancesResponseDataType | [];
    walletsBalancesNotFound?: boolean | undefined;
}

export default function WalletBalanceChartSection({ walletsBalances, walletsBalancesNotFound = false }: WalletBalanceChartSectionPropsType) {

    // Wallet data availability
    const hasWalletBalances = !walletsBalancesNotFound && !Array.isArray(walletsBalances);
    const walletData = hasWalletBalances ? walletsBalances : undefined;
    const walletsDetails = walletData?.wallets_details ?? [];

    // Total USD equivalent
    const totalWalletBalance = walletData ? parseBalance(walletData.total_usd_equivalent) : 0;

    // FIAT USD equivalent
    const fiatBalance = walletsDetails
        .filter((wallet) => wallet.wallet_type === 'FIAT')
        .reduce(
            (total, wallet) => total + parseBalance(wallet.usd_equivalent),
            0
        );

    // CRYPTO USD equivalent
    const cryptoBalance = walletsDetails
        .filter((wallet) => wallet.wallet_type === 'CRYPTO')
        .reduce(
            (total, wallet) => total + parseBalance(wallet.usd_equivalent),
            0
        );

    // Percentages
    const fiatPercentage = totalWalletBalance > 0 ? (fiatBalance / totalWalletBalance) * 100 : 0;
    const cryptoPercentage = totalWalletBalance > 0 ? (cryptoBalance / totalWalletBalance) * 100 : 0;

    // Chart
    const option: EChartsOption = {
        tooltip: {
            trigger: 'item',
            formatter: (params: any) => {
                const percentage =
                    totalWalletBalance > 0
                        ? ((params.value / totalWalletBalance) * 100).toFixed(1)
                        : '0.0';

                return `
                    <div style="font-size:12px; color: var(--ink)">
                        <strong>${params.name}</strong><br/>
                        ${formatFull(params.value)}<br/>
                        <span style="color: var(--ink-soft)">
                            ${percentage}% of total
                        </span>
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

                label: {
                    show: false,
                },

                labelLine: {
                    show: false,
                },

                emphasis: {
                    scale: false,
                    itemStyle: {
                        shadowBlur: 0,
                    },
                },

                data: [
                    {
                        value: fiatBalance,
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
                        value: cryptoBalance,
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

    return (
        <>
            {/* Wallet Balances Not Found */}
            <Activity mode={walletsBalancesNotFound || !hasWalletBalances ? "visible" : "hidden"}>
                <div className="walletBalance-container w-full h-full px-2! py-4! bg-[var(--bg-surface)] border border-[var(--line)] rounded-lg shadow-[var(--shadow-sm)] flex flex-col">

                    {/* Header */}
                    <div className="walletBalance-header text-xs sm:text-sm text-[var(--ink-soft)] tracking-widest font-semibold uppercase flex items-center gap-2.5 mb-4!">
                        <span className="text-[var(--gold)]">—</span>
                        USD Equivalent Wallet Balance
                    </div>

                    {/* Empty state body */}
                    <div className="flex flex-col items-center justify-center gap-3 flex-1 py-4!">

                        {/* Icon */}
                        <PieChart className="w-7 h-7 text-[var(--ink-soft)]" strokeWidth={1.5} />

                        {/* Copy */}
                        <div className="flex flex-col items-center text-center gap-1">
                            <p className="text-sm font-semibold text-[var(--ink)]">
                                No balance data
                            </p>
                            <p className="text-xs text-[var(--ink-soft)] max-w-[180px] leading-relaxed">
                                Chart will populate once wallet balances are available.
                            </p>
                        </div>

                        {/* Ghost legend */}
                        <div className="flex flex-col gap-2 w-full mt-2! opacity-30">
                            {[{ label: 'Fiat Balance', color: 'var(--ink-2)' }, { label: 'Crypto Balance', color: 'var(--gold)' }].map((item) => (
                                <div key={item.label} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-[3px]" style={{ backgroundColor: item.color }} />
                                        <span className="text-xs text-[var(--ink-soft)] font-semibold">{item.label}</span>
                                        <span className="text-xs text-[var(--ink-soft)]">(USD equivalent)</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-medium text-[var(--ink)]">—</span>
                                        <span className="text-[10px] text-[var(--mute)] w-10 text-right">0.0%</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>
            </Activity>

            {/* Wallet Balances Found */}
            <Activity mode={!walletsBalancesNotFound && hasWalletBalances ? "visible" : "hidden"}>
                <div className="walletBalance-container w-full h-full px-2! py-4! bg-[var(--bg-surface)] border border-[var(--line)] rounded-lg shadow-[var(--shadow-sm)]">

                    {/* Header */}
                    <div className="walletBalance-header text-xs sm:text-sm text-[var(--ink-soft)] tracking-widest font-semibold uppercase flex items-center gap-2.5 mb-3!">
                        <span className="text-[var(--gold)]">—</span>
                        USD Equivalent Wallet Balance
                    </div>

                    {/* Total balance */}
                    <div className="walletBalance-total text-xl sm:text-2xl text-[var(--ink)] font-medium mb-2!">
                        {formatFull(totalWalletBalance)}

                        <span className="text-sm sm:text-md text-[var(--mute)] font-semibold uppercase ml-2!">
                            USD
                        </span>
                    </div>

                    {/* Chart */}
                    <div className="walletBalance-chart-container relative h-34">
                        <ReactECharts
                            option={option}
                            style={{
                                height: '100%',
                                width: '100%',
                            }}
                            opts={{
                                renderer: 'svg',
                            }}
                        />
                    </div>

                    {/* Legend */}
                    <div className="walletBalance-legend-fiatBalance-wrapper flex flex-col gap-2 mt-4!">

                        {/* Fiat Balance */}
                        <div className="walletBalance-fiatBalance-container flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-[3px] bg-[var(--ink-2)]" />

                                <span className="text-xs text-[var(--ink-soft)] font-semibold">
                                    Fiat Balance
                                </span>

                                <span className="text-xs text-[var(--ink-soft)]">
                                    (USD equivalent)
                                </span>
                            </div>

                            <div className="flex items-center gap-2">
                                <span className="text-xs font-medium text-[var(--ink)]">
                                    {formatFull(fiatBalance)}
                                </span>

                                <span className="text-[10px] text-[var(--mute)] w-10 text-right">
                                    {fiatPercentage.toFixed(1)}%
                                </span>
                            </div>
                        </div>

                        {/* Crypto Balance */}
                        <div className="walletBalance-cryptoBalance-container flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-[3px] bg-[var(--gold)]" />

                                <span className="text-xs text-[var(--ink-soft)] font-semibold">
                                    Crypto Balance
                                </span>

                                <span className="text-xs text-[var(--ink-soft)]">
                                    (USD equivalent)
                                </span>
                            </div>

                            <div className="flex items-center gap-2">
                                <span className="text-xs font-medium text-[var(--ink)]">
                                    {formatFull(cryptoBalance)}
                                </span>

                                <span className="text-[10px] text-[var(--mute)] w-10 text-right">
                                    {cryptoPercentage.toFixed(1)}%
                                </span>
                            </div>
                        </div>

                    </div>
                </div>
            </Activity>
        </>
    );
}