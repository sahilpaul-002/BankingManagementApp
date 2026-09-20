import React, { Activity, useEffect, useState } from 'react';
import KycNotAvailableComponent from '@/components/user/userVerification/KycNotAvailableComponent';
import KycStatusComponent from '@/components/user/userVerification/KycStatusComponent';
import KycUploadSidebarComponent from '@/components/user/userVerification/KycUploadSidebarComponent';
import { useNavigate } from 'react-router';
import { useDispatch } from 'react-redux';
import { setShowInfoBanner } from '@/redux/slice/utility/utilitySlice';
import { isKycApproved } from '@/utils/kycHelper';
import { useGetKycDetailsQuery } from '@/redux/features/kyc/kycApis';
import type { KycStatusDataType } from '@/types/user/userVerificationPageTypes';
import PageLoaderComponent from '@/components/common/loaders/PageLoaderComponent';

export default function UserVerificationPage() {
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

    // ----------------------------------- Get User Kyc Details ----------------------------------- \\
    // Get Kyc Verification Status
    const { data: getKycData, isLoading: getKycDetailsIsLoading, isFetching: getKycDetailsIsFetching, isError: getKycDetailsIsError, error: getKycDetailsError, isSuccess: getKycDetailsIsSuccess, refetch: refetchGetKycDetails } = useGetKycDetailsQuery({ email: userEmail! }, { skip: !userEmail });
    const userKycDetails = getKycData?.data as Record<string, any>;
    const userKycStatusData: KycStatusDataType = {
        email: userKycDetails?.email ?? userEmail ?? '',
        kyc_request_id: userKycDetails?.kyc_request_id ?? '',
        kyc_status: userKycDetails?.kyc_status ?? 'PENDING',
    };

    // Kyc not found error
    const isKycNotFound =
        getKycDetailsIsError &&
        getKycDetailsError &&
        "status" in getKycDetailsError &&
        getKycDetailsError.status === 404 &&
        typeof getKycDetailsError?.data === "object" &&
        getKycDetailsError?.data !== null &&
        "status" in getKycDetailsError?.data &&
        getKycDetailsError?.data?.status === "NOT_FOUND" &&
        "message" in getKycDetailsError.data &&
        typeof getKycDetailsError.data.message === "string" &&
        getKycDetailsError.data.message.toLowerCase() === "user kyc details not found";

    const kycApproved = isKycApproved(getKycData?.data);
    // ------------------------------ XXXXXXXXXXXXXXXXXXXXXXX ------------------------------ \\
    const showKycPageLoader =
        getKycDetailsIsLoading ||
        getKycDetailsIsFetching ||
        (!getKycData?.data && !isKycNotFound);

    // ------------------------------ Add Kyc Detials Helpers ------------------------------ \\
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const handleOpenSidebar = () => {
        setIsSidebarOpen(true);
    };

    const handleCloseSidebar = () => {
        setIsSidebarOpen(false);
    };
    // -------------------------------- XXXXXXXXXXXXXXXXXXXXXXXXX -------------------------------- \\

    return (
        <>
            {/* Page Loader */}
            <Activity mode={showKycPageLoader ? "visible" : "hidden"}>
                <PageLoaderComponent showPageLoader={showKycPageLoader} />
            </Activity>

            {/* Main Content */}
            <Activity mode={!showKycPageLoader ? "visible" : "hidden"}>
                <div className="userVerificationPage-container w-full h-fit flex flex-col justify-start items-stretch gap-4 p-4! sm:p-6!">
                    {/* Page Header */}
                    <div className="mb-2! flex items-center justify-between flex-wrap gap-4">
                        <div>
                            <h1 className="text-2xl font-semibold text-[var(--ink)] tracking-normal">KYC Verification</h1>
                            <p className="text-sm text-[var(--mute)] mt-1!">
                                Manage and track your identity and proof of address document verification status.
                            </p>
                        </div>
                    </div>

                    {/* Main Card */}
                    <div className="w-full bg-[var(--bg-surface)] border border-[var(--line)] rounded-xl shadow-sm overflow-hidden p-6! sm:p-8!">
                        {isKycNotFound ? (
                            <KycNotAvailableComponent onOpenSidebar={handleOpenSidebar} />
                        ) : (
                            <KycStatusComponent
                                kycData={userKycStatusData}
                                onOpenSidebar={handleOpenSidebar}
                                onRefresh={refetchGetKycDetails}
                                isRefreshing={getKycDetailsIsFetching}
                            />
                        )}
                    </div>

                    {/* Right Side Upload/Update KYC Drawer Sidebar */}
                    <KycUploadSidebarComponent
                        isOpen={isSidebarOpen}
                        onClose={handleCloseSidebar}
                    />
                </div>
            </Activity>
        </>
    );
}
