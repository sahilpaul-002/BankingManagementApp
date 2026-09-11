import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Send } from 'lucide-react';
import CustomButtonComponent from '@/components/common/CustomButtonComponent';
import type { BeneficiaryItem } from '@/fallbacks/payables/beneficiaries/beneficiariesFallbacks';

interface BeneficiaryDetailsSidebarComponentProps {
    isOpen: boolean;
    onClose: () => void;
    beneficiary: BeneficiaryItem | null;
}

export default function BeneficiaryDetailsSidebarComponent({
    isOpen,
    onClose,
    beneficiary,
}: BeneficiaryDetailsSidebarComponentProps) {
    const navigate = useNavigate();

    // Lock background scroll when drawer is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen || !beneficiary) return null;

    const handleSendMoney = () => {
        onClose();
        navigate(`/payables/payout?beneficiaryId=${beneficiary._id}`);
    };

    const maskAccountNumber = (accNo: string) => {
        if (!accNo) return '****';
        if (accNo.length <= 4) return accNo;
        return `****${accNo.slice(-4)}`;
    };

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity duration-200"
                onClick={onClose}
            />

            {/* Right Drawer Panel */}
            <div className="relative z-10 w-full max-w-md h-full bg-[var(--bg-surface)] border-l border-[var(--line)] shadow-2xl flex flex-col justify-between overflow-y-auto animate-[slideInRight_0.25s_ease-out]">
                <style>{`
                    @keyframes slideInRight {
                        from { transform: translateX(100%); }
                        to { transform: translateX(0); }
                    }
                `}</style>

                {/* Sidebar Header */}
                <div className="p-6! border-b border-[var(--line)] flex items-center justify-between bg-[var(--bg-surface)]">
                    <h3 className="text-xl font-normal text-[var(--ink)] tracking-normal">
                        <span className="font-serif font-medium">Beneficiary</span>{' '}
                        <span className="font-serif italic font-normal">details</span>
                    </h3>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-[var(--mute)] hover:text-[var(--ink)] hover:bg-[var(--bg-hover)] transition-colors cursor-pointer"
                        aria-label="Close details"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content Body */}
                <div className="p-6! flex-1 flex flex-col gap-6 overflow-y-auto">
                    {/* Top Identity Block */}
                    <div className="flex flex-col gap-1.5">
                        <h2 className="text-2xl font-bold text-[var(--ink)]">
                            {beneficiary.account_holder_name}
                        </h2>
                        <p className="text-xs text-[var(--mute)]">
                            {beneficiary.email || `${beneficiary.account_holder_name.toLowerCase().replace(/\s+/g, '.')}@example.com`}
                        </p>
                        <div className="mt-2 flex items-center">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[var(--ok-bg)] text-[var(--ok)]">
                                <span className="w-1.5 h-1.5 rounded-full bg-[var(--ok)]"></span>
                                {beneficiary.status || 'ACTIVE'}
                            </span>
                        </div>
                    </div>

                    {/* Section: GENERAL */}
                    <div className="flex flex-col gap-3 pt-4 border-t border-[var(--line)]">
                        <div className="text-xs font-semibold text-[var(--mute)] uppercase tracking-wider flex items-center gap-2">
                            <span>— GENERAL</span>
                        </div>
                        <div className="grid grid-cols-2 gap-y-3 text-xs">
                            <span className="text-[var(--mute)] font-medium">Beneficiary type</span>
                            <span className="text-right font-semibold text-[var(--ink)] uppercase">
                                {beneficiary.type || 'INDIVIDUAL'}
                            </span>

                            <span className="text-[var(--mute)] font-medium">Payment method</span>
                            <span className="text-right font-semibold text-[var(--ink)] uppercase">
                                {beneficiary.payment_method || 'SWIFT'}
                            </span>

                            <span className="text-[var(--mute)] font-medium">Currency</span>
                            <span className="text-right font-semibold text-[var(--ink)] uppercase">
                                {beneficiary.account_currency || 'USD'}
                            </span>

                            <span className="text-[var(--mute)] font-medium">Country</span>
                            <span className="text-right font-semibold text-[var(--ink)] uppercase">
                                {beneficiary.country || 'US'}
                            </span>
                        </div>
                    </div>

                    {/* Section: BANK DETAILS */}
                    <div className="flex flex-col gap-3 pt-4 border-t border-[var(--line)]">
                        <div className="text-xs font-semibold text-[var(--mute)] uppercase tracking-wider flex items-center gap-2">
                            <span>— BANK DETAILS</span>
                        </div>
                        <div className="grid grid-cols-2 gap-y-3 text-xs">
                            <span className="text-[var(--mute)] font-medium">Bank name</span>
                            <span className="text-right font-semibold text-[var(--ink)]">
                                {beneficiary.bank_name}
                            </span>

                            <span className="text-[var(--mute)] font-medium">Account holder</span>
                            <span className="text-right font-semibold text-[var(--ink)]">
                                {beneficiary.account_holder_name}
                            </span>

                            <span className="text-[var(--mute)] font-medium">Account number</span>
                            <span className="text-right font-mono font-semibold text-[var(--ink)]">
                                {maskAccountNumber(beneficiary.account_number)}
                            </span>

                            <span className="text-[var(--mute)] font-medium">SWIFT code</span>
                            <span className="text-right font-mono font-semibold text-[var(--ink)]">
                                {beneficiary.swift_code}
                            </span>

                            <span className="text-[var(--mute)] font-medium">IBAN code / Clearing</span>
                            <span className="text-right font-mono font-semibold text-[var(--ink)] truncate" title={beneficiary.iban_code}>
                                {beneficiary.iban_code}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Footer Action */}
                <div className="p-6! border-t border-[var(--line)] bg-[var(--bg-surface)]">
                    <div className="w-full h-11">
                        <CustomButtonComponent
                            id="beneficiaryDetails-sendMoney-btn"
                            label={
                                <span className="flex items-center justify-center gap-2">
                                    <Send className="w-4 h-4" /> Send money
                                </span>
                            }
                            type="button"
                            variant="navy"
                            onClick={handleSendMoney}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
