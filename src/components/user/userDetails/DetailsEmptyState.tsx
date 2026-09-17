import { Building2, MapPin, UserRound } from 'lucide-react';

interface DetailsEmptyStatePropsType {
    type: 'personal' | 'address' | 'bank';
}

export default function DetailsEmptyState({
    type,
}: DetailsEmptyStatePropsType) {
    const isPersonal = type === 'personal';
    const isAddress = type === 'address';

    const Icon = isPersonal
        ? UserRound
        : isAddress
            ? MapPin
            : Building2;

    const title = isPersonal
        ? 'No personal details available'
        : isAddress
            ? 'No address details available'
            : 'No bank details available';

    const description = isPersonal
        ? 'Your personal details have not been available yet.'
        : isAddress
            ? 'Your billing and delivery address details have not been available yet.'
            : 'Your linked bank account details have not been available yet.';

    return (
        <div className="w-full min-h-[280px] flex items-center justify-center">
            <div className="w-full max-w-md flex flex-col items-center justify-center text-center px-6! py-10!">
                <div className="w-14 h-14 flex items-center justify-center rounded-full bg-[var(--bg-subtle)] border border-[var(--line)] mb-4!">
                    <Icon className="w-6 h-6 text-[var(--mute)]" />
                </div>

                <h3 className="text-sm font-semibold text-[var(--ink)]">
                    {title}
                </h3>

                <p className="mt-1.5! max-w-sm text-xs leading-5 text-[var(--mute)]">
                    {description}
                </p>
            </div>
        </div>
    );
}