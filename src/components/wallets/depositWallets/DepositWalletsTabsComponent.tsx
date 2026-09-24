interface DepositWalletsTabsComponentPropsType<T extends string> {
    tabs: { id: T; label: string }[];
    activeTab: T;
    onTabChange: (tabId: T) => void;
    idPrefix: string;
    containerClassName?: string;
}

export default function DepositWalletsTabsComponent<T extends string>({
    tabs,
    activeTab,
    onTabChange,
    idPrefix,
    containerClassName = '',
}: DepositWalletsTabsComponentPropsType<T>) {
    return (
        <div className={`flex items-end border-b border-[var(--line)] ${containerClassName}`}>
            {tabs.map((tab) => {
                const isActive = activeTab === tab.id;

                return (
                    <button
                        key={tab.id}
                        id={`${idPrefix}-tab-${tab.id}`}
                        type="button"
                        onClick={() => onTabChange(tab.id)}
                        className={`w-full relative px-5! py-3.5! text-sm font-semibold tracking-normal transition-colors duration-150 cursor-pointer border-b-2 -mb-px! whitespace-nowrap
                                ${isActive
                                ? 'text-[var(--ink)] border-[var(--gold)]'
                                : 'text-[var(--mute)] border-transparent hover:text-[var(--ink-soft)] hover:border-[var(--line-strong)]'
                            }`}
                    >
                        {tab.label}
                    </button>
                );
            })}
        </div>
    );
}