import { Outlet, useLocation } from 'react-router-dom';
import NavbarComponent from '@/components/common/NavbarComponent';
import { Search, Bell, Globe } from 'lucide-react';
import CustomInputComponent from '@/components/common/CustomInputComponent';

interface BreadcrumbData {
  section?: string;
  page: string;
}

const pageNameMap: Record<string, BreadcrumbData> = {
  "/dashboard": {
    page: "Dashboard",
  },

  // Wallets
  "/wallets/deposit": {
    section: "Wallets",
    page: "Deposit Wallets",
  },
  "/wallets/currencyConversion": {
    section: "Wallets",
    page: "Currency Conversion",
  },
  "/wallets/statements": {
    section: "Wallets",
    page: "Statements",
  },

  // Payables
  "/payables/beneficiaries": {
    section: "Payables",
    page: "Beneficiaries",
  },
  "/payables/payout": {
    section: "Payables",
    page: "Payout",
  },

  // Cards
  "/cards/cardholders": {
    section: "Cards",
    page: "Cardholders",
  },
  "/cards/manageCards": {
    section: "Cards",
    page: "Manage Cards",
  },

  // User
  "/user": {
    section: "User",
    page: "Details",
  },
  "/user/verification": {
    section: "User",
    page: "Verification",
  },
};

const getBreadcrumbData = (pathname: string): BreadcrumbData => {
  // Payout details
  if (pathname.startsWith("/payables/payout/")) {
    return {
      section: "Payables",
      page: "Payout",
    };
  }

  // Card details
  if (pathname.startsWith("/cards/manageCards/")) {
    return {
      section: "Cards",
      page: "Manage Cards",
    };
  }

  return pageNameMap[pathname] || {
    page: "Dashboard",
  };
};

export default function DashboardLayout() {
  const location = useLocation();

  const currentPage = getBreadcrumbData(location.pathname);

  return (
    <div className="w-full h-screen bg-[var(--bg-app)] flex justify-start items-stretch overflow-hidden">
      {/* Navbar - Left Sidebar */}
      <NavbarComponent />

      {/* Main Content Area */}
      <div className="w-full h-full flex-1 flex flex-col overflow-hidden">

        {/* Topbar */}
        <div className="w-full h-16 border-b bg-[var(--bg-surface)] border border-[var(--line)] flex items-center justify-between px-10!">

          {/* Breadcrumb */}
          <div className="w-fit h-fit flex items-center gap-2 text-sm">

            {currentPage.section && (
              <>
                {/* <span className="text-[var(--mute)]"> */}
                <span className="text-[var(--gold)] font-extrabold!">
                  {currentPage.section}
                </span>

                <span className="text-[var(--mute)]">
                  ›
                </span>
              </>
            )}

            <span className="font-medium text-[var(--ink)] font-extrabold!">
              {currentPage.page}
            </span>

          </div>

          {/* Right Section */}
          <div className="w-fit h-fit flex items-center gap-4">

            {/* Search Input */}
            <div className="w-sm relative hidden lg:inline-block">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/4 w-4 h-4 text-[var(--mute)]"
              />

              <CustomInputComponent
                id="applicationSearch-input-email"
                type="text"
                placeholder="Search features, transactions, cards..."
                fieldLabelClassname="text-[var(--line-strong)]"
                inputClassname="pl-10! pr-4! py-2! w-full h-fit bg-[var(--bg-subtle)] border border-[var(--line)]! text-[var(--ink)] text-sm focus:outline-none focus:ring-1 focus-visible:ring-[var(--ink-2)]/80 focus-visible:border-[var(--ink-2)]"
              />
            </div>

            {/* Notification Icon */}
            <button
              type="button"
              className="p-2! bg-[var(--bg-hover)] rounded-lg hover:bg-opacity-50 transition-colors relative"
            >
              <Bell className="w-5 h-5 text-[var(--ink)]" />

              <span className="bg-[var(--danger)] absolute top-1 right-1 w-2 h-2 rounded-full" />
            </button>

            {/* Language/Globe Icon */}
            <button
              type="button"
              className="p-2! bg-[var(--bg-hover)] rounded-lg hover:bg-opacity-50 transition-colors"
            >
              <Globe className="w-5 h-5 text-[var(--ink)]" />
            </button>

          </div>
        </div>

        {/* Page Content */}
        <div className="w-full h-screen min-h-0 flex-1 px-2! sm:px-4! py-2! overflow-scroll">
          <Outlet />
        </div>

      </div>
    </div>
  );
}