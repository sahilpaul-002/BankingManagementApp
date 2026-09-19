import type { PrefundCryptoAccountType } from '@/types/user/userPrefundingAccountsPageTypes';
import { formatNumberDecimal } from '@/utils/prefundingAccountsHelper';
import PrefundingDetailItemComponent from '@/components/user/userPrefundingAccounts/PrefundingDetailItemComponent';

interface CryptoAssetCardComponentProps {
    account: PrefundCryptoAccountType;
}

export default function CryptoAssetCardComponent({ account }: CryptoAssetCardComponentProps) {
    const idPrefix = `cryptoAccount-${account.network}-${account.asset}`;

    return (
        <div className="cryptoAssetCard-wrapper w-full h-fit border border-[var(--line)] rounded-xl p-5!">
            {/* Card Header */}
            <div className="flex items-center justify-between mb-4!">
                <div>
                    <h3 className="text-sm font-semibold text-[var(--ink)] tracking-normal">{account.asset}</h3>
                    <p className="text-xs text-[var(--mute)] mt-0.5!">
                        {account.asset} deposit account on {account.network}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                {/* Network */}
                <PrefundingDetailItemComponent
                    id={`${idPrefix}-value-network`}
                    label="Network"
                    value={account.network}
                />

                {/* Asset */}
                <PrefundingDetailItemComponent
                    id={`${idPrefix}-value-asset`}
                    label="Asset"
                    value={account.asset}
                />

                {/* Balance */}
                <PrefundingDetailItemComponent
                    id={`${idPrefix}-value-balance`}
                    label="Balance"
                    value={`${formatNumberDecimal(account.balance)} ${account.asset ?? ''}`.trim()}
                    className="md:col-span-2"
                />

                {/* Deposit Address */}
                <PrefundingDetailItemComponent
                    id={`${idPrefix}-value-depositAddress`}
                    label="Deposit Address"
                    value={account.deposit_address}
                    copyable
                    breakAll
                    className="md:col-span-2"
                />
            </div>
        </div>
    );
}