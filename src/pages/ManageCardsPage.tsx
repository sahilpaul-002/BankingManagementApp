import { useState, useEffect, Activity } from 'react';
import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useDispatch, useSelector } from 'react-redux';
import CustomButtonComponent from '@/components/common/CustomButtonComponent';
import ManageCardsListComponent from '@/components/cards/manageCards/ManageCardsListComponent';
import CreateCardSidebarComponent from '@/components/cards/manageCards/CreateCardSidebarComponent';
import { useGetCardsQuery } from '@/redux/features/card/cardApi';
import { setShowInfoBanner } from '@/redux/slice/utility/utilitySlice';
import type { CardsListResponseDataType, CardItemType } from '@/types/cards/manageCardsTypes';
import ShowInConsole from '@/utils/ShowInConsole';
import PageLoaderComponent from '@/components/common/loaders/PageLoaderComponent';
import type { PaginationState } from '@tanstack/react-table';
import { selectIsAdmin, selectIsMasterAdmin } from '@/redux/slice/user/userSlice';

const DEFAULT_PAGINATION: PaginationState = {
    pageIndex: 0,
    pageSize: 6,
};

export default function ManageCardsPage() {
    // Configure useNavigate
    const navigate = useNavigate();

    // Configure useDispatch
    const dispatch = useDispatch();

    const isAdmin = useSelector(selectIsAdmin);
    const isMasterAdmin = useSelector(selectIsMasterAdmin);
    const canAccessCreateCard = isAdmin || isMasterAdmin;

    // ------------------------------- GET EMAIL FROM SESSION STORAGE ---------------------------------- \\
    // Get necessary user details from session storage
    const userEmail = sessionStorage.getItem('userEmail');
    const userId = sessionStorage.getItem('userId');
    const userCardholderId = sessionStorage.getItem('cardholderId');

    useEffect(() => {
        // Validate session storage once
        if (!userEmail || !userId || !userCardholderId) {
            dispatch(
                setShowInfoBanner(
                    'Application facing issue, necessary user details not present in session storage. Please re-login.'
                )
            );
            return;
        }
    }, [userEmail, userId, userCardholderId, dispatch]);
    // ---------------------------------- XXXXXXXXXXXXXXXXXXXXXXXXXX ---------------------------------- \\

    // Pagination State
    const [pagination, setPagination] = useState<PaginationState>(DEFAULT_PAGINATION);

    // ------------------------------ GET CARDS RTK QUERY ------------------------------ \\
    // Cards List
    const { data: getCardsData, isLoading: getCardsIsLoading, isFetching: getCardsIsFetching, isError: getCardsIsError, error: getCardsError } = useGetCardsQuery({ email: userEmail!, cardholderId: userCardholderId!, pageNumber: pagination.pageIndex + 1, pageSize: pagination.pageSize }, { skip: !userEmail || !userCardholderId });
    const cardsResponseData = (getCardsData?.data as CardsListResponseDataType) ?? {};
    const cardsList = (cardsResponseData?.cards as CardItemType[]) ?? [];
    const totalCardsCount = cardsResponseData?.pagination?.total_records ?? 0;
    const isCardsNotFound =
        getCardsIsError &&
        getCardsError &&
        getCardsError != null &&
        'status' in getCardsError &&
        getCardsError?.status === 404 &&
        typeof getCardsError?.data === 'object' &&
        getCardsError?.data !== null &&
        'status' in getCardsError?.data &&
        (getCardsError?.data as { status: string }).status === 'NOT_FOUND';

    useEffect(() => {
        ShowInConsole('Cards list', cardsResponseData as object);
    }, [cardsResponseData]);
    // ------------------------------- XXXXXXXXXXXXXXXXXXXXXXXX ------------------------------- \\

    const showPageLoader = getCardsData ? getCardsIsLoading : getCardsIsFetching;

    // Create Card Sidebar Drawer State
    const [isCreateCardOpen, setIsCreateCardOpen] = useState(false);

    const handleSelectCard = (card: CardItemType) => {
        navigate(`/cards/manageCards/${card._id}`);
    };

    const handleOpenCreateCard = () => setIsCreateCardOpen(true);
    const handleCloseCreateCard = () => setIsCreateCardOpen(false);

    return (
        <>
            {/* Page Loader */}
            <Activity mode={showPageLoader ? 'visible' : 'hidden'}>
                <PageLoaderComponent showPageLoader={showPageLoader} />
            </Activity>

            {/* Main Content */}
            <div className="manageCardsPage-container w-full h-fit flex flex-col justify-start items-stretch gap-6 p-4! sm:p-6!">
                {/* Header Section */}
                <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <h1 className="text-2xl sm:text-3xl text-[var(--ink)] tracking-normal">
                            <span className="font-serif font-medium">Manage</span>{' '}
                            <span className="font-serif italic font-normal">Cards</span>
                        </h1>

                        {canAccessCreateCard && (
                            <div className="w-[160px] h-[38px]">
                                <CustomButtonComponent
                                    id="manageCardsPage-createCard-btn"
                                    label={
                                        <span className="flex items-center justify-center gap-1.5">
                                            <Plus className="w-4 h-4" /> Create Card
                                        </span>
                                    }
                                    type="button"
                                    variant="navy"
                                    onClick={handleOpenCreateCard}
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* Cards List Component */}
                <ManageCardsListComponent
                    cards={cardsList}
                    onSelectCard={handleSelectCard}
                    cardsNotFound={isCardsNotFound}
                    getCardsIsFetching={getCardsIsFetching}
                    totalCount={totalCardsCount}
                    pagination={pagination}
                    setPagination={setPagination}
                />

                {/* Create Card Sidebar Drawer */}
                <CreateCardSidebarComponent
                    isOpen={isCreateCardOpen}
                    onClose={handleCloseCreateCard}
                />
            </div>
        </>
    );
}
