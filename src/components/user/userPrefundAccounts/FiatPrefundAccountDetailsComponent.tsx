import type { PrefundFiatAccountType } from "@/types/user/userPrefundAccountsDetailsTypes";
import { formatNumberDecimal, hasFiatAccount } from "@/utils/userPrefundAccounts/prefundAccountsHelper";
import PrefundAccountsEmptyStateComponent from "./PrefundAccountsEmptyStateComponent";
import PrefundAccountItemDetailsComponent from "./PrefundAccountItemDetailsComponent";


// ── Status Badge ─────────────────────────────────────────────────────────────
function ActiveStatusBadge({ isActive }: { isActive: boolean }) {
    return (
        <span
            className={`inline-flex items-center px-2.5! py-0.5! rounded-full text-xs font-semibold tracking-wide ${isActive
                ? 'bg-[var(--ok-bg)] text-[var(--ok)]'
                : 'bg-[var(--danger-bg)] text-[var(--danger)]'
                }`}
        >
            {isActive ? 'Active' : 'Inactive'}
        </span>
    );
}

// ── Component ────────────────────────────────────────────────────────────────
interface FiatAccountDetailsComponentProps {
    fiatDetails?: PrefundFiatAccountType | null | undefined;
}

export default function FiatPrefundAccountDetailsComponent({ fiatDetails }: FiatAccountDetailsComponentProps) {
    // fiat can be `{}` / null / undefined
    if (!hasFiatAccount(fiatDetails)) {
        return <PrefundAccountsEmptyStateComponent type="fiat" />;
    }

    return (
        <div className="fiatAccountDetails-wrapper w-full h-fit">
            {/* Section Header */}
            <div className="flex items-center justify-between mb-5!">
                <div>
                    <h2 className="text-base font-semibold text-[var(--ink)] tracking-normal">Fiat Account</h2>
                    <p className="text-xs text-[var(--mute)] mt-0.5!">Your fiat prefunding account information</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                {/* Account Number */}
                <PrefundAccountItemDetailsComponent
                    id="fiatAccount-value-accountNumber"
                    label="Account Number"
                    value={fiatDetails?.account_number}
                    copyable
                />

                {/* Account Currency */}
                <PrefundAccountItemDetailsComponent
                    id="fiatAccount-value-accountCurrency"
                    label="Account Currency"
                    value={fiatDetails?.account_currency}
                />

                {/* Account Balance */}
                <PrefundAccountItemDetailsComponent
                    id="fiatAccount-value-accountBalance"
                    label="Account Balance"
                    value={`${fiatDetails?.account_currency ?? ''} ${formatNumberDecimal(fiatDetails?.account_balance)}`.trim()}
                />

                {/* Status */}
                <PrefundAccountItemDetailsComponent id="fiatAccount-value-status" label="Account Status">
                    <ActiveStatusBadge isActive={!!fiatDetails?.is_active} />
                </PrefundAccountItemDetailsComponent>
            </div>
        </div>
    );
}