import { useEffect, useMemo, Activity } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router';
import { ArrowLeft, CreditCard } from 'lucide-react';
import { useDispatch } from 'react-redux';
import { useGetCardDetailSQuery, useGetCardsQuery } from '@/redux/features/card/cardApi';
import { setShowInfoBanner } from '@/redux/slice/utility/utilitySlice';
import type { CardItemType, CardsListResponseDataType } from '@/types/cards/manageCardsTypes';
import CardDetailsViewComponent from '@/components/cards/cardDetails/CardDetailsViewComponent';
import CardTransactionsSectionComponent from '@/components/cards/cardholders/CardTransactionsSectionComponent';
import PageLoaderComponent from '@/components/common/loaders/PageLoaderComponent';
import ShowInConsole from '@/utils/ShowInConsole';
import type { CardDetailsResponseDataType, CardDetailsType } from '@/types/cards/cardDetailsTypes';

export default function CardDetailsPage() {
    const { id: cardId } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    useEffect(() => {
        if (!cardId) {
            dispatch(
                setShowInfoBanner('Card id is unavailbale. Please go back to the previous page')
            );
            return;
        }
    }, [cardId, dispatch]);

    // ------------------------------- GET EMAIL FROM SESSION STORAGE ---------------------------------- \\
    const userEmail = sessionStorage.getItem('userEmail');
    const userId = sessionStorage.getItem('userId');
    const userCardholderId = sessionStorage.getItem('cardholderId');

    useEffect(() => {
        if (!userEmail || !userId || !userCardholderId) {
            dispatch(
                setShowInfoBanner('Application facing issue, necessary user details not present in session storage. Please re-login.')
            );
            return;
        }
    }, [userEmail, userId, userCardholderId, dispatch]);
    // ---------------------------------- XXXXXXXXXXXXXXXXXXXXXXXXXX ---------------------------------- \\

    // ------------------------------ GET CARD DETAILS RTK QUERY ------------------------------ \\
    // Cards List
    const { data: getardDetailsData, isLoading: getardDetailsIsLoading, isFetching: getardDetailsIsFetching, isError: getardDetailsIsError, error: getardDetailsError } = useGetCardDetailSQuery({ email: userEmail!, cardDetails: { cardholderId: userCardholderId!, cardId: cardId! } }, { skip: !userEmail || !userCardholderId || !cardId });
    const cardsResponseData = (getardDetailsData?.data as CardDetailsResponseDataType) ?? {};
    const cardDetails = (cardsResponseData?.cardDetails as CardDetailsType) ?? {};
    const hasCardDetails = Object.keys(cardDetails).length > 0;
    const isCardsNotFound =
        getardDetailsIsError &&
        getardDetailsError &&
        getardDetailsError != null &&
        'status' in getardDetailsError &&
        getardDetailsError?.status === 404 &&
        typeof getardDetailsError?.data === 'object' &&
        getardDetailsError?.data !== null &&
        'status' in getardDetailsError?.data &&
        (getardDetailsError?.data as { status: string }).status === 'NOT_FOUND';

    useEffect(() => {
        ShowInConsole(`Card - ${cardId} Details`, cardsResponseData as object);
    }, [cardsResponseData]);
    // ------------------------------- XXXXXXXXXXXXXXXXXXXXXXXX ------------------------------- \\

    return (
        <>
            {/* Page Loader */}
            <Activity mode={getardDetailsIsFetching ? 'visible' : 'hidden'}>
                <PageLoaderComponent showPageLoader={getardDetailsIsFetching} />
            </Activity>

            {/* Main Content */}
            <Activity mode={!getardDetailsIsFetching ? 'visible' : 'hidden'}>
                <div className="cardDetailsPage-container w-full h-fit flex flex-col justify-start items-stretch gap-6 p-4! sm:p-6!">
                    {/* Header Section */}
                    <div className="flex flex-col gap-4">
                        <button
                            type="button"
                            id="cardDetails-back-btn"
                            onClick={() => navigate('/cards/manageCards')}
                            className="inline-flex items-center gap-2 text-xs font-semibold text-[var(--mute)] hover:text-[var(--ink)] transition-colors self-start cursor-pointer"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back to Manage Cards
                        </button>

                        <div className="flex items-center justify-between flex-wrap gap-4">
                            <h1 className="text-2xl sm:text-3xl text-[var(--ink)] tracking-normal">
                                <span className="font-serif font-medium">Card</span>{' '}
                                <span className="font-serif italic font-normal">Details</span>
                            </h1>
                        </div>
                    </div>

                    {/* Details View / Not Found State */}
                    <Activity mode={hasCardDetails && !isCardsNotFound ? 'visible' : 'hidden'}>
                        <CardDetailsViewComponent
                            card={cardDetails!}
                            userEmail={userEmail || '--'}
                            cardholderId={userCardholderId || '--'}
                        />

                        {/* Card Transactions Section */}
                        <CardTransactionsSectionComponent
                            cardId={cardId!}
                            cardholderId={userCardholderId || ''}
                            userEmail={userEmail || ''}
                        />
                    </Activity>

                    <Activity mode={!hasCardDetails || isCardsNotFound ? 'visible' : 'hidden'}>
                        <div className="w-full min-h-[300px] flex flex-col items-center justify-center gap-4 bg-[var(--bg-surface)] border border-[var(--line)] rounded-2xl p-8! sm:p-12!">
                            <div className="w-12 h-12 rounded-full bg-[var(--bg-hover)] flex items-center justify-center">
                                <CreditCard
                                    className="w-6 h-6 text-[var(--ink-soft)]"
                                    strokeWidth={1.5}
                                />
                            </div>

                            <div className="flex flex-col items-center text-center gap-1.5">
                                <p className="text-base font-semibold text-[var(--ink)]">
                                    Card details unavailable
                                </p>

                                <p className="text-xs text-[var(--ink-soft)] max-w-[320px] leading-relaxed">
                                    The card details are no longer available in this session.
                                    Please return to Manage Cards and select the card again.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => navigate('/cards/manageCards')}
                                className="inline-flex items-center justify-center px-4! py-2! rounded-lg bg-[var(--nav-bg)] text-white text-xs font-medium hover:opacity-90 transition-opacity cursor-pointer"
                            >
                                Back to Manage Cards
                            </button>
                        </div>
                    </Activity>
                </div>
            </Activity>
        </>
    );
}
