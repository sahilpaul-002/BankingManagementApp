// import { Check, ArrowRight, AlertTriangle } from 'lucide-react';
// import { useNavigate } from 'react-router-dom';
// import CustomButtonComponent from '@/components/common/CustomButtonComponent';
// import type { CryptoBeneficiaryTransferResponseDataType, CryptoTransactionFormDataType } from '@/types/payables/payoutTypes';

// const NETWORK_LABELS: Record<string, string> = {
//     ETHEREUM: 'Ethereum',
//     POLYGON: 'Polygon',
// };

// interface CryptoConfirmationStepComponentProps {
//     transferResult: CryptoBeneficiaryTransferResponseDataType;
//     onSendAnother: () => void;
// }

// interface DetailRowProps {
//     label: string;
//     value: React.ReactNode;
// }

// function DetailRow({ label, value }: DetailRowProps) {
//     return (
//         <div className="flex items-center justify-between text-xs">
//             <span className="text-[var(--mute)] font-medium">{label}</span>
//             <span className="font-semibold text-[var(--ink)] text-right">{value}</span>
//         </div>
//     );
// }

// export default function CryptoConfirmationStepComponent({
//     transferResult,
//     onSendAnother,
// }: CryptoConfirmationStepComponentProps) {
//     const navigate = useNavigate();

//     const networkLabel = NETWORK_LABELS[transferResult.destination_network];

//     const shortAddress = transferResult.destination_address.length > 16
//         ? `${transferResult.destination_address.slice(0, 8)}...${transferResult.destination_address.slice(-6)}`
//         : transferResult.destination_address;

//     return (
//         <div className="w-full max-w-3xl mx-auto bg-[var(--bg-surface)] rounded-xl border border-[var(--line)] p-8! sm:p-12! shadow-xs flex flex-col items-center text-center gap-6 animate-[fadeIn_0.3s_ease-out]">

//             {/* Success Icon */}
//             <div className="w-16 h-16 rounded-full bg-[var(--ok-bg)] text-[var(--ok)] flex items-center justify-center shadow-xs">
//                 <Check className="w-8 h-8 stroke-[2.5]" />
//             </div>

//             {/* Title */}
//             <div className="flex flex-col gap-2">
//                 <h2 className="text-2xl sm:text-3xl text-[var(--ink)] tracking-normal">
//                     <span className="font-serif font-medium">Crypto payment</span>{' '}
//                     <span className="font-serif italic font-normal text-[var(--mute)]">sent.</span>
//                 </h2>
//                 <p className="text-xs sm:text-sm text-[var(--ink-soft)] max-w-md mx-auto leading-relaxed">
//                     <strong className="font-semibold text-[var(--ink)]">
//                         {amount.toFixed(2)} {currency}
//                     </strong>{' '}
//                     sent via{' '}
//                     <strong className="font-semibold text-[var(--ink)]">{networkLabel}</strong>.
//                 </p>
//             </div>

//             {/* Summary Card */}
//             <div className="w-full max-w-md text-left bg-[var(--bg-subtle)] border border-[var(--line)] rounded-xl p-5! flex flex-col gap-3">

//                 {/* Visual Summary */}
//                 <div className="flex items-center justify-center gap-5 pb-4! border-b border-[var(--line)] flex-wrap">
//                     <div className="flex flex-col items-center gap-1">
//                         <span className="text-xs text-[var(--mute)] font-medium">Amount Sent</span>
//                         <div className="flex items-center gap-1.5">
//                             <span className="text-xl font-bold text-[var(--ink)]">{amount.toFixed(2)}</span>
//                             <span className="text-[10px] font-semibold text-[var(--ink-soft)] bg-[var(--line-faint)] px-3! py-1! rounded-full border border-[var(--line)]">
//                                 {currency}
//                             </span>
//                         </div>
//                     </div>

//                     <div className="text-[var(--gold)] text-xs font-semibold">→</div>

//                     <div className="flex flex-col items-center gap-1">
//                         <span className="text-xs text-[var(--mute)] font-medium">Destination</span>
//                         <span className="text-sm font-bold text-[var(--ink)] font-mono">{shortAddress}</span>
//                     </div>
//                 </div>

//                 {/* Payment Details */}
//                 <div className="flex flex-col gap-2.5">
//                     <DetailRow
//                         label="Transfer Reference"
//                         value={
//                             <span className="font-mono text-[10px] break-all">
//                                 {transferResult.transfer_reference_id}
//                             </span>
//                         }
//                     />

//                     <DetailRow
//                         label="Network"
//                         value={networkLabel}
//                     />

//                     <DetailRow
//                         label="Destination Address"
//                         value={
//                             <span className="font-mono text-[10px] break-all">
//                                 {transferResult.destination_address}
//                             </span>
//                         }
//                     />

//                     <DetailRow
//                         label="Amount"
//                         value={`${transferResult.source_amount} ${transferResult.source_currency}`}
//                     />

//                     <DetailRow
//                         label="Fee"
//                         value={`${transferResult.fee.amount} ${transferResult.fee.currency}`}
//                     />

//                     <DetailRow
//                         label="Fee Percentage"
//                         value={`${transferResult.fee.percentage}%`}
//                     />

//                     <DetailRow
//                         label="Source Wallet Debit"
//                         value={`${transferResult.total_source_wallet_debit.amount} ${transferResult.total_source_wallet_debit.currency}`}
//                     />

//                     <DetailRow
//                         label="USD Wallet Debit"
//                         value={`${transferResult.total_usd_wallet_debit.amount} ${transferResult.total_usd_wallet_debit.currency}`}
//                     />

//                     <DetailRow
//                         label="Status"
//                         value={transferResult.status}
//                     />
//                 </div>
//             </div>

//             {/* Actions */}
//             <div className="flex items-center justify-center gap-3 pt-2! flex-wrap">
//                 <div className="w-[160px] h-[38px]">
//                     <CustomButtonComponent
//                         id="crypto-sendAnother-btn"
//                         label="Send another"
//                         type="button"
//                         variant="outline"
//                         onClick={onSendAnother}
//                     />
//                 </div>

//                 <div className="w-[200px] h-[38px]">
//                     <CustomButtonComponent
//                         id="crypto-viewTransactions-btn"
//                         label={
//                             <span className="flex items-center justify-center gap-1.5">
//                                 View in transactions
//                                 <ArrowRight className="w-4 h-4" />
//                             </span>
//                         }
//                         type="button"
//                         variant="navy"
//                         onClick={() => navigate('/payables/transactions')}
//                     />
//                 </div>
//             </div>
//         </div>
//     );
// }


import { Check, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import CustomButtonComponent from '@/components/common/CustomButtonComponent';
import type { CryptoBeneficiaryTransferResponseDataType } from '@/types/payables/payoutTypes';

const NETWORK_LABELS: Record<
    CryptoBeneficiaryTransferResponseDataType['destination_network'],
    string
> = {
    ETHEREUM: 'Ethereum',
    POLYGON: 'Polygon',
};

interface CryptoConfirmationStepComponentProps {
    transferResult: CryptoBeneficiaryTransferResponseDataType;
    onSendAnother: () => void;
}

interface DetailRowProps {
    label: string;
    value: React.ReactNode;
}

function DetailRow({ label, value }: DetailRowProps) {
    return (
        <div className="flex items-center justify-between gap-4 text-xs">
            <span className="text-[var(--mute)] font-medium">
                {label}
            </span>

            <span className="font-semibold text-[var(--ink)] text-right">
                {value}
            </span>
        </div>
    );
}

export default function CryptoConfirmationStepComponent({
    transferResult,
    onSendAnother,
}: CryptoConfirmationStepComponentProps) {
    const navigate = useNavigate();

    const networkLabel =
        NETWORK_LABELS[transferResult.destination_network];

    return (
        <div className="w-full max-w-3xl mx-auto bg-[var(--bg-surface)] rounded-xl border border-[var(--line)] p-8! sm:p-12! shadow-xs flex flex-col items-center text-center gap-6 animate-[fadeIn_0.3s_ease-out]">

            {/* Success Icon */}
            <div className="w-16 h-16 rounded-full bg-[var(--ok-bg)] text-[var(--ok)] flex items-center justify-center shadow-xs">
                <Check className="w-8 h-8 stroke-[2.5]" />
            </div>

            {/* Title */}
            <div className="flex flex-col gap-2">
                <h2 className="text-2xl sm:text-3xl text-[var(--ink)] tracking-normal">
                    <span className="font-serif font-medium">
                        Crypto payment
                    </span>{' '}
                    <span className="font-serif italic font-normal text-[var(--mute)]">
                        sent.
                    </span>
                </h2>

                <p className="text-xs sm:text-sm text-[var(--ink-soft)] max-w-md mx-auto leading-relaxed">
                    <strong className="font-semibold text-[var(--ink)]">
                        {transferResult.source_amount}{' '}
                        {transferResult.source_currency}
                    </strong>{' '}
                    sent via{' '}
                    <strong className="font-semibold text-[var(--ink)]">
                        {networkLabel}
                    </strong>.
                </p>
            </div>

            {/* Summary Card */}
            <div className="w-full max-w-md text-left bg-[var(--bg-subtle)] border border-[var(--line)] rounded-xl p-5! flex flex-col gap-3">

                {/* Visual Summary */}
                <div className="flex items-center justify-center gap-5 pb-4! border-b border-[var(--line)] flex-wrap">

                    <div className="flex flex-col items-center gap-1">
                        <span className="text-xs text-[var(--mute)] font-medium">
                            Amount Sent
                        </span>

                        <div className="flex items-center gap-1.5">
                            <span className="text-xl font-bold text-[var(--ink)]">
                                {transferResult.source_amount}
                            </span>

                            <span className="text-[10px] font-semibold text-[var(--ink-soft)] bg-[var(--line-faint)] px-3! py-1! rounded-full border border-[var(--line)]">
                                {transferResult.source_currency}
                            </span>
                        </div>
                    </div>

                    <div className="text-[var(--gold)] text-xs font-semibold">
                        →
                    </div>

                    <div className="flex flex-col items-center gap-1">
                        <span className="text-xs text-[var(--mute)] font-medium">
                            Destination
                        </span>

                        <span className="text-sm font-bold text-[var(--ink)] font-mono break-all">
                            {transferResult.destination_address}
                        </span>
                    </div>
                </div>

                {/* Payment Details */}
                <div className="flex flex-col gap-2.5">

                    <DetailRow
                        label="Transfer Reference"
                        value={
                            <span className="font-mono text-[10px] break-all">
                                {transferResult.transfer_reference_id}
                            </span>
                        }
                    />

                    <DetailRow
                        label="Network"
                        value={networkLabel}
                    />

                    <DetailRow
                        label="Destination Address"
                        value={
                            <span className="font-mono text-[10px] break-all">
                                {transferResult.destination_address}
                            </span>
                        }
                    />

                    <DetailRow
                        label="Amount"
                        value={`${transferResult.source_amount} ${transferResult.source_currency}`}
                    />

                    <DetailRow
                        label="Fee"
                        value={`${transferResult.fee.amount} ${transferResult.fee.currency}`}
                    />

                    <DetailRow
                        label="Fee Percentage"
                        value={`${transferResult.fee.percentage}%`}
                    />

                    <DetailRow
                        label="Source Wallet Debit"
                        value={`${transferResult.total_source_wallet_debit.amount} ${transferResult.total_source_wallet_debit.currency}`}
                    />

                    <DetailRow
                        label="USD Wallet Debit"
                        value={`${transferResult.total_usd_wallet_debit.amount} ${transferResult.total_usd_wallet_debit.currency}`}
                    />

                    <DetailRow
                        label="Status"
                        value={transferResult.status}
                    />

                    <DetailRow
                        label="Crypto Wallet Transaction ID"
                        value={
                            <span className="font-mono text-[10px] break-all">
                                {transferResult.crypto_wallet_transaction_id}
                            </span>
                        }
                    />

                    <DetailRow
                        label="USD Fee Transaction ID"
                        value={
                            <span className="font-mono text-[10px] break-all">
                                {transferResult.usd_fee_wallet_transaction_id}
                            </span>
                        }
                    />

                    <DetailRow
                        label="Wallet ID"
                        value={
                            <span className="font-mono text-[10px] break-all">
                                {transferResult.wallet_id}
                            </span>
                        }
                    />
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-center gap-3 pt-2! flex-wrap">

                <div className="w-[160px] h-[38px]">
                    <CustomButtonComponent
                        id="crypto-sendAnother-btn"
                        label="Send another"
                        type="button"
                        variant="outline"
                        onClick={onSendAnother}
                    />
                </div>

                <div className="w-[200px] h-[38px]">
                    <CustomButtonComponent
                        id="crypto-viewTransactions-btn"
                        label={
                            <span className="flex items-center justify-center gap-1.5">
                                View in statements
                                <ArrowRight className="w-4 h-4" />
                            </span>
                        }
                        type="button"
                        variant="navy"
                        onClick={() => navigate('/wallets/statements')}
                    />
                </div>

            </div>
        </div>
    );
}