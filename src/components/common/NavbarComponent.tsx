import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ChevronDown, LayoutDashboard, Building2, Coins, Send, CreditCard, Settings, LogOut, UserCog, WalletMinimal } from 'lucide-react';
import { useappDispatchType } from '@/redux/hooks/reduxHooks';
import { logoutUser } from '@/redux/thunks/userThunks';
import { useSelector } from 'react-redux';
import { selectDnsConfigDetails } from '@/redux/slice/config/configSlice';
import { useLazyGetDnsConfigQuery } from '@/redux/features/config/configApi';
import CustomButtonComponent from './CustomButtonComponent';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

interface NavSection {
  section: string;
  items: string[];
}

const navigationData: NavSection[] = [
  {
    section: "Overview",
    items: ["Dashboard"]
  },
  {
    section: "Wallets",
    items: ["Deposit Wallets", "Currency Conversion", "Statements"]
  },
  {
    section: "Payables",
    items: ["Beneficiaries", "Payout"]
  },
  {
    section: "Cards",
    items: ["Cardholders", "Manage Cards"]
  },
  {
    section: "User",
    items: ["Details", "Verification"]
  }
];

const getSectionIcon = (section: string) => {
  const iconMap: Record<string, React.ReactNode> = {
    "Overview": <LayoutDashboard className="w-5 h-5" />,
    "Wallets": <WalletMinimal className="w-5 h-5" />,
    "Payables": <Send className="w-5 h-5" />,
    "Cards": <CreditCard className="w-5 h-5" />,
    "User": <UserCog className="w-5 h-5" />
  };
  return iconMap[section] || <LayoutDashboard className="w-5 h-5" />;
};

// Helper function to get the section for a given path
const getSectionForPath = (pathname: string): string => {
  const pathMap: Record<string, string> = {
    "/dashboard": "Overview",
    "/wallets/deposit": "Wallets",
    "/wallets/currencyConversion": "Wallets",
    "/wallets/statements": "Wallets",
    "/payables/beneficiaries": "Payables",
    "/payables/payout": "Payables",
    "/cards/cardholders": "Cards",
    "/cards/manageCards": "Cards",
    "/user": "User",
    "/user/verification": "User"
  };
  return pathMap[pathname] || "Overview";
};

export default function NavbarComponent() {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useappDispatchType();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // Get user email from sessionStorage
  useEffect(() => {
    const email = sessionStorage.getItem('userEmail');
    if (email) {
      setUserEmail(email);
    }
  }, []);

  // --------------------------------------- Get/Use DNS Data --------------------------------------- \\
  // Get dns data from redux
  const dnsData = useSelector(selectDnsConfigDetails)

  // Dns Config Data
  const domainName = window.location.hostname;
  const [triggerDnsConfig, { isFetching, data }] = useLazyGetDnsConfigQuery();
  useEffect(() => {
    if (!dnsData && !isFetching) {
      triggerDnsConfig({
        domainName: domainName,
      });
    }
  }, [dnsData, isFetching, triggerDnsConfig]);
  // ----------------------------------------- XXXXXXXXXXXXXXXXXXXXXX ----------------------------------------- \\

  // Initialize with the section that matches the current route
  const [expandedSections, setExpandedSections] = useState<string[]>(() => {
    return [getSectionForPath(location.pathname)];
  });

  // Sync expanded sections with active route
  useEffect(() => {
    const activeSection = getSectionForPath(location.pathname);
    setExpandedSections([activeSection]);
  }, [location.pathname]);

  // Responsive: collapse on screens < lg
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsCollapsed(true);
      } else {
        setIsCollapsed(false);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Function to handle navbar section toggle
  const toggleSection = (section: string) => {
    if (isCollapsed) {
      setIsCollapsed(false);
      return;
    }

    setExpandedSections(prev =>
      prev.includes(section)
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  // Function to handle section navigation
  const handleNavigation = (item: string) => {
    // Simple path mapping
    const pathMap: Record<string, string> = {
      "Dashboard": "/dashboard",
      "Deposit Wallets": "/wallets/deposit",
      "Currency Conversion": "/wallets/currencyConversion",
      "Statements": "/wallets/statements",
      "Beneficiaries": "/payables/beneficiaries",
      "Payout": "/payables/payout",
      "Cardholders": "/cards/cardholders",
      "Manage Cards": "/cards/manageCards",
      "Details": "/user",
      "Verification": "/user/verification",
    };

    const path = pathMap[item] || "/dashboard";
    navigate(path);
  };

  // Function to havle active navbar items
  const isItemActive = (item: string) => {
    const pathMap: Record<string, string> = {
      "Dashboard": "/dashboard",
      "Deposit Wallets": "/wallets/deposit",
      "Currency Conversion": "/wallets/currencyConversion",
      "Statements": "/wallets/statements",
      "Beneficiaries": "/payables/beneficiaries",
      "Payout": "/payables/payout",
      "Cardholders": "/cards/cardholders",
      "Manage Cards": "/cards/manageCards",
      "Details": "/user",
      "Verification": "/user/verification",
    };

    return location.pathname === pathMap[item];
  };

  // Function to handle signout
  const handleSignOut = () => {
    dispatch(logoutUser());
  };

  return (
    <div
      className={`${isCollapsed ? 'w-20' : 'w-64'} h-screen bg-[var(--nav-bg)] flex flex-col transition-all duration-300 ease-in-out`}
    >
      {/* Logo and Toggle */}
      <div className={`w-full h-fit border-b border-[var(--gold)] flex ${isCollapsed ? "justify-center" : (dnsData?.dashboard_name ? "justify-between" : "justify-center")} items-center p-4!`}>
        {(!isCollapsed) && (
          (!dnsData?.dashboard_name) ? (
            <div className="flex items-center gap-2">
              <span className="text-xl font-semibold text-[var(--nav-text-strong)]">
                UQP
                <span className='text-[var(--gold)]'>ay</span>
              </span>
            </div>
          ) : (
            <span className="text-xl font-semibold text-[var(--nav-text-strong)]">
              {dnsData?.dashboard_name?.slice(0, Math.ceil(dnsData?.dashboard_name.length / 2))}
              <span className="text-[var(--gold)]">
                {dnsData?.dashboard_name?.slice(Math.ceil(dnsData?.dashboard_name.length / 2))}
              </span>
            </span>
          )
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 rounded-lg hover:bg-opacity-10 hover:bg-white/10 transition-colors"
          style={{ color: 'var(--nav-text)' }}
        >
          {isCollapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <ChevronLeft className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Navigation Items */}
      <nav className="w-full h-fit flex-1 overflow-y-auto py-4!">
        {navigationData.map((section) => (
          <div key={section.section} className="w-full h-hit mb-2!">
            {/* Section Header */}
            <button
              onClick={() => toggleSection(section.section)}
              className={`w-full flex items-center gap-3 px-4! py-2.5! transition-colors text-[var(--nav-text)] ${isCollapsed ? 'justify-center' : 'justify-between'
                } hover:bg-opacity-10 hover:bg-white/10`}
            >
              <div className="flex justify-start items-center gap-3">
                {getSectionIcon(section.section)}
                {!isCollapsed && (
                  <span className="text-sm font-medium uppercase tracking-wide">
                    {section.section}
                  </span>
                )}
              </div>
              {!isCollapsed && (
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${expandedSections.includes(section.section) ? 'rotate-180' : ''
                    }`}
                />
              )}
            </button>

            {/* Section Items */}
            {!isCollapsed && expandedSections.includes(section.section) && (
              <div className="mt-1!">
                {section.items.map((item) => {
                  const active = isItemActive(item);
                  return (
                    <button
                      key={item}
                      onClick={() => handleNavigation(item)}
                      className={`w-full text-left px-4! py-2! pl-12! text-sm transition-colors cursor-pointer ${active
                        ? 'bg-[var(--nav-active)] font-medium text-[var(--nav-text-strong)]'
                        : 'bg-transparent font-normal text-[var(--nav-text)]'
                        }`}
                    >
                      {item}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Collapsed state: show items on hover */}
            {isCollapsed && (
              <div className="relative group">
                <div className="bg-[var(--nav-bg-2)] absolute left-full top-0 ml-2! hidden group-hover:block z-50 min-w-[200px] rounded-lg shadow-lg py-2!">
                  <div className="px-4! py-2! text-xs font-semibold text-[var(--nav-text-mute)] uppercase tracking-wide">
                    {section.section}
                  </div>
                  {section.items.map((item) => {
                    const active = isItemActive(item);
                    return (
                      <button
                        key={item}
                        onClick={() => { handleNavigation(item) }}
                        className={`w-full text-left px-4! py-2! text-sm transition-colors hover:bg-opacity-10 hover:bg-white/10 ${active ? 'bg-[var(--nav-active)] font-medium text-[var(--nav-text-strong)]' : 'bg-transparent font-normal text-[var(--nav-text)]'
                          }`}
                      >
                        {item}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* User Section - Bottom */}
      <div className="w-full h-fit border-t border-[var(--gold)] p-4!">
        {!isCollapsed && userEmail && (
          <div className="w-full h-fit">
            <p className="w-full h-fit text-xs text-[var(--nav-text-mute)] font-medium uppercase tracking-wide mb-1!">
              Logged in as
            </p>
            <p className="text-sm truncate" style={{ color: 'var(--nav-text)' }} title={userEmail}>
              {userEmail}
            </p>
          </div>
        )}

        {/* Separator */}
        <div className="separator-container w-full h-[2px] bg-[var(--gold)] rounded-[100%] mt-3! mb-3!"></div>

        {/* Signout Button */}
        <div className="navbar-signout-button-wrapper w-full h-fit flex justify-center items-center mt-6!">
          <div className="navbar-signout-button-container w-full h-[30px] sm:h-[40px]">
            <CustomButtonComponent id={"navbar-signout-button"} label={!isCollapsed ? "Sign Out" : <LogOut className="w-5 h-5" />} type="submit" variant={"navy"} />
          </div>
        </div>
      </div>
    </div>
  );
}
