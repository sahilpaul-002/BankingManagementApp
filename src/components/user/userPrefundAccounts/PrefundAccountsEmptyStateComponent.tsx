import { Wallet } from 'lucide-react';

type PrefundingEmptyStateType = 'notFound' | 'fiat' | 'crypto';

const EMPTY_STATE_CONTENT: Record<PrefundingEmptyStateType, { title: string; description: string }> = {
    notFound: {
        title: 'Prefunding accounts not found',
        description: 'No active fiat or crypto prefunding account is available for your profile yet.',
    },
    fiat: {
        title: 'No fiat account available',
        description: 'A fiat prefunding account has not been set up for your profile yet.',
    },
    crypto: {
        title: 'No crypto accounts available',
        description: 'Crypto prefunding accounts have not been set up for your profile yet.',
    },
};

interface PrefundAccountsEmptyStateComponentPropsType {
    type: PrefundingEmptyStateType;
}

export default function PrefundAccountsEmptyStateComponent({ type }: PrefundAccountsEmptyStateComponentPropsType) {
    const { title, description } = EMPTY_STATE_CONTENT[type];

    return (
        <div
            id={`prefundingEmptyState-${type}`}
            className="w-full h-fit flex flex-col items-center justify-center text-center py-16! px-6!"
        >
            <div className="w-12 h-12 flex items-center justify-center rounded-full bg-[var(--bg-subtle)] border border-[var(--line)] mb-4!">
                <Wallet className="w-5 h-5 text-[var(--mute)]" />
            </div>

            <h3 className="text-base font-semibold text-[var(--ink)] tracking-normal">{title}</h3>
            <p className="text-xs text-[var(--mute)] mt-1! max-w-sm">{description}</p>
        </div>
    );
}