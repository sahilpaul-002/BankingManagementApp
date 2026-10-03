import { axiosBaseQuery, getAxiosInstance } from '@/configs/axiosConfig'
import { createApi, type FetchBaseQueryError } from '@reduxjs/toolkit/query/react'
import type { rootStateType } from '@/redux/sotre'
import executeBaseQuery from '../executeBaseQuery'
import rtkQueryCatchError from '@/errorHandling/rtkQueryCatchError'
import { KYC_URL, WALLET_URL } from '@/configs/constants'
import { selectApplicaitonHeaders } from '@/redux/slice/config/configSlice'
import { ApplicationServiceError } from '@/errorHandling/error'
import { userApis } from '../user/userApi'

const ENVIRONMENT = import.meta.env.VITE_REACT_ENV

type apiResponseDataType = Record<string, any> | Record<string, any>[]
type apiResponseType<T> = {
    status: string;
    message: string;
    data?: T;
    error?: any;
}

// =============================
// SET UP WALLET API HEADERS
// =============================
const walletApiHeaders = (state: rootStateType) => {
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
export const walletApis = createApi({
    reducerPath: 'walletApis',
    tagTypes: ['Wallet', 'User'],
    baseQuery: axiosBaseQuery(axiosInstance),
    endpoints: (build) => ({
        // =======================================================
        // CREATE WALLET
        // =======================================================
        createWallet: build.mutation<apiResponseType<apiResponseDataType>, { email: string; cardholderId: string; walletDetails: { walletStatus: "ACTIVE" | "INACTIVE", walletType: "FIAT" | "CRYPTO", walletCurrency: "USD" | "SGD" | "EUR" | "USDT" | "USDC" } }>({
            async queryFn(payload, { getState, dispatch }, _extraOptions, baseQuery) {
                try {
                    let state = getState() as rootStateType;
                    let headers = walletApiHeaders(state);
                    if (!headers || Object.keys(headers).length === 0) {
                        const result = await dispatch(
                            userApis.endpoints.getApplicationHeaders.initiate(
                                { email: payload.email },
                                { forceRefetch: true }
                            )
                        );
                        if (result.isError) {
                            throw new ApplicationServiceError('CREATE-WALLET - Failed to fetch application headers');
                        }

                        // Get the latest Redux state
                        state = getState() as rootStateType;

                        headers = walletApiHeaders(state)
                    }

                    const result = await executeBaseQuery(baseQuery, {
                        url: `${WALLET_URL}/create`,
                        method: 'POST',
                        headers,
                        data: { email: payload.email, cardholder_id: payload.cardholderId, wallet_details: { wallet_status: payload.walletDetails.walletStatus, wallet_type: payload.walletDetails.walletType, wallet_currency: payload.walletDetails.walletCurrency } },
                        params: { email: payload.email, cardholder_id: payload.cardholderId },
                    }) as {
                        data?: apiResponseType<apiResponseDataType>
                        error?: unknown
                    }

                    // Set wallet id in session storage
                    const walletId = (result?.data?.data as Record<string, any>)?.walletId
                    sessionStorage.setItem("walletId", walletId);

                    return {
                        data: result.data as apiResponseType<apiResponseDataType>,
                    };
                } catch (error) {
                    const rtkError = rtkQueryCatchError(error, 'CREATE-WALLET faced application error');
                    return rtkError
                }
            },
            invalidatesTags: [{ type: 'Wallet', id: 'DETAILS' }],
        }),


        // =======================================================
        // LOAD WALLET
        // =======================================================
        loadWallet: build.mutation<apiResponseType<apiResponseDataType>, { email: string; walletDetails: { cardholderId: string, walletId: string, walletType: "FIAT" | "CRYPTO", walletCurrency: "USD" | "SGD" | "EUR" | "USDT" | "USDC", network?: "ETHEREUM" | "POLYGON", amount: string } }>({
            async queryFn(payload, { getState, dispatch }, _extraOptions, baseQuery) {
                try {
                    let state = getState() as rootStateType;
                    let headers = walletApiHeaders(state);
                    if (!headers || Object.keys(headers).length === 0) {
                        const result = await dispatch(
                            userApis.endpoints.getApplicationHeaders.initiate(
                                { email: payload.email },
                                { forceRefetch: true }
                            )
                        );
                        if (result.isError) {
                            throw new ApplicationServiceError('LOAD-WALLET - Failed to fetch application headers');
                        }

                        // Get the latest Redux state
                        state = getState() as rootStateType;

                        headers = walletApiHeaders(state)
                    }

                    const walletDetails: Record<string, any> = {
                        cardholder_id: payload.walletDetails.cardholderId,
                        wallet_id: payload.walletDetails.walletId,
                        wallet_type: payload.walletDetails.walletType,
                        wallet_currency: payload.walletDetails.walletCurrency,
                        amount: payload.walletDetails.amount,
                    };

                    if (payload.walletDetails.network) {
                        walletDetails.network = payload.walletDetails.network;
                    }

                    const result = await executeBaseQuery(baseQuery, {
                        url: `${WALLET_URL}/load`,
                        method: 'POST',
                        headers,
                        data: {
                            email: payload.email,
                            walletDetails: walletDetails,
                        },
                    }) as {
                        data?: apiResponseType<apiResponseDataType>
                        error?: unknown
                    }

                    return {
                        data: result.data as apiResponseType<apiResponseDataType>,
                    };
                } catch (error) {
                    const rtkError = rtkQueryCatchError(error, 'LOAD-WALLET faced application error');
                    return rtkError
                }
            },

            // Runs after loadWallet has been initiated.
            onQueryStarted: async (_arg, { dispatch, queryFulfilled }) => {
                try {
                    await queryFulfilled;

                    dispatch(
                        userApis.util.invalidateTags([
                            { type: 'User', id: 'PREFUND-ACCOUNTS-DETAILS' },
                        ])
                    );
                } catch (error) {
                    // Load wallet failed, so don't refetch prefund accounts.
                    console.error('LOAD-WALLET - Failed to refresh prefund account details', error);
                }
            },

            invalidatesTags: [{ type: 'Wallet', id: 'BALANCES' }, { type: 'Wallet', id: 'DETAILS' }],
        }),


        // =======================================================
        // GET ALL WALLET BALANCES
        // =======================================================
        getAllWalletBalances: build.query<apiResponseType<apiResponseDataType>, { email: string, cardholderId: string }>({
            async queryFn(payload, { getState, dispatch }, _extraOptions, baseQuery) {
                try {
                    let state = getState() as rootStateType;
                    // Get user api headers
                    let headers = walletApiHeaders(state)
                    if (!headers || Object.keys(headers).length === 0) {
                        const result = await dispatch(
                            userApis.endpoints.getApplicationHeaders.initiate(
                                {
                                    email: payload.email,
                                },
                                {
                                    forceRefetch: true  // Force RTK to refetch the query
                                }
                            )
                        )
                        if (result.isError) {
                            throw new ApplicationServiceError("GET-WALLET-DETAILS - Failed to fetch application headers")
                        }

                        // Get the latest Redux state
                        state = getState() as rootStateType;

                        headers = walletApiHeaders(state)
                    }

                    const result = await executeBaseQuery(baseQuery, {
                        url: `${WALLET_URL}/balances`,
                        method: 'GET',
                        headers,
                        params: { email: payload.email, cardholder_id: payload.cardholderId },
                    }) as {
                        data?: apiResponseType<apiResponseDataType>
                        error?: unknown
                    }

                    return {
                        data: result.data as apiResponseType<apiResponseDataType>,
                    };
                }
                catch (error) {
                    const rtkError = rtkQueryCatchError(error, "GET-WALLET-DETAILS faced application error ");
                    return rtkError;
                }
            },
            providesTags: [{ type: 'Wallet', id: 'BALANCES' }],
        }),


        // =======================================================
        // GET WALLET DETAILS
        // =======================================================
        getWalletDetails: build.query<apiResponseType<apiResponseDataType>, { email: string, cardholderId: string }>({
            async queryFn(payload, { getState, dispatch }, _extraOptions, baseQuery) {
                try {
                    let state = getState() as rootStateType;
                    // Get user api headers
                    let headers = walletApiHeaders(state)
                    if (!headers || Object.keys(headers).length === 0) {
                        const result = await dispatch(
                            userApis.endpoints.getApplicationHeaders.initiate(
                                {
                                    email: payload.email,
                                },
                                {
                                    forceRefetch: true  // Force RTK to refetch the query
                                }
                            )
                        )
                        if (result.isError) {
                            throw new ApplicationServiceError("GET-WALLET-DETAILS - Failed to fetch application headers")
                        }

                        // Get the latest Redux state
                        state = getState() as rootStateType;

                        headers = walletApiHeaders(state)
                    }

                    const result = await executeBaseQuery(baseQuery, {
                        url: `${WALLET_URL}`,
                        method: 'GET',
                        headers,
                        params: { email: payload.email, cardholder_id: payload.cardholderId },
                    }) as {
                        data?: apiResponseType<apiResponseDataType>
                        error?: unknown
                    }

                    return {
                        data: result.data as apiResponseType<apiResponseDataType>,
                    };
                }
                catch (error) {
                    const rtkError = rtkQueryCatchError(error, "GET-WALLET-DETAILS faced application error ");
                    return rtkError;
                }
            },
            providesTags: [{ type: 'Wallet', id: 'DETAILS' }],
        }),


        // =======================================================
        // CREATE CURRENCY CONVERSION QUOTE
        // =======================================================
        createCurrencyConversionQuote: build.mutation<apiResponseType<apiResponseDataType>, { email: string; bodyPayload: {cardholderId: string, sourceWalletCurrency: "USD" | "SGD" | "EUR" | "USDT" | "USDC", distinatinWalletCurrency: "USD" | "SGD" | "EUR" | "USDT" | "USDC", amount: string} }>({
            async queryFn(payload, { getState, dispatch }, _extraOptions, baseQuery) {
                try {
                    let state = getState() as rootStateType;
                    let headers = walletApiHeaders(state);
                    if (!headers || Object.keys(headers).length === 0) {
                        const result = await dispatch(
                            userApis.endpoints.getApplicationHeaders.initiate(
                                { email: payload.email },
                                { forceRefetch: true }
                            )
                        );
                        if (result.isError) {
                            throw new ApplicationServiceError('CREATE-CURRENCY-CONVERSION-QUOTE - Failed to fetch application headers');
                        }

                        // Get the latest Redux state
                        state = getState() as rootStateType;

                        headers = walletApiHeaders(state)
                    }

                    const result = await executeBaseQuery(baseQuery, {
                        url: `${WALLET_URL}/walletCurrencyConversion/createPayout`,
                        method: 'POST',
                        headers,
                        params: {email: payload?.email},
                        data: { cardholder_id: payload?.bodyPayload?.cardholderId, source_wallet_currency: payload?.bodyPayload?.sourceWalletCurrency, destination_wallet_currency: payload?.bodyPayload?.distinatinWalletCurrency, amount: payload?.bodyPayload?.amount },
                    }) as {
                        data?: apiResponseType<apiResponseDataType>
                        error?: unknown
                    }

                    return {
                        data: result.data as apiResponseType<apiResponseDataType>,
                    };
                } catch (error) {
                    const rtkError = rtkQueryCatchError(error, 'CREATE-CURRENCY-CONVERSION-QUOTE faced application error');
                    return rtkError
                }
            },
            invalidatesTags: [{ type: 'Wallet', id: 'BALANCES' }, { type: 'Wallet', id: 'DETAILS' }, { type: 'Wallet', id: 'TRANSACTIONS' }],
        }),


        // =======================================================
        // EXECUTE CURRENCY CONVERSION
        // =======================================================
        executeCurrencyConversionQuote: build.mutation<apiResponseType<apiResponseDataType>, { email: string; bodyPayload: {cardholderId: string, quoteId: string}; }>({
            async queryFn(payload, { getState, dispatch }, _extraOptions, baseQuery) {
                try {
                    let state = getState() as rootStateType;
                    let headers = walletApiHeaders(state);
                    if (!headers || Object.keys(headers).length === 0) {
                        const result = await dispatch(
                            userApis.endpoints.getApplicationHeaders.initiate(
                                { email: payload.email },
                                { forceRefetch: true }
                            )
                        );
                        if (result.isError) {
                            throw new ApplicationServiceError('EXECUTE-CURRENCY-CONVERSION-QUOTE - Failed to fetch application headers');
                        }

                        // Get the latest Redux state
                        state = getState() as rootStateType;

                        headers = walletApiHeaders(state)
                    }

                    const result = await executeBaseQuery(baseQuery, {
                        url: `${WALLET_URL}/walletCurrencyConversion/executePayout`,
                        method: 'POST',
                        headers,
                        data: {quote_id: payload?.bodyPayload?.quoteId, cardholder_id: payload?.bodyPayload?.cardholderId},
                        params: { email: payload?.email },
                    }) as {
                        data?: apiResponseType<apiResponseDataType>
                        error?: unknown
                    }

                    return {
                        data: result.data as apiResponseType<apiResponseDataType>,
                    };
                } catch (error) {
                    const rtkError = rtkQueryCatchError(error, 'EXECUTE-CURRENCY-CONVERSION-QUOTE faced application error');
                    return rtkError
                }
            },
            invalidatesTags: [{ type: 'Wallet', id: 'BALANCES' }, { type: 'Wallet', id: 'DETAILS' }, { type: 'Wallet', id: 'TRANSACTIONS' }],
        }),


        // =======================================================
        // GET WALLET TRANSACTIONS LIST
        // =======================================================
        getWalletTransactions: build.query<apiResponseType<apiResponseDataType>, { email: string; cardholderId: string, walletId: string, pageNumber: number, pageSize: number, from_date?: string, to_date?: string }>({
            async queryFn(payload, { getState, dispatch }, _extraOptions, baseQuery) {
                try {
                    let state = getState() as rootStateType;
                    let headers = walletApiHeaders(state);
                    if (!headers || Object.keys(headers).length === 0) {
                        const result = await dispatch(
                            userApis.endpoints.getApplicationHeaders.initiate(
                                { email: payload.email },
                                { forceRefetch: true }
                            )
                        );
                        if (result.isError) {
                            throw new ApplicationServiceError('GET-WALLET-TRANSACTIONS - Failed to fetch application headers');
                        }

                        // Get the latest Redux state
                        state = getState() as rootStateType;

                        headers = walletApiHeaders(state)
                    }

                    const result = await executeBaseQuery(baseQuery, {
                        url: `${WALLET_URL}/transactions`,
                        method: 'GET',
                        headers,
                        params: {
                            email: payload.email, cardholder_id: payload.cardholderId, wallet_id: payload.walletId, page: String(payload.pageNumber), page_size: String(payload.pageSize), ...(payload.from_date && { from_date: payload.from_date }), ...(payload.to_date && { to_date: payload.to_date }),
                        },
                    }) as {
                        data?: apiResponseType<apiResponseDataType>
                        error?: unknown
                    };

                    return {
                        data: result.data as apiResponseType<apiResponseDataType>,
                    };
                } catch (error) {
                    const rtkError = rtkQueryCatchError(error, 'GET-WALLET-TRANSACTIONS faced application error');
                    return rtkError
                }
            },
            providesTags: [{ type: 'Wallet', id: 'TRANSACTIONS' }],
        }),
    }),
})

export const {
    useCreateWalletMutation,
    useLoadWalletMutation,
    useGetAllWalletBalancesQuery,
    useLazyGetAllWalletBalancesQuery,
    useGetWalletDetailsQuery,
    useLazyGetWalletDetailsQuery,
    useCreateCurrencyConversionQuoteMutation,
    useExecuteCurrencyConversionQuoteMutation,
    useGetWalletTransactionsQuery,
    useLazyGetWalletTransactionsQuery,
} = walletApis
