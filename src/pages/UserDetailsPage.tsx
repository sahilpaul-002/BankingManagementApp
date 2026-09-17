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
import type { UserDetailsType } from '@/types/user/userDetailsPageTypes';

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
    const { data: getUserData, isFetching: getUserDetailsIsFetching, isError: getUserDetailsIsError, error: getUserDetailsError, isSuccess: getUserDetailsIsSuccess, refetch: refetchGetUserDetails } = useGetUserDetailsQuery({ email: userEmail! }, { skip: !userEmail });
    const userDetails = getUserData?.data as UserDetailsType ?? {};

    useEffect(() => {
        ShowInConsole("User onboarding details", userDetails);
    }, [userDetails])
    // ----------------------------------------- XXXXXXXXXXXXXXXXXXXXXX ----------------------------------------- \\

    // ----------------------------------- Get User Onboarding Details ----------------------------------- \\
    // Get User Onboarding Details
    const { data: getOnboardingData, isFetching: getOnboardingDetailsIsFetching, isError: getOnboardingDetailsIsError, error: getOnboardingDetailsError, isSuccess: getOnboardingDetailsIsSuccess, refetch: refetchGetOnboardingDetails } = useGetUserOnboardingDetailsQuery({ email: userEmail! }, { skip: !userEmail });
    const userOnboardingDetails = getOnboardingData?.data as Record<string, any> ?? {};
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
        getOnboardingDetailsError?.data.status === "NOT_FOUND";

    const kybApproved = isKybApproved(getOnboardingData?.data);

    useEffect(() => {
        ShowInConsole("User onboarding details", userOnboardingDetails);
    }, [userOnboardingDetails])
    // ----------------------------------------- XXXXXXXXXXXXXXXXXXXXXX ----------------------------------------- \\
    const showUserDetailsPageLoader = getOnboardingDetailsIsFetching || getUserDetailsIsFetching

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

            {/* Main Content */}
            <Activity>
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
                                        className={`w-full relative px-5! py-3.5! text-sm font-semibold tracking-normal transition-colors duration-150 cursor-pointer border-b-2 -mb-px!
                                    ${isActive ? 'text-[var(--ink)] border-[var(--gold)]' : 'text-[var(--mute)] border-transparent hover:text-[var(--ink-soft)] hover:border-[var(--line-strong)]'}`}
                                    >
                                        {tab.label}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Tab Content */}
                        <div className="p-6! sm:p-8!">
                            <Activity mode={activeTab === 'personal' ? 'visible' : 'hidden'}>
                                {getUserDetailsIsFetching ? (
                                    <div className="w-full h-full hashLoaderContainer relative z-10 animate-fade-in">
                                        <RingSpinnerLoaderComponent visible={getUserDetailsIsFetching} size={30} color={getComputedStyle(document.documentElement).getPropertyValue("--nav-bg").trim()} />
                                    </div>
                                ) : userDetails ? (
                                    <PersonalDetailsComponent userDetails={userDetails} />
                                ) : (
                                    <div className="text-sm text-[var(--mute)]">
                                        <DetailsEmptyState type="personal" />
                                    </div>
                                )}
                            </Activity>

                            <Activity mode={activeTab === 'address' ? 'visible' : 'hidden'}>
                                {getOnboardingDetailsIsFetching ? (
                                    <div className="w-full h-full hashLoaderContainer relative z-10 animate-fade-in">
                                        <RingSpinnerLoaderComponent visible={getOnboardingDetailsIsFetching} size={30} color={getComputedStyle(document.documentElement).getPropertyValue("--nav-bg").trim()} />
                                    </div>
                                ) : addressDetails ? (
                                    <AddressDetailsComponent addressDetails={addressDetails} />
                                ) : (
                                    <div className="text-sm text-[var(--mute)]">
                                        <DetailsEmptyState type="address" />
                                    </div>
                                )}
                            </Activity>

                            <Activity mode={activeTab === 'bank' ? 'visible' : 'hidden'}>
                                {getOnboardingDetailsIsFetching ? (
                                    <div className="w-full h-full hashLoaderContainer relative z-10 animate-fade-in">
                                        <RingSpinnerLoaderComponent visible={getOnboardingDetailsIsFetching} size={30} color={getComputedStyle(document.documentElement).getPropertyValue("--nav-bg").trim()} />
                                    </div>
                                ) : bankDetails ? (
                                    <BankDetailsComponent bankDetails={bankDetails} />
                                ) : (
                                    <div className="text-sm text-[var(--mute)]">
                                        <DetailsEmptyState type="bank" />
                                    </div>
                                )}
                            </Activity>
                        </div>
                    </div>
                </div>
            </Activity>
        </>
    );
}
