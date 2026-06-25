import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftRight, Send } from 'lucide-react';
import { DEMO } from '@/fallbacks/dashboardFallbacks';
import WalletBalanceSection from '@/components/dashboard/WalletBalanceSection';
import NeedsAttentionCard from '@/components/dashboard/NeedsAttentionCard';
import ExpenditureChartSection from '@/components/dashboard/ExpenditureChartSection';
import TopCardsSection from '@/components/dashboard/TopCardsSection';
import RecentActivitySection from '@/components/dashboard/RecentActivitySection';
import ScheduledPaymentsList from '@/components/dashboard/ScheduledPaymentsList';
import { selectDnsConfigDetails } from '@/redux/slice/config/configSlice';
import { useSelector } from 'react-redux';
import CustomButtonComponent from '@/components/common/CustomButtonComponent';

export default function DashboardPage() {
    // Configure useNavigate()
    const navigate = useNavigate();

    // Get dns data from redux
    const dnsData = useSelector(selectDnsConfigDetails)

    // Function to handle the greetings text
    const greeting = useMemo(() => {
        const hour = new Date().getHours();

        if (hour >= 5 && hour < 12) {
            return "Good morning";
        }

        if (hour >= 12 && hour < 17) {
            return "Good afternoon";
        }

        if (hour >= 17 && hour < 21) {
            return "Good evening";
        }

        return "Good night";
    }, []);

    // Calculate total USD equivalent
    const totalUSD = useMemo(() => {
        return DEMO.balances.reduce((sum, balance) => {
            // Simple conversion - in real app would use fx rates
            return sum + balance.amount;
        }, 0);
    }, []);

    return (
        <div className='dashboardPage-container w-full h-fit flex flex-col justify-start items-stretch gap-3'>
            {/* Dashboard Page Header with Actions */}
            <div className="w-full h-fit flex flex-col lg:flex-row items-start lg:items-end justify-between gap-4 mb-7!">
                <div className="min-w-0">
                    <div className="text-xs text-[var(--mute)] font-semibold tracking-[0.18em] uppercase mb-2!">
                        {/* {DEMO.company.name} · {DEMO.user.role} */}
                        {dnsData?.dashboard_name}
                    </div>
                    <h1 className="text-4xl t-[var(--ink)] font-medium tracking-normal mb-1.5!">
                        {greeting}
                    </h1>
                    <p className="text-sm text-[var(--ink-soft)]">
                        Here's where things stand across your treasury today.
                    </p>
                </div>
                <div className="w-fit flex justify-center items-center gap-2">
                    {/* Convert Button */}
                    <div className="dashboardPage-convert-button-container w-[140px] sm:w-[160px] h-[30px] sm:h-[40px]">
                        <CustomButtonComponent id={"dashboardPage-convert-button"} label={<><ArrowLeftRight className="w-4 h-4" /> Convert</>} type="button" variant={"navy"} onClick={() => navigate('/currency-conversion')} />
                    </div>
                    {/* Send Money Button */}
                    <div className="dashboardPage-sendMoney-button-container w-[140px] sm:w-[160px] h-[30px] sm:h-[40px]">
                        <CustomButtonComponent id={"dashboardPage-sendMoney-button"} label={<><Send className="w-3.5 h-3.5" />Send money</>} type="button" variant={"navy"} onClick={() => navigate('/send-money')} />
                    </div>
                </div>
            </div>

            {/* Main Layout Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-[1.5fr_1fr] gap-6">

                {/* ------------------- Row 1 ------------------- */}
                {/* Wallet Section */}
                <WalletBalanceSection
                    totalUSD={totalUSD}
                    changePercent={2.4}
                    lastRefreshed="2 min ago"
                    balances={DEMO.balances}
                />
                {/* Cards Section */}
                <TopCardsSection cards={DEMO.cards} />

                {/* ------------------- Row 2 ------------------- */}
                {/* Chart Section */}
                <ExpenditureChartSection />
                {/* Schedule Payments List */}
                <ScheduledPaymentsList payments={DEMO.scheduledPayments} />

                {/* ------------------- Row 3 ------------------- */}
                {/* Recent Activity Section */}
                <RecentActivitySection />
                {/* Need Attention Card */}
                <NeedsAttentionCard items={DEMO.needsAttention} />

            </div>

            {/* Recent Activity Section */}
            {/* <div className="recentTransactions-section-container-wrapper w-full h-full">
                <RecentActivitySection />
            </div> */}
        </div>
    );
}