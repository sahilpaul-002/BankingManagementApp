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
    tagTypes: ['Wallet'],
    baseQuery: axiosBaseQuery(axiosInstance),
    endpoints: (build) => ({
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
                        params: {email: payload.email, cardholder_id: payload.cardholderId},
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
    }),
})

export const { useGetWalletDetailsQuery, useLazyGetWalletDetailsQuery } = walletApis
