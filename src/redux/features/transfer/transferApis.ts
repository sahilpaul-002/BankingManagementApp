import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery, getAxiosInstance } from '@/configs/axiosConfig';
import { BENEFICIARIES_URL, TRANSFER_URL } from '@/configs/constants';
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
// SET UP TRANSFER API HEADERS
// =============================
const transferApiHeaders = (state: rootStateType) => {
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
export const transferApis = createApi({
    reducerPath: 'transferApis',
    baseQuery: axiosBaseQuery(axiosInstance),
    tagTypes: ['Transfer'],
    endpoints: (build) => ({
        // =======================================================
        // CREATE PAYOUT QUOTE
        // =======================================================
        createPayoutQuote: build.mutation<apiResponseType<apiResponseDataType>, { email: string, payoutDetails: { benefeciaryId: string, sourceWalletCurrency: "USD" | "SGD" | "EUR", sourceAmout: string } }>({
            async queryFn(payload, { getState, dispatch }, _extraOptions, baseQuery) {
                try {
                    let state = getState() as rootStateType;
                    let headers = transferApiHeaders(state);
                    if (!headers || Object.keys(headers).length === 0) {
                        const result = await dispatch(
                            userApis.endpoints.getApplicationHeaders.initiate(
                                { email: payload.email },
                                { forceRefetch: true }
                            )
                        );
                        if (result.isError) {
                            throw new ApplicationServiceError('CREATE-PAYOUT-QUOTE - Failed to fetch application headers');
                        }

                        // Get the latest Redux state
                        state = getState() as rootStateType;

                        headers = transferApiHeaders(state)
                    }

                    const result = await executeBaseQuery(baseQuery, {
                        url: `${TRANSFER_URL}/payoutQuote`,
                        method: 'POST',
                        headers,
                        params: { email: payload.email },
                        data: {
                            beneficiary_id: payload?.payoutDetails?.benefeciaryId,
                            source_wallet_currency: payload?.payoutDetails?.sourceWalletCurrency,
                            source_amount: payload?.payoutDetails?.sourceAmout
                        }
                    }) as {
                        data?: apiResponseType<apiResponseDataType>
                        error?: unknown
                    }

                    return {
                        data: result.data as apiResponseType<apiResponseDataType>,
                    };
                }
                catch (error) {
                    const rtkError = rtkQueryCatchError(error, 'CREATE-PAYOUT-QUOTE faced application error');
                    return rtkError;
                }
            },
            invalidatesTags: [{ type: 'Transfer', id: 'PAYOUT-TRANSACTIONS' }],
        }),

        // =======================================================
        // EXECUTE PAYOUT QUOTE
        // =======================================================
        executePayoutQuote: build.mutation<apiResponseType<apiResponseDataType>, { email: string, quoteId: string }>({
            async queryFn(payload, { getState, dispatch }, _extraOptions, baseQuery) {
                try {
                    let state = getState() as rootStateType;
                    let headers = transferApiHeaders(state);
                    if (!headers || Object.keys(headers).length === 0) {
                        const result = await dispatch(
                            userApis.endpoints.getApplicationHeaders.initiate(
                                { email: payload.email },
                                { forceRefetch: true }
                            )
                        );
                        if (result.isError) {
                            throw new ApplicationServiceError('EXECUTE-PAYOUT-QUOTE - Failed to fetch application headers');
                        }

                        // Get the latest Redux state
                        state = getState() as rootStateType;

                        headers = transferApiHeaders(state)
                    }

                    const result = (await executeBaseQuery(baseQuery, {
                        url: `${BENEFICIARIES_URL}/executePayout`,
                        method: 'POST',
                        headers,
                        params: { email: payload.email },
                        data: { quote_id: payload?.quoteId },
                    })) as {
                        data?: apiResponseType<apiResponseDataType>;
                        error?: unknown;
                    };

                    return {
                        data: result.data as apiResponseType<apiResponseDataType>,
                    };
                } catch (error) {
                    const rtkError = rtkQueryCatchError(error, 'EXECUTE-PAYOUT-QUOTE faced application error');
                    return rtkError;
                }
            },
            invalidatesTags: [{ type: 'Transfer', id: 'PAYOUT-TRANSACTIONS' }],
        }),

        // =======================================================
        // GET PAYOUT QUOTE TRANSACTIONS LIST
        // =======================================================
        getPayoutQuoteTransactions: build.query<apiResponseType<apiResponseDataType>, { email: string; userId: string, pageNumber: number, pageSize: number, from_date?: string, to_date?: string }>({
            async queryFn(payload, { getState, dispatch }, _extraOptions, baseQuery) {
                try {
                    let state = getState() as rootStateType;
                    let headers = transferApiHeaders(state);
                    if (!headers || Object.keys(headers).length === 0) {
                        const result = await dispatch(
                            userApis.endpoints.getApplicationHeaders.initiate(
                                { email: payload.email },
                                { forceRefetch: true }
                            )
                        );
                        if (result.isError) {
                            throw new ApplicationServiceError('GET-PAYOUT-QUOTE-TRANSACTIONS - Failed to fetch application headers');
                        }

                        // Get the latest Redux state
                        state = getState() as rootStateType;

                        headers = transferApiHeaders(state)
                    }

                    const result = await executeBaseQuery(baseQuery, {
                        url: `${TRANSFER_URL}/transactions`,
                        method: 'GET',
                        headers,
                        params: {
                            email: payload.email, user_id: payload.userId, page: payload.pageNumber, page_size: payload.pageSize, ...(payload.from_date && { from_date: payload.from_date }), ...(payload.to_date && { to_date: payload.to_date }),
                        },
                    }) as {
                        data?: apiResponseType<apiResponseDataType>
                        error?: unknown
                    };

                    return {
                        data: result.data as apiResponseType<apiResponseDataType>,
                    };
                } catch (error) {
                    const rtkError = rtkQueryCatchError(error, 'GET-PAYOUT-QUOTE-TRANSACTIONS faced application error');
                    return rtkError
                }
            },
            providesTags: [{ type: 'Transfer', id: 'PAYOUT-TRANSACTIONS' }],
        }),
    }),
});

export const { useCreatePayoutQuoteMutation, useExecutePayoutQuoteMutation } = transferApis;