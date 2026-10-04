import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery, getAxiosInstance } from '@/configs/axiosConfig';
import { CARD_URL } from '@/configs/constants';
import { selectApplicaitonHeaders } from '@/redux/slice/config/configSlice';
import type { rootStateType } from '@/redux/sotre';
import executeBaseQuery from '../executeBaseQuery';
import rtkQueryCatchError from '@/errorHandling/rtkQueryCatchError';
import { userApis } from '../user/userApi';
import { ApplicationServiceError } from '@/errorHandling/error';

const ENVIRONMENT = import.meta.env.VITE_REACT_ENV

type apiResponseDataType = Record<string, any> | Record<string, any>[]
type apiResponseType<T> = {
    status: string;
    message: string;
    data?: T;
    error?: any;
}

// =============================
// SET UP CARDS API HEADERS
// =============================
const cardsApiHeaders = (state: rootStateType) => {
    const applicationHeaders = selectApplicaitonHeaders(state);

    // Build user api headers
    const dynamicHeaders: Record<string, string | null> = {}

    if (applicationHeaders) {
        dynamicHeaders['x-api-key'] = applicationHeaders['x-api-key'];
        dynamicHeaders['agent-code'] = applicationHeaders['agent-code'];
        dynamicHeaders['subagent-code'] = applicationHeaders['subagent-code'];
        dynamicHeaders['program-id'] = applicationHeaders['program-id'];
        dynamicHeaders['business-id'] = applicationHeaders['business-id'];
        dynamicHeaders['authorization'] = applicationHeaders['authorization'];
    }
    return dynamicHeaders;
}

// ============================
// GET AXIOS INSTANCE
// ============================
const axiosInstance = getAxiosInstance();

// ==============================
// APIS
// ==============================
export const cardApis = createApi({
    reducerPath: 'cardApis',
    baseQuery: axiosBaseQuery(axiosInstance),
    tagTypes: ['Card'],
    endpoints: (build) => ({
        // =======================================================
        // GET CARDS LIST
        // =======================================================
        getCards: build.query<apiResponseType<apiResponseDataType>, { email: string, cardholderId: string, pageNumber: number, pageSize: number }>({
            async queryFn(payload, { getState, dispatch }, _extraOptions, baseQuery) {
                try {
                    let state = getState() as rootStateType;
                    let headers = cardsApiHeaders(state);
                    if (!headers || Object.keys(headers).length === 0) {
                        const result = await dispatch(
                            userApis.endpoints.getApplicationHeaders.initiate(
                                { email: payload.email },
                                { forceRefetch: true }
                            )
                        );
                        if (result.isError) {
                            throw new ApplicationServiceError('GET-CARDS-LIST - Failed to fetch application headers');
                        }

                        // Get the latest Redux state
                        state = getState() as rootStateType;

                        headers = cardsApiHeaders(state)
                    }

                    const result = await executeBaseQuery(baseQuery, {
                        url: `${CARD_URL}`,
                        method: 'GET',
                        headers,
                        params: {
                            email: payload.email,
                            cardholder_id: payload.cardholderId,
                            page: String(payload.pageNumber),
                            page_size: String(payload.pageSize),
                        },
                    }) as {
                        data?: apiResponseType<apiResponseDataType>
                        error?: unknown
                    }

                    return {
                        data: result.data as apiResponseType<apiResponseDataType>,
                    };
                }
                catch (error) {
                    const rtkError = rtkQueryCatchError(error, 'GET-CARDS-LIST faced application error');
                    return rtkError;
                }
            },
            providesTags: [{ type: 'Card', id: 'LIST' }],
        }),

        // =======================================================
        // CREATE CARD
        // =======================================================
        createCardholder: build.mutation<apiResponseType<apiResponseDataType>, { email: string; cardDetails: { cardholderId: string, nameOnCard: string, cardType: "VIRTUAL" | "PHYSICAL", cardCurrency: "USD", cardLimits: { dailyLimit: string, monthlyLimit: string, yearlyLimit: string }, merchantCategories: MERCHANT_CATEGORIES } }>({
            async queryFn(payload, { getState, dispatch }, _extraOptions, baseQuery) {
                try {
                    let state = getState() as rootStateType;
                    let headers = cardsApiHeaders(state);
                    if (!headers || Object.keys(headers).length === 0) {
                        const result = await dispatch(
                            userApis.endpoints.getApplicationHeaders.initiate(
                                { email: payload.email },
                                { forceRefetch: true }
                            )
                        );
                        if (result.isError) {
                            throw new ApplicationServiceError('ADD-CARD - Failed to fetch application headers');
                        }

                        // Get the latest Redux state
                        state = getState() as rootStateType;

                        headers = cardsApiHeaders(state)
                    }

                    const result = (await executeBaseQuery(baseQuery, {
                        url: `${CARD_URL}/create`,
                        method: 'POST',
                        headers,
                        params: { email: payload.email },
                        data: {
                            cardholder_id: payload.cardDetails.cardholderId,
                            name_on_card: payload.cardDetails.nameOnCard,
                            card_type: payload.cardDetails.cardType,
                            card_currency: payload.cardDetails.cardCurrency,
                            card_limits: {
                                daily_limit: payload.cardDetails.cardLimits.dailyLimit,
                                monthly_limit: payload.cardDetails.cardLimits.monthlyLimit,
                                yearly_limit: payload.cardDetails.cardLimits.yearlyLimit,
                            },
                            merchant_categories: payload.cardDetails.merchantCategories,
                        },
                    })) as {
                        data?: apiResponseType<apiResponseDataType>;
                        error?: unknown;
                    };

                    return {
                        data: result.data as apiResponseType<apiResponseDataType>,
                    };
                } catch (error) {
                    const rtkError = rtkQueryCatchError(error, 'ADD-CARD faced application error');
                    return rtkError;
                }
            },
            invalidatesTags: [{ type: 'Card', id: 'LIST' }],
        }),


        // =======================================================
        // MAIL CARD SENSITIVE DETAILS
        // =======================================================
        cardSensitiveDetails: build.mutation<apiResponseType<apiResponseDataType>, { email: string; cardDetails: { cardId: string, cardholderId: string } }>({
            async queryFn(payload, { getState, dispatch }, _extraOptions, baseQuery) {
                try {
                    let state = getState() as rootStateType;
                    let headers = cardsApiHeaders(state);
                    if (!headers || Object.keys(headers).length === 0) {
                        const result = await dispatch(
                            userApis.endpoints.getApplicationHeaders.initiate(
                                { email: payload.email },
                                { forceRefetch: true }
                            )
                        );
                        if (result.isError) {
                            throw new ApplicationServiceError('MAIL-CARD-SENSETIVE-DETAILS - Failed to fetch application headers');
                        }

                        // Get the latest Redux state
                        state = getState() as rootStateType;

                        headers = cardsApiHeaders(state)
                    }

                    const result = (await executeBaseQuery(baseQuery, {
                        url: `${CARD_URL}/mailCardSensitiveDetails/${payload?.cardDetails?.cardId}`,
                        method: 'POST',
                        headers,
                        params: { email: payload.email },
                        data: {
                            cardholder_id: payload.cardDetails.cardholderId
                        },
                    })) as {
                        data?: apiResponseType<apiResponseDataType>;
                        error?: unknown;
                    };

                    return {
                        data: result.data as apiResponseType<apiResponseDataType>,
                    };
                } catch (error) {
                    const rtkError = rtkQueryCatchError(error, 'MAIL-CARD-SENSETIVE-DETAILS faced application error');
                    return rtkError;
                }
            },
        }),
    }),
});

export const { useGetCardsQuery, useLazyGetCardsQuery, useCreateCardholderMutation, useCardSensitiveDetailsMutation } = cardApis;