import { useEffect } from 'react';
import { X } from 'lucide-react';
import type { CardholderItemType } from '@/types/cards/cardholders/cardholderTypes';

// ── Status badge helpers ──────────────────────────────────────────────────────
const KYC_STATUS_STYLES: Record<string, string> = {
    PENDING:       'bg-yellow-100 text-yellow-700',
    'IN-PROGRESS': 'bg-blue-100 text-blue-700',
    RFI:           'bg-orange-100 text-orange-700',
    COMPLETED:     'bg-green-100 text-green-700',
};

const STATUS_STYLES: Record<string, string> = {
    DISABLED:       'bg-red-100 text-red-700',
    'PRE-VERIFIED': 'bg-yellow-100 text-yellow-700',
    VERIFIED:       'bg-blue-100 text-blue-700',
    ACTIVE:         'bg-green-100 text-green-700',
};

const formatDate = (iso: string) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-US', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
    });
};

// ── Props ─────────────────────────────────────────────────────────────────────
interface CardholderDetailsSidebarComponentPropsType {
    isOpen: boolean;
    onClose: () => void;
    cardholder: CardholderItemType | null;
}

// ── Detail Row Helper ─────────────────────────────────────────────────────────
function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <>
            <span className="text-[var(--mute)] font-medium">{label}</span>
            <span className="text-right font-semibold text-[var(--ink)]">{value || '—'}</span>
        </>
    );
}

export default function CardholderDetailsSidebarComponent({
    isOpen,
    onClose,
    cardholder,
}: CardholderDetailsSidebarComponentPropsType) {
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

    if (!isOpen || !cardholder) return null;

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity duration-200"
                onClick={onClose}
            />

            {/* Right Drawer Panel */}
            <div className="relative z-10 w-full max-w-md h-full bg-[var(--bg-surface)] border-l border-[var(--line)] shadow-2xl flex flex-col overflow-y-auto animate-[slideInRight_0.25s_ease-out]">
                <style>{`
                    @keyframes slideInRight {
                        from { transform: translateX(100%); }
                        to { transform: translateX(0); }
                    }
                `}</style>

                {/* Sidebar Header */}
                <div className="p-6! border-b border-[var(--line)] flex items-center justify-between bg-[var(--bg-surface)]">
                    <h3 className="text-xl font-normal text-[var(--ink)] tracking-normal">
                        <span className="font-serif font-medium">Cardholder</span>{' '}
                        <span className="font-serif italic font-normal">details</span>
                    </h3>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1.5! rounded-lg text-[var(--mute)] hover:text-[var(--ink)] hover:bg-[var(--bg-hover)] transition-colors cursor-pointer"
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
                            {cardholder.full_name}
                        </h2>
                        <p className="text-sm text-[var(--mute)]">{cardholder.email}</p>
                    </div>

                    {/* Section: STATUS */}
                    <div className="flex flex-col gap-3 pt-4! border-t border-[var(--line)]">
                        <div className="text-xs font-semibold text-[var(--mute)] uppercase tracking-wider">
                            <span>— STATUS</span>
                        </div>
                        <div className="grid grid-cols-2 gap-y-3 text-xs">
                            <span className="text-[var(--mute)] font-medium">KYC Status</span>
                            <span className="text-right">
                                <span
                                    className={`inline-flex items-center px-2! py-0.5! rounded-full text-[10px] font-semibold uppercase tracking-wide ${KYC_STATUS_STYLES[cardholder.kyc_status] ?? 'bg-gray-100 text-gray-600'}`}
                                >
                                    {cardholder.kyc_status}
                                </span>
                            </span>

                            <span className="text-[var(--mute)] font-medium">Account Status</span>
                            <span className="text-right">
                                <span
                                    className={`inline-flex items-center px-2! py-0.5! rounded-full text-[10px] font-semibold uppercase tracking-wide ${STATUS_STYLES[cardholder.status] ?? 'bg-gray-100 text-gray-600'}`}
                                >
                                    {cardholder.status}
                                </span>
                            </span>
                        </div>
                    </div>

                    {/* Section: PERSONAL */}
                    <div className="flex flex-col gap-3 pt-4! border-t border-[var(--line)]">
                        <div className="text-xs font-semibold text-[var(--mute)] uppercase tracking-wider">
                            <span>— PERSONAL</span>
                        </div>
                        <div className="grid grid-cols-2 gap-y-3 text-xs">
                            <DetailRow label="Full Name" value={cardholder.full_name} />
                            <DetailRow label="Gender" value={cardholder.gender} />
                            <DetailRow
                                label="Date of Birth"
                                value={formatDate(cardholder.date_of_birth)}
                            />
                        </div>
                    </div>

                    {/* Section: CONTACT */}
                    <div className="flex flex-col gap-3 pt-4! border-t border-[var(--line)]">
                        <div className="text-xs font-semibold text-[var(--mute)] uppercase tracking-wider">
                            <span>— CONTACT</span>
                        </div>
                        <div className="grid grid-cols-2 gap-y-3 text-xs">
                            <DetailRow label="Email" value={cardholder.email} />
                            <DetailRow
                                label="Phone"
                                value={`${cardholder.mobile_country_code} ${cardholder.phone_number}`}
                            />
                            <DetailRow label="Country Code" value={cardholder.mobile_country_name} />
                        </div>
                    </div>

                    {/* Section: PROGRAM */}
                    <div className="flex flex-col gap-3 pt-4! border-t border-[var(--line)]">
                        <div className="text-xs font-semibold text-[var(--mute)] uppercase tracking-wider">
                            <span>— PROGRAM</span>
                        </div>
                        <div className="grid grid-cols-2 gap-y-3 text-xs">
                            <DetailRow label="Business" value={cardholder.business_name} />
                            <DetailRow label="Program Type" value={cardholder.program_type} />
                            <DetailRow
                                label="Cardholder ID"
                                value={cardholder.cardholder_id ?? '—'}
                            />
                        </div>
                    </div>

                    {/* Section: SECURITY */}
                    <div className="flex flex-col gap-3 pt-4! border-t border-[var(--line)]">
                        <div className="text-xs font-semibold text-[var(--mute)] uppercase tracking-wider">
                            <span>— SECURITY</span>
                        </div>
                        <div className="grid grid-cols-2 gap-y-3 text-xs">
                            <DetailRow
                                label="Email Verified"
                                value={cardholder.is_email_verified === 'Y' ? 'Yes' : 'No'}
                            />
                            <DetailRow
                                label="2FA Enabled"
                                value={cardholder.is_2fa_enabled === 'Y' ? 'Yes' : 'No'}
                            />
                            <DetailRow
                                label="2FA Type"
                                value={cardholder.two_fa_type ?? '—'}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
