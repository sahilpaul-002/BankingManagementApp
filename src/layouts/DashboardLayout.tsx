import { Outlet, useLocation } from 'react-router-dom';
import NavbarComponent from '@/components/common/NavbarComponent';
import { Search, Bell, Globe } from 'lucide-react';
import CustomInputComponent from '@/components/common/CustomInputComponent';

const pageNameMap: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/accounts/depositAccounts": "Deposit Accounts",
  "/accounts/currencyConversion": "Currency Conversion",
  "/accounts/statements": "Statements",
  "/buy-sell": "Buy / Sell",
  "/earn": "Earn",
  "/swap": "Swap",
  "/beneficiaries": "Beneficiaries",
  "/send-money": "Send Money",
  "/cardholders": "Cardholders",
  "/manage-cards": "Manage Cards",
  "/funding-sources": "Funding Sources",
  "/verification": "Verification",
  "/settings": "Settings"
};

export default function DashboardLayout() {
  const location = useLocation();
  const pageName = pageNameMap[location.pathname] || "Dashboard";

  return (
    <div className="w-full h-screen bg-[var(--bg-app)] flex justify-start items-stretch overflow-hidden">
      {/* Navbar - Left Sidebar */}
      <NavbarComponent />

      {/* Main Content Area */}
      <div className="w-full h-full flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <div className="w-full h-16 border-b bg-[var(--bg-surface)] border border-[var(--line)] flex items-center justify-between px-10!" >
          {/* Page Name */}
          <h1 className="w-fit h-fit text-xl text-[var(--ink)] font-semibold">
            {pageName}
          </h1>

          {/* Right Section: Search, Notification, Language */}
          <div className="w-fit h-fit flex items-center gap-4">
            {/* Search Input */}
            <div className="w-sm relative hidden lg:inline-block">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/4 w-4 h-4 text-[var(--mute)]"
              />
              <CustomInputComponent id={"applicationSearch-input-email"} type={"text"} placeholder={"Search features, transactions, cards..."} fieldLabelClassname={"text-[var(--line-strong)]"} inputClassname={"pl-10! pr-4! py-2! w-full h-fit bg-[var(--bg-subtle)] border border-[var(--line)]! text-[var(--ink)] text-sm focus:outline-none focus:ring-1 focus-visible:ring-[var(--ink-2)]/80 focus-visible:border-[var(--ink-2)]"}/>
            </div>

            {/* Notification Icon */}
            <button
              className="p-2! bg-[var(--bg-hover)] rounded-lg hover:bg-opacity-50 transition-colors relative"
            >
              <Bell className="w-5 h-5 text-[var(--ink)]" />
              {/* Notification Badge */}
              <span
                className="bg-[var(--danger)] absolute top-1 right-1 w-2 h-2 rounded-full"
              />
            </button>

            {/* Language/Globe Icon */}
            <button
              className="p-2! bg-[var(--bg-hover)] rounded-lg hover:bg-opacity-50 transition-colors"
            >
              <Globe className="w-5 h-5 text-[var(--ink)]" />
            </button>
          </div>
        </div>

        {/* Page Content - Outlet */}
        {/* <div className="w-full h-full flex-1 overflow-y-auto p-6!"> */}
        <div className="w-full h-screen min-h-0 bg-green-400 flex-1 px-2! sm:px-4! py-2!">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
