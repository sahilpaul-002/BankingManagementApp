interface CryptoNetworkTabsComponentPropsType {
    tabs: { id: string; label: string; count?: number }[];
    activeTab: string;
    onTabChange: (tabId: string) => void;
    idPrefix: string;
    containerClassName?: string;
}

export default function CryptoNetworkTabsComponent({
    tabs,
    activeTab,
    onTabChange,
    idPrefix,
    containerClassName = '',
}: CryptoNetworkTabsComponentPropsType) {
    return (
        <div
            role="tablist"
            className={`cryptoNetworkTabs-wrapper inline-flex max-w-full items-center gap-1 p-1! overflow-x-auto rounded-lg border border-[var(--line)] bg-[var(--bg-subtle)] ${containerClassName}`}
        >
            {tabs.map((tab) => {
                const isActive = activeTab === tab.id;

                return (
                    <button
                        key={tab.id}
                        id={`${idPrefix}-tab-${tab.id}`}
                        role="tab"
                        aria-selected={isActive}
                        type="button"
                        onClick={() => onTabChange(tab.id)}
                        className={`flex items-center gap-2 px-4! py-2! rounded-md border text-xs font-semibold tracking-wide whitespace-nowrap transition-colors duration-150 cursor-pointer
                                ${isActive
                                ? 'bg-[var(--bg-surface)] text-[var(--ink)] border-[var(--line)] shadow-sm'
                                : 'bg-transparent text-[var(--mute)] border-transparent hover:text-[var(--ink-soft)]'
                            }`}
                    >
                        {/* Active network indicator dot */}
                        <span
                            className={`w-1.5 h-1.5 rounded-full transition-colors duration-150 ${isActive ? 'bg-[var(--nav-active)]' : 'bg-[var(--line-strong)]'}`}
                        />

                        {tab.label}

                        {/* Number of accounts under this network */}
                        {typeof tab.count === 'number' && (
                            <span
                                className={`min-w-5 h-5 px-1.5! inline-flex items-center justify-center rounded-full text-[10px] font-semibold
                                    ${isActive
                                        ? 'bg-[var(--bg-subtle)] text-[var(--ink)]'
                                        : 'bg-[var(--bg-surface)] text-[var(--mute)]'
                                    }`}
                            >
                                {tab.count}
                            </span>
                        )}
                    </button>
                );
            })}
        </div>
    );
}