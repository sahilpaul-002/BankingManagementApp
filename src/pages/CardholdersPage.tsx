import { useState, useEffect, Activity } from 'react';
import { Plus } from 'lucide-react';
import CustomButtonComponent from '@/components/common/CustomButtonComponent';
import CardholdersListComponent from '@/components/cards/cardholders/CardholdersListComponent';
import CardholderDetailsSidebarComponent from '@/components/cards/cardholders/CardholderDetailsSidebarComponent';
import AddCardholderSidebarComponent from '@/components/cards/cardholders/AddCardholderSidebarComponent';
import { useGetCardholdersQuery } from '@/redux/features/cardholder/cardholdersApi';
import { useDispatch } from 'react-redux';
import { setShowInfoBanner } from '@/redux/slice/utility/utilitySlice';
import type { CardholdersListResponseDataType, CardholderItemType } from '@/types/cards/cardholderTypes';
import ShowInConsole from '@/utils/ShowInConsole';
import PageLoaderComponent from '@/components/common/loaders/PageLoaderComponent';
import type { PaginationState } from '@tanstack/react-table';

const DEFAULT_PAGINATION: PaginationState = {
    pageIndex: 0,
    pageSize: 7,
};

export default function CardholdersPage() {
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

    // ------------------------------ GET CARDHOLDERS RTK QUERY ------------------------------ \\
    // Cardholders List
    const { data: getCardholdersData, isLoading: getCardholdersIsLoading, isFetching: getCardholdersIsFetching, isError: getCardholdersIsError, error: getCardholdersError } = useGetCardholdersQuery({ email: userEmail!, pageNumber: pagination.pageIndex + 1, pageSize: pagination.pageSize }, { skip: !userEmail });
    const cardholdersResponseData = getCardholdersData?.data as CardholdersListResponseDataType ?? {};
    const cardholdersList = cardholdersResponseData?.cardholders as CardholderItemType[] ?? [];
    const totalCardholderCount = cardholdersResponseData?.pagination?.total_records ?? 0;
    const isCardholdersNotFound =
        getCardholdersIsError &&
        getCardholdersError &&
        getCardholdersError != null &&
        'status' in getCardholdersError &&
        getCardholdersError?.status === 404 &&
        typeof getCardholdersError?.data === 'object' &&
        getCardholdersError?.data !== null &&
        'status' in getCardholdersError?.data &&
        (getCardholdersError?.data as { status: string }).status === 'NOT_FOUND';

    useEffect(() => {
        ShowInConsole('Cardholders list', cardholdersResponseData as object);
    }, [cardholdersResponseData]);
    // ------------------------------- XXXXXXXXXXXXXXXXXXXXXXXX ------------------------------- \\
    const showPageLoader = getCardholdersData ? getCardholdersIsLoading : getCardholdersIsFetching;

    // Selected cardholder for details sidebar
    const [selectedCardholder, setSelectedCardholder] = useState<CardholderItemType | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);

    // Add cardholder sidebar state
    const [isAddSidebarOpen, setIsAddSidebarOpen] = useState(false);

    const handleSelectCardholder = (item: CardholderItemType) => {
        setSelectedCardholder(item);
        setIsDetailsOpen(true);
    };

    const handleCloseDetails = () => {
        setIsDetailsOpen(false);
        setSelectedCardholder(null);
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
            <div className="cardholdersPage-container w-full h-fit flex flex-col justify-start items-stretch gap-6 p-4! sm:p-6!">
                {/* Header Section */}
                <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <h1 className="text-2xl sm:text-3xl text-[var(--ink)] tracking-normal">
                            <span className="font-serif font-medium">Company</span>{' '}
                            <span className="font-serif italic font-normal">Cardholders</span>
                        </h1>

                        <div className="w-[170px] h-[38px]">
                            <CustomButtonComponent
                                id="cardholdersPage-addCardholder-btn"
                                label={
                                    <span className="flex items-center justify-center gap-1.5">
                                        <Plus className="w-4 h-4" /> Add cardholder
                                    </span>
                                }
                                type="button"
                                variant="navy"
                                onClick={handleOpenAddSidebar}
                            />
                        </div>
                    </div>
                </div>

                {/* Cardholders List Component */}
                <CardholdersListComponent
                    cardholders={cardholdersList}
                    onSelectCardholder={handleSelectCardholder}
                    cardholdersNotFound={isCardholdersNotFound}
                    getCardholdersIsFetching={getCardholdersIsFetching}
                    totalCount={totalCardholderCount}
                    pagination={pagination}
                    setPagination={setPagination}
                />

                {/* Cardholder Details Sidebar Drawer */}
                <CardholderDetailsSidebarComponent
                    isOpen={isDetailsOpen}
                    onClose={handleCloseDetails}
                    cardholder={selectedCardholder}
                />

                {/* Add Cardholder Sidebar Drawer */}
                <AddCardholderSidebarComponent
                    isOpen={isAddSidebarOpen}
                    onClose={handleCloseAddSidebar}
                />
            </div>
        </>
    );
}
