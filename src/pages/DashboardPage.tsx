import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftRight, Send } from 'lucide-react';
import { DEMO } from '@/fallbacks/dashboardFallbacks';
import WalletBalanceSection from '@/components/dashboard/WalletBalanceSection';
import NeedsAttentionCard from '@/components/dashboard/NeedsAttentionCard';
import OutboundChartSection from '@/components/dashboard/OutboundChartSection';
import TopCardsSection from '@/components/dashboard/TopCardsSection';
import RecentActivitySection from '@/components/dashboard/RecentActivitySection';
import ScheduledPaymentsList from '@/components/dashboard/ScheduledPaymentsList';

export default function DashboardPage() {
    const navigate = useNavigate();

    // Calculate total USD equivalent
    const totalUSD = useMemo(() => {
        return DEMO.balances.reduce((sum, balance) => {
            // Simple conversion - in real app would use fx rates
            return sum + balance.amount;
        }, 0);
    }, []);

    return (
        <div>
            {/* Page Header with Actions */}
            <div className="flex items-end justify-between gap-6 mb-7">
                <div className="min-w-0">
                    <div className="text-[10.5px] font-semibold tracking-[0.18em] uppercase mb-2" style={{ color: 'var(--mute)' }}>
                        {DEMO.company.name} · {DEMO.user.role}
                    </div>
                    <h1
                        className="text-[38px] font-medium leading-[1.05] tracking-[-0.012em] m-0 mb-1.5"
                        style={{ color: 'var(--ink)', fontFamily: 'var(--display)' }}
                    >
                        Good morning, <em className="italic font-normal" style={{ color: 'var(--ink-soft)' }}>{DEMO.user.name}.</em>
                    </h1>
                    <p className="text-[17px] m-0" style={{ color: 'var(--ink-soft)', fontFamily: 'var(--display)' }}>
                        Here's where things stand across your treasury today.
                    </p>
                </div>
                <div className="flex gap-2.5">
                    <button
                        onClick={() => navigate('/currency-conversion')}
                        className="inline-flex items-center justify-center gap-2 px-4 font-semibold transition-all active:translate-y-px"
                        style={{
                            height: '38px',
                            borderRadius: 'var(--radius)',
                            fontSize: '13px',
                            border: '1px solid var(--line)',
                            color: 'var(--ink)',
                            backgroundColor: 'transparent',
                            whiteSpace: 'nowrap'
                        }}
                    >
                        <ArrowLeftRight className="w-4 h-4" />
                        Convert
                    </button>
                    <button
                        onClick={() => navigate('/send-money')}
                        className="inline-flex items-center justify-center gap-2 px-4 font-semibold transition-all active:translate-y-px"
                        style={{
                            height: '38px',
                            borderRadius: 'var(--radius)',
                            fontSize: '13px',
                            backgroundColor: 'var(--nav-bg)',
                            color: '#fff',
                            border: '1px solid var(--nav-bg)',
                            whiteSpace: 'nowrap'
                        }}
                    >
                        <Send className="w-3.5 h-3.5" />
                        Send money
                    </button>
                </div>
            </div>

            {/* Main Layout Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-6">
                {/* Left Column */}
                <div className="space-y-7.5!">
                    {/* Row 1 - Balance Hero - Treasury + FIAT/CRYPTO breakdown */}
                    <WalletBalanceSection
                        totalUSD={totalUSD}
                        changePercent={2.4}
                        lastRefreshed="2 min ago"
                        balances={DEMO.balances}
                    />

                    {/* Row 2 - Outbound Chart */}
                    <OutboundChartSection />

                    {/* Row 3 - Recent Activity */}
                    <RecentActivitySection />
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                    {/* Row 1 - Top Cards */}
                    <TopCardsSection cards={DEMO.cards} />

                    {/* Row 2 - Needs Attention */}
                    <NeedsAttentionCard items={DEMO.needsAttention} />

                    {/* Row 3 - Scheduled Payments */}
                    <ScheduledPaymentsList payments={DEMO.scheduledPayments} />
                </div>
            </div>
        </div>
    );
}