import { Activity, useEffect, useState } from 'react';
import PersonalDetailsComponent from '@/components/user/userDetails/PersonalDetailsComponent';
import AddressDetailsComponent from '@/components/user/userDetails/AddressDetailsComponent';
import BankDetailsComponent from '@/components/user/userDetails/BankDetailsComponent';
import { useNavigate } from 'react-router';
import { useDispatch } from 'react-redux';
import { setShowInfoBanner } from '@/redux/slice/utility/utilitySlice';
import { useGetUserDetailsQuery, useGetUserOnboardingDetailsQuery } from '@/redux/features/user/userApi';
import { isKybApproved } from '@/utils/kybHelper';
import ShowInConsole from '@/utils/ShowInConsole';
import PageLoaderComponent from '@/components/common/loaders/PageLoaderComponent';
import DetailsEmptyState from '@/components/user/userDetails/DetailsEmptyState';
import RingSpinnerLoaderComponent from '@/components/common/loaders/RingSpinnerLoaderComponent';
import type { UserDetailsType, UserOnboardingDetailsType } from '@/types/user/userDetailsPageTypes';
import OnboardingDetailsEmptyState from '@/components/user/userDetails/OnboardingDetailsEmptyState';
import AddOnboardingDetailsSidebarComponent from '@/components/user/userDetails/AddOnboardingDetailsSidebarComponent';

type TabId = 'personal' | 'address' | 'bank';

const TABS: { id: TabId; label: string }[] = [
    { id: 'personal', label: 'Personal' },
    { id: 'address', label: 'Address' },
    { id: 'bank', label: 'Bank' },
];

export default function UserDetailsPage() {
    // Configure useNavigate
    const navigate = useNavigate();

    // Configure useDispatch
    const dispatch = useDispatch();

    // ------------------------------- GET EMAL FROM SESSION STORAGE ---------------------------------- \\
    // Get necessary user details from session storage
    const userEmail = sessionStorage.getItem('userEmail');
    const userId = sessionStorage.getItem("userId")
    const userCardholderId = sessionStorage.getItem("cardholderId")

    useEffect(() => {
        // Validate email once
        if (!userEmail || !userId || !userCardholderId) {
            dispatch(setShowInfoBanner("Application facing issue, necessary user details not present in session storage. Please re-login."));
            return;
        }
    }, [userEmail, userId, userCardholderId]);
    // ---------------------------------- XXXXXXXXXXXXXXXXXXXXXXXXXX ---------------------------------- \\

    // ----------------------------------- Get User Details ----------------------------------- \\
    // Get User  Details
    const { data: getUserData, isLoading: getUserDetailsIsLoading, isFetching: getUserDetailsIsFetching, isError: getUserDetailsIsError, error: getUserDetailsError, isSuccess: getUserDetailsIsSuccess, refetch: refetchGetUserDetails } = useGetUserDetailsQuery({ email: userEmail! }, { skip: !userEmail });
    const userDetails = getUserData?.data as UserDetailsType | undefined;

    useEffect(() => {
        ShowInConsole("User onboarding details", userDetails);
    }, [userDetails])
    // ----------------------------------------- XXXXXXXXXXXXXXXXXXXXXX ----------------------------------------- \\

    // ----------------------------------- Get User Onboarding Details ----------------------------------- \\
    // Get User Onboarding Details
    const { data: getOnboardingData, isLoading: getOnboardingDetailsIsLoading, isFetching: getOnboardingDetailsIsFetching, isError: getOnboardingDetailsIsError, error: getOnboardingDetailsError, isSuccess: getOnboardingDetailsIsSuccess, refetch: refetchGetOnboardingDetails } = useGetUserOnboardingDetailsQuery({ email: userEmail! }, { skip: !userEmail });
    const userOnboardingDetails = getOnboardingData?.data as UserOnboardingDetailsType | undefined;
    const addressDetails = userOnboardingDetails?.addressDetails;
    const bankDetails = userOnboardingDetails?.bankDetails;

    // Onboarding details not found error
    const isOnboardingDetailsNotFound =
        getOnboardingDetailsIsError &&
        getOnboardingDetailsError &&
        "status" in getOnboardingDetailsError &&
        getOnboardingDetailsError?.status === 404 &&
        typeof getOnboardingDetailsError?.data === "object" &&
        getOnboardingDetailsError?.data !== null &&
        "status" in getOnboardingDetailsError?.data &&
        getOnboardingDetailsError?.data.status === "NOT_FOUND" &&
        "message" in getOnboardingDetailsError.data &&
        typeof getOnboardingDetailsError.data.message === "string" &&
        getOnboardingDetailsError.data.message.toLowerCase() === "user onboarding details not found";

    const kybApproved = isKybApproved(getOnboardingData?.data);

    useEffect(() => {
        ShowInConsole("User onboarding details", userOnboardingDetails);
    }, [userOnboardingDetails])
    // ----------------------------------------- XXXXXXXXXXXXXXXXXXXXXX ----------------------------------------- \\
    // const showUserDetailsPageLoader = getOnboardingDetailsIsFetching || getUserDetailsIsFetching
    const showUserDetailsPageLoader = getOnboardingDetailsIsLoading || getUserDetailsIsLoading

    // ------------------------------ Add Onboarding Detials Helpers ------------------------------ \\
    // Sidebar state for unavailbale onboarding details 
    const [isOnboardingSidebarOpen, setIsOnboardingSidebarOpen] = useState(false);

    const handleOpenOnboardingSidebar = () => {
        setIsOnboardingSidebarOpen(true);
    };

    const handleCloseOnboardingSidebar = () => {
        setIsOnboardingSidebarOpen(false);
    };
    // -------------------------------- XXXXXXXXXXXXXXXXXXXXXXXXXXXx -------------------------------- \\

    // Active for available onboarding details
    const [activeTab, setActiveTab] = useState<TabId>('personal');

    return (
        <>
            {/* Page Loader */}
            <Activity mode={showUserDetailsPageLoader ? "visible" : "hidden"}>
                <PageLoaderComponent showPageLoader={showUserDetailsPageLoader} />
            </Activity>

            {/* Main Content Card */}
            <div className="w-full bg-[var(--bg-surface)] border border-[var(--line)] rounded-xl shadow-sm overflow-hidden">
                {isOnboardingDetailsNotFound ? (
                    <OnboardingDetailsEmptyState onAddOnboarding={handleOpenOnboardingSidebar} />
                ) : (
                    <>
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
                                        className={`w-full relative px-5! py-3.5! text-sm font-semibold tracking-normal transition-colors duration-150 cursor-pointer border-b-2 -mb-px!
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

                        {/* Tab Content */}
                        <div className="p-6! sm:p-8!">
                            <Activity
                                mode={activeTab === 'personal' ? 'visible' : 'hidden'}
                            >
                                {getUserDetailsIsFetching ? (
                                    <div className="w-full h-full hashLoaderContainer py-10! relative z-10 animate-fade-in">
                                        <RingSpinnerLoaderComponent
                                            visible={getUserDetailsIsFetching}
                                            size={30}
                                            color={getComputedStyle(document.documentElement)
                                                .getPropertyValue('--nav-bg')
                                                .trim()}
                                        />
                                    </div>
                                ) : userDetails ? (
                                    <PersonalDetailsComponent userDetails={userDetails} />
                                ) : (
                                    <DetailsEmptyState type="personal" />
                                )}
                            </Activity>

                            <Activity
                                mode={activeTab === 'address' ? 'visible' : 'hidden'}
                            >
                                {getOnboardingDetailsIsFetching ? (
                                    <div className="w-full h-full hashLoaderContainer py-10! relative z-10 animate-fade-in">
                                        <RingSpinnerLoaderComponent
                                            visible={getOnboardingDetailsIsFetching}
                                            size={30}
                                            color={getComputedStyle(document.documentElement)
                                                .getPropertyValue('--nav-bg')
                                                .trim()}
                                        />
                                    </div>
                                ) : addressDetails && bankDetails ? (
                                    <AddressDetailsComponent
                                        addressDetails={addressDetails}
                                        bankDetails={bankDetails!}
                                        kybApproved={kybApproved}
                                        userEmail={userEmail!}
                                    />
                                ) : (
                                    <DetailsEmptyState type="address" />
                                )}
                            </Activity>

                            <Activity
                                mode={activeTab === 'bank' ? 'visible' : 'hidden'}
                            >
                                {getOnboardingDetailsIsFetching ? (
                                    <div className="w-full h-full hashLoaderContainer py-10! relative z-10 animate-fade-in">
                                        <RingSpinnerLoaderComponent
                                            visible={getOnboardingDetailsIsFetching}
                                            size={30}
                                            color={getComputedStyle(document.documentElement)
                                                .getPropertyValue('--nav-bg')
                                                .trim()}
                                        />
                                    </div>
                                ) : bankDetails && addressDetails ? (
                                    <BankDetailsComponent
                                        bankDetails={bankDetails}
                                        addressDetails={addressDetails!}
                                        kybApproved={kybApproved}
                                        userEmail={userEmail!}
                                    />
                                ) : (
                                    <DetailsEmptyState type="bank" />
                                )}
                            </Activity>
                        </div>
                    </>
                )}
            </div>

            {/* Add Onboarding Details Sidebar */}
            <AddOnboardingDetailsSidebarComponent
                isOpen={isOnboardingSidebarOpen}
                onClose={handleCloseOnboardingSidebar}
            />
        </>
    );
}
