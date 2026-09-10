import { Activity, useState } from 'react';
import PersonalDetailsComponent from '@/components/settings/userDetails/PersonalDetailsComponent';
import AddressDetailsComponent from '@/components/settings/userDetails/AddressDetailsComponent';
import BankDetailsComponent from '@/components/settings/userDetails/BankDetailsComponent';

type TabId = 'personal' | 'address' | 'bank';

const TABS: { id: TabId; label: string }[] = [
    { id: 'personal', label: 'Personal' },
    { id: 'address', label: 'Address' },
    { id: 'bank', label: 'Bank' },
];

export default function UserDetailsPage() {
    const [activeTab, setActiveTab] = useState<TabId>('personal');

    return (
        <div className="userDetailsPage-container w-full h-fit flex flex-col justify-start items-stretch gap-4 p-4! sm:p-6!">
            {/* Page Header */}
            <div className="mb-2!">
                <h1 className="text-2xl font-semibold text-[var(--ink)] tracking-normal">Account Settings</h1>
                <p className="text-sm text-[var(--mute)] mt-1!">
                    View and manage your profile, address and banking information.
                </p>
            </div>

            {/* Card */}
            <div className="w-full bg-[var(--bg-surface)] border border-[var(--line)] rounded-xl shadow-sm overflow-hidden">
                {/* Tab Navigation */}
                <div className="flex items-end border-b border-[var(--line)] px-6!">
                    {TABS.map((tab) => {
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                id={`userDetailsPage-tab-${tab.id}`}
                                type="button"
                                onClick={() => setActiveTab(tab.id)}
                                className={`
                                    relative px-5! py-3.5! text-sm font-semibold tracking-normal transition-colors duration-150 cursor-pointer
                                    border-b-2 -mb-px!
                                    ${isActive
                                        ? 'text-[var(--ink)] border-[var(--gold)]'
                                        : 'text-[var(--mute)] border-transparent hover:text-[var(--ink-soft)] hover:border-[var(--line-strong)]'
                                    }
                                `}
                            >
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                {/* Tab Content */}
                <div className="p-6! sm:p-8!">
                    <Activity mode={activeTab === 'personal' ? 'visible' : 'hidden'}>
                        <PersonalDetailsComponent />
                    </Activity>

                    <Activity mode={activeTab === 'address' ? 'visible' : 'hidden'}>
                        <AddressDetailsComponent />
                    </Activity>

                    <Activity mode={activeTab === 'bank' ? 'visible' : 'hidden'}>
                        <BankDetailsComponent />
                    </Activity>
                </div>
            </div>
        </div>
    );
}
