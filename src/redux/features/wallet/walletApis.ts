import { axiosBaseQuery, getAxiosInstance } from '@/configs/axiosConfig'
import { createApi, type FetchBaseQueryError } from '@reduxjs/toolkit/query/react'
import type { rootStateType } from '@/redux/sotre'
import executeBaseQuery from '../executeBaseQuery'
import rtkQueryCatchError from '@/errorHandling/rtkQueryCatchError'
import { KYC_URL, WALLET_URL } from '@/configs/constants'
import { selectApplicaitonHeaders } from '@/redux/slice/config/configSlice'
import { ApplicationServiceError } from '@/errorHandling/error'
import { userApis } from '../user/userApi'
import type {
    CreateConversionQuoteRequestBody,
    CreateConversionQuoteResponse,
    ExecuteConversionRequestBody,
    ExecuteConversionResponse,
} from '@/fallbacks/wallets/currencyConversion/currencyConversionFallbacks'
import type {
    WalletTransactionsListResponse,
    WalletTransactionDetailsResponse,
} from '@/fallbacks/wallets/walletStatements/walletStatementsFallbacks'

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
    tagTypes: ['Wallet', 'WalletTransactions'],
    baseQuery: axiosBaseQuery(axiosInstance),
    endpoints: (build) => ({
        // =======================================================
        // CREATE WALLET
        // =======================================================
        createWallet: build.mutation<apiResponseType<apiResponseDataType>, { email: string; cardholderId: string; walletDetails: {walletStatus: "ACTIVE" | "INACTIVE", walletType: "FIAT" | "CRYPTO", walletCurrency: "USD" | "SGD" | "EUR" | "USDT" | "USDC"} }>({
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
                        data: {email: payload.email, cardholder_id: payload.cardholderId, wallet_details: {wallet_status: payload.walletDetails.walletStatus, wallet_type: payload.walletDetails.walletType, wallet_currency: payload.walletDetails.walletCurrency}},
                        params: { email: payload.email, cardholder_id: payload.cardholderId },
                    }) as {
                        data?: apiResponseType<apiResponseDataType>
                        error?: unknown
                    }

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
        createConversionQuote: build.mutation<apiResponseType<apiResponseDataType>, { email: string; cardholderId: string; body: CreateConversionQuoteRequestBody }>({
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
                            throw new ApplicationServiceError('CREATE-CONVERSION-QUOTE - Failed to fetch application headers');
                        }

                        // Get the latest Redux state
                        state = getState() as rootStateType;

                        headers = walletApiHeaders(state)
                    }

                    const result = await executeBaseQuery(baseQuery, {
                        url: `${WALLET_URL}/currency-conversion/quote`,
                        method: 'POST',
                        headers,
                        data: payload.body,
                        params: { email: payload.email, cardholder_id: payload.cardholderId },
                    }) as {
                        data?: apiResponseType<apiResponseDataType>
                        error?: unknown
                    }

                    return {
                        data: result.data as apiResponseType<apiResponseDataType>,
                    };
                } catch (error) {
                    const rtkError = rtkQueryCatchError(error, 'CREATE-CONVERSION-QUOTE faced application error');
                    return rtkError
                }
            },
        }),


        // =======================================================
        // EXECUTE CURRENCY CONVERSION
        // =======================================================
        executeConversion: build.mutation<apiResponseType<apiResponseDataType>, { email: string; cardholderId: string; body: ExecuteConversionRequestBody }>({
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
                            throw new ApplicationServiceError('EXECUTE-CONVERSION - Failed to fetch application headers');
                        }

                        // Get the latest Redux state
                        state = getState() as rootStateType;

                        headers = walletApiHeaders(state)
                    }

                    const result = await executeBaseQuery(baseQuery, {
                        url: `${WALLET_URL}/currency-conversion/execute`,
                        method: 'POST',
                        headers,
                        data: payload.body,
                        params: { email: payload.email, cardholder_id: payload.cardholderId },
                    }) as {
                        data?: apiResponseType<apiResponseDataType>
                        error?: unknown
                    }

                    return {
                        data: result.data as apiResponseType<apiResponseDataType>,
                    };
                } catch (error) {
                    const rtkError = rtkQueryCatchError(error, 'EXECUTE-CONVERSION faced application error');
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
                        params: { email: payload.email, cardholder_id: payload.cardholderId, wallet_id: payload.walletId, page: payload.pageNumber, page_size: payload.pageSize },
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


        // =======================================================
        // GET WALLET TRANSACTION DETAILS BY ID
        // =======================================================
        getWalletTransactionDetails: build.query<apiResponseType<apiResponseDataType>, { email: string; cardholderId: string; transactionId: string }>({
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
                            throw new ApplicationServiceError('GET-WALLET-TRANSACTION-DETAILS - Failed to fetch application headers');
                        }

                        // Get the latest Redux state
                        state = getState() as rootStateType;

                        headers = walletApiHeaders(state)
                    }

                    const result = await executeBaseQuery(baseQuery, {
                        url: `${WALLET_URL}/transactions/${payload.transactionId}`,
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
                } catch (error) {
                    const rtkError = rtkQueryCatchError(error, 'GET-WALLET-TRANSACTION-DETAILS faced application error');
                    return rtkError;
                }
            },
            providesTags: [{ type: 'Wallet', id: 'TRANSACTION-DETAILS' }],
        }),
    }),
})

export const {
    useCreateWalletMutation,
    useGetAllWalletBalancesQuery,
    useLazyGetAllWalletBalancesQuery,
    useGetWalletDetailsQuery,
    useLazyGetWalletDetailsQuery,
    useCreateConversionQuoteMutation,
    useExecuteConversionMutation,
    useGetWalletTransactionsQuery,
    useLazyGetWalletTransactionsQuery,
    useGetWalletTransactionDetailsQuery,
    useLazyGetWalletTransactionDetailsQuery
} = walletApis
