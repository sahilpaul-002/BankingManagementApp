import { useState, useEffect, Activity } from 'react';
import { Plus } from 'lucide-react';
import CustomButtonComponent from '@/components/common/CustomButtonComponent';
import BeneficiariesListComponent from '@/components/payables/beneficiaries/BeneficiariesListComponent';
import BeneficiaryDetailsSidebarComponent from '@/components/payables/beneficiaries/BeneficiaryDetailsSidebarComponent';
import AddBeneficiarySidebarComponent from '@/components/payables/beneficiaries/AddBeneficiarySidebarComponent';
import { useGetBeneficiariesQuery } from '@/redux/features/beneficiaries/beneficiariesApi';
import { useDispatch } from 'react-redux';
import { setShowInfoBanner } from '@/redux/slice/utility/utilitySlice';
import type { BeneficiariesListResponseDataType, BeneficiaryItemType } from '@/types/payables/beneficiariesTypes';
import ShowInConsole from '@/utils/ShowInConsole';
import PageLoaderComponent from '@/components/common/loaders/PageLoaderComponent';
import type { PaginationState } from '@tanstack/react-table';

const DEFAULT_PAGINATION: PaginationState = {
    pageIndex: 0,
    pageSize: 7,
};

export default function BeneficiariesPage() {
    // Configure useDispatch
    const dispatch = useDispatch();

    // ------------------------------- GET EMAIL FROM SESSION STORAGE ---------------------------------- \\
    // Get necessary user details from session storage
    const userEmail = sessionStorage.getItem('userEmail');
    const userId = sessionStorage.getItem('userId');

    useEffect(() => {
        // Validate session storage once
        if (!userEmail || !userId) {
            dispatch(setShowInfoBanner('Application facing issue, necessary user details not present in session storage. Please re-login.'));
            return;
        }
    }, [userEmail, userId]);
    // ---------------------------------- XXXXXXXXXXXXXXXXXXXXXXXXXX ---------------------------------- \\

    // Pagination State
    const [pagination, setPagination] = useState<PaginationState>(DEFAULT_PAGINATION);

    // ------------------------------ GET BENEFICIARIES RTK QUERY ------------------------------ \\
    // Beneficiaries List
    const { data: getBeneficiariesData, isLoading: getBeneficiariesIsLoading, isFetching: getBeneficiariesIsFetching, isError: getBeneficiariesIsError, error: getBeneficiariesError } = useGetBeneficiariesQuery({ email: userEmail!, pageNumber: pagination.pageIndex + 1, pageSize: pagination.pageSize }, { skip: !userEmail });
    const beneficiariesResponseData = getBeneficiariesData?.data as BeneficiariesListResponseDataType ?? {};
    const beneficiariesList = beneficiariesResponseData?.beneficiaries as BeneficiaryItemType[] ?? [];
    const totalBeneficiaryCount = beneficiariesResponseData?.pagination?.total_records ?? 0;

    const isBeneficiariesNotFound =
        getBeneficiariesIsError &&
        getBeneficiariesError &&
        getBeneficiariesError != null &&
        'status' in getBeneficiariesError &&
        getBeneficiariesError?.status === 404 &&
        typeof getBeneficiariesError?.data === 'object' &&
        getBeneficiariesError?.data !== null &&
        'status' in getBeneficiariesError?.data &&
        (getBeneficiariesError?.data as { status: string }).status === 'NOT_FOUND';

    useEffect(() => {
        ShowInConsole('Beneficiaries list', beneficiariesResponseData as object);
    }, [beneficiariesResponseData]);
    // ------------------------------- XXXXXXXXXXXXXXXXXXXXXXXX ------------------------------- \\
    const showPageLoader = getBeneficiariesData ? getBeneficiariesIsLoading : getBeneficiariesIsFetching;

    // Selected beneficiary for details sidebar
    const [selectedBeneficiary, setSelectedBeneficiary] = useState<BeneficiaryItemType | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);

    // Add beneficiary sidebar state
    const [isAddSidebarOpen, setIsAddSidebarOpen] = useState(false);

    const handleSelectBeneficiary = (item: BeneficiaryItemType) => {
        setSelectedBeneficiary(item);
        setIsDetailsOpen(true);
    };

    const handleCloseDetails = () => {
        setIsDetailsOpen(false);
        setSelectedBeneficiary(null);
    };

    const handleOpenAddSidebar = () => setIsAddSidebarOpen(true);
    const handleCloseAddSidebar = () => setIsAddSidebarOpen(false);

    return (
        <>
            {/* Page Loader */}
            <Activity mode={showPageLoader ? 'visible' : 'hidden'}>
                <PageLoaderComponent showPageLoader={showPageLoader} />
            </Activity>

            {/* Main Content */}
            <div className="beneficiariesPage-container w-full h-fit flex flex-col justify-start items-stretch gap-6 p-4! sm:p-6!">
                {/* Header Section */}
                <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <h1 className="text-2xl sm:text-3xl text-[var(--ink)] tracking-normal">
                            <span className="font-serif font-medium">Company</span>{' '}
                            <span className="font-serif italic font-normal">Beneficiaries</span>
                        </h1>

                        <div className="w-[170px] h-[38px]">
                            <CustomButtonComponent
                                id="beneficiariesPage-addBeneficiary-btn"
                                label={
                                    <span className="flex items-center justify-center gap-1.5">
                                        <Plus className="w-4 h-4" /> Add beneficiary
                                    </span>
                                }
                                type="button"
                                variant="navy"
                                onClick={handleOpenAddSidebar}
                            />
                        </div>
                    </div>
                </div>

                {/* Beneficiaries List Component */}
                <BeneficiariesListComponent
                    beneficiaries={beneficiariesList}
                    onSelectBeneficiary={handleSelectBeneficiary}
                    beneficiariesNotFound={isBeneficiariesNotFound}
                    getBeneficiariesIsFetching={getBeneficiariesIsFetching}
                    totalCount={totalBeneficiaryCount}
                    pagination={pagination}
                    setPagination={setPagination}
                />

                {/* Beneficiary Details Sidebar Drawer */}
                <BeneficiaryDetailsSidebarComponent
                    isOpen={isDetailsOpen}
                    onClose={handleCloseDetails}
                    beneficiary={selectedBeneficiary}
                />

                {/* Add Beneficiary Sidebar Drawer */}
                <AddBeneficiarySidebarComponent
                    isOpen={isAddSidebarOpen}
                    onClose={handleCloseAddSidebar}
                />
            </div>
        </>
    );
}