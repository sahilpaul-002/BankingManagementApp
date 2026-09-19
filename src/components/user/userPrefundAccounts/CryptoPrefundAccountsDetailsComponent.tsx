import type { PrefundCryptoAccountType } from '@/types/user/userPrefundAccountsDetailsTypes';
import { groupCryptoAccountsByNetwork } from '@/utils/userPrefundAccounts/prefundAccountsHelper';
import { useMemo, useState } from 'react';
import PrefundAccountsEmptyStateComponent from './PrefundAccountsEmptyStateComponent';
import PrefundAccountsTabsComponent from './PrefundAccountTabsComponent';
import CryptoAssetCardComponent from './CryptoAssetCardComponent';

interface CryptoAccountDetailsComponentProps {
    cryptoDetails?: PrefundCryptoAccountType[] | null | undefined;
}

export default function CryptoPrefundAccountsDetailsComponent({ cryptoDetails }: CryptoAccountDetailsComponentProps) {
    // { ETHEREUM: [{...}, {...}], POLYGON: [{...}, {...}] }
    const cryptoAccountsByNetwork = useMemo(() => groupCryptoAccountsByNetwork(cryptoDetails), [cryptoDetails]);
    const networks = Object.keys(cryptoAccountsByNetwork);

    const [activeNetwork, setActiveNetwork] = useState<string>('');

    // crypto can be `[]` / null / undefined
    if (networks.length === 0) {
        return <PrefundAccountsEmptyStateComponent type="crypto" />;
    }

    // Fallback to first network if nothing selected yet or the selected one no longer exists (after refetch)
    const selectedNetwork = networks.includes(activeNetwork) ? activeNetwork : networks[0]!;
    const selectedNetworkAccounts = cryptoAccountsByNetwork[selectedNetwork] ?? [];

    return (
        <div className="cryptoAccountDetails-wrapper w-full h-fit">
            {/* Section Header */}
            <div className="flex items-center justify-between mb-5!">
                <div>
                    <h2 className="text-base font-semibold text-[var(--ink)] tracking-normal">Crypto Accounts</h2>
                    <p className="text-xs text-[var(--mute)] mt-0.5!">Your crypto prefunding accounts by network</p>
                </div>
            </div>

            {/* Network Sub Tabs */}
            <PrefundAccountsTabsComponent
                tabs={networks.map((network) => ({ id: network, label: network }))}
                activeTab={selectedNetwork}
                onTabChange={setActiveNetwork}
                idPrefix="userPrefundingAccountsPage-cryptoNetwork"
                containerClassName="mb-6!"
            />

            {/* Network Accounts */}
            <div className="space-y-5!">
                {selectedNetworkAccounts.map((account) => (
                    <CryptoAssetCardComponent
                        key={account.account_id ?? `${account.network}-${account.asset}`}
                        account={account}
                    />
                ))}
            </div>
        </div>
    );
}