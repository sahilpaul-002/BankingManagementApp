import { Activity, useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { setShowInfoBanner } from '@/redux/slice/utility/utilitySlice';
import { useGetUserPrefundAccountsDetailsQuery } from '@/redux/features/user/userApi';
import ShowInConsole from '@/utils/ShowInConsole';
import PageLoaderComponent from '@/components/common/loaders/PageLoaderComponent';
import RingSpinnerLoaderComponent from '@/components/common/loaders/RingSpinnerLoaderComponent';
import type { UserPrefundAccountsDetailsType } from '@/types/user/userPrefundAccountsDetailsTypes';
import PrefundAccountsEmptyStateComponent from '@/components/user/userPrefundAccounts/PrefundAccountsEmptyStateComponent';
import PrefundAccountsTabsComponent from '@/components/user/userPrefundAccounts/PrefundAccountTabsComponent';
import FiatPrefundAccountDetailsComponent from '@/components/user/userPrefundAccounts/FiatPrefundAccountDetailsComponent';
import CryptoPrefundAccountsDetailsComponent from '@/components/user/userPrefundAccounts/CryptoPrefundAccountsDetailsComponent';

type TabId = 'fiat' | 'crypto';

const TABS: { id: TabId; label: string }[] = [
  { id: 'fiat', label: 'Fiat' },
  { id: 'crypto', label: 'Crypto' },
];

export default function UserPrefundingAccountsPage() {
  // Configure useDispatch
  const dispatch = useDispatch();

  // ------------------------------- GET DETAILS FROM SESSION STORAGE ---------------------------------- \\
  // Get necessary user details from session storage
  const userEmail = sessionStorage.getItem('userEmail');
  const userId = sessionStorage.getItem("userId")

  useEffect(() => {
    // Validate email and user id once
    if (!userEmail || !userId) {
      dispatch(setShowInfoBanner("Application facing issue, necessary user details not present in session storage. Please re-login."));
      return;
    }
  }, [userEmail, userId]);
  // ---------------------------------- XXXXXXXXXXXXXXXXXXXXXXXXXX ---------------------------------- \\

  // ----------------------------------- Get User Prefund Accounts Details ----------------------------------- \\
  // Get User Prefund Accounts Details
  const { data: getPrefundAccountsData, isLoading: getPrefundAccountsDetailsIsLoading, isFetching: getPrefundAccountsDetailsIsFetching, isError: getPrefundAccountsDetailsIsError, error: getPrefundAccountsDetailsError, isSuccess: getPrefundAccountsDetailsIsSuccess } = useGetUserPrefundAccountsDetailsQuery({ email: userEmail!, userId: userId! }, { skip: !userEmail || !userId });
  const userPrefundAccountsDetails = getPrefundAccountsData?.data as UserPrefundAccountsDetailsType | undefined;
  const userFiatDetails = userPrefundAccountsDetails?.fiat;
  const userCryptoDetails = userPrefundAccountsDetails?.crypto;

  // Prefund accounts not found error
  const userPrefundAccountsDetailsNotFound =
    getPrefundAccountsDetailsIsError &&
    getPrefundAccountsDetailsError &&
    "status" in getPrefundAccountsDetailsError &&
    getPrefundAccountsDetailsError?.status === 404 &&
    typeof getPrefundAccountsDetailsError?.data === "object" &&
    getPrefundAccountsDetailsError?.data !== null &&
    "status" in getPrefundAccountsDetailsError?.data &&
    getPrefundAccountsDetailsError?.data.status === "NOT_FOUND";

  useEffect(() => {
    ShowInConsole("User prefund accounts details", userPrefundAccountsDetails);
  }, [userPrefundAccountsDetails])
  // ----------------------------------------- XXXXXXXXXXXXXXXXXXXXXX ----------------------------------------- \\
  const showPrefundingAccountsPageLoader = getPrefundAccountsDetailsIsLoading

  // Active tab for available prefund accounts
  const [activeTab, setActiveTab] = useState<TabId>('fiat');

  return (
    <>
      {/* Page Loader */}
      <Activity mode={showPrefundingAccountsPageLoader ? "visible" : "hidden"}>
        <PageLoaderComponent showPageLoader={showPrefundingAccountsPageLoader} />
      </Activity>

      {/* Main Content Card */}
      <div className="w-full bg-[var(--bg-surface)] border border-[var(--line)] rounded-xl shadow-sm overflow-hidden">
        {userPrefundAccountsDetailsNotFound ? (
          <PrefundAccountsEmptyStateComponent type="notFound" />
        ) : (
          <>
            {/* Tab Navigation */}
            <PrefundAccountsTabsComponent
              tabs={TABS}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              idPrefix="userPrefundingAccountsPage"
              containerClassName="px-6!"
            />

            {/* Tab Content */}
            <div className="p-6! sm:p-8!">
              <Activity
                mode={activeTab === 'fiat' ? 'visible' : 'hidden'}
              >
                {getPrefundAccountsDetailsIsFetching ? (
                  <div className="w-full h-full hashLoaderContainer py-10! relative z-10 animate-fade-in">
                    <RingSpinnerLoaderComponent
                      visible={getPrefundAccountsDetailsIsFetching}
                      size={30}
                      color={getComputedStyle(document.documentElement)
                        .getPropertyValue('--nav-bg')
                        .trim()}
                    />
                  </div>
                ) : (
                  <FiatPrefundAccountDetailsComponent fiatDetails={userFiatDetails} />
                )}
              </Activity>

              <Activity
                mode={activeTab === 'crypto' ? 'visible' : 'hidden'}
              >
                {getPrefundAccountsDetailsIsFetching ? (
                  <div className="w-full h-full hashLoaderContainer py-10! relative z-10 animate-fade-in">
                    <RingSpinnerLoaderComponent
                      visible={getPrefundAccountsDetailsIsFetching}
                      size={30}
                      color={getComputedStyle(document.documentElement)
                        .getPropertyValue('--nav-bg')
                        .trim()}
                    />
                  </div>
                ) : (
                  <CryptoPrefundAccountsDetailsComponent cryptoDetails={userCryptoDetails} />
                )}
              </Activity>
            </div>
          </>
        )}
      </div>
    </>
  );
}