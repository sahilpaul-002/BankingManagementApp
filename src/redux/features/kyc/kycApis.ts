import { axiosBaseQuery, getAxiosInstance } from '@/configs/axiosConfig'
import { createApi, type FetchBaseQueryError } from '@reduxjs/toolkit/query/react'
import type { rootStateType } from '@/redux/sotre'
import executeBaseQuery from '../executeBaseQuery'
import rtkQueryCatchError from '@/errorHandling/rtkQueryCatchError'
import { KYC_URL } from '@/configs/constants'
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
// SET UP KYC API HEADERS
// =============================
const kycApiHeaders = (state: rootStateType) => {
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
export const kycApis = createApi({
    reducerPath: 'kycApis',
    tagTypes: ['Kyc'],
    baseQuery: axiosBaseQuery(axiosInstance),
    endpoints: (build) => ({
        // =======================================================
        // GET KYC DETAILS
        // =======================================================
        getKycDetails: build.query<apiResponseType<apiResponseDataType>, { email: string }>({
            async queryFn(payload, { getState, dispatch }, _extraOptions, baseQuery) {
                try {
                    let state = getState() as rootStateType;
                    // Get user api headers
                    let headers = kycApiHeaders(state)
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
                            throw new ApplicationServiceError("GET-KYC-DETAILS - Failed to fetch application headers")
                        }

                        // Get the latest Redux state
                        state = getState() as rootStateType;

                        headers = kycApiHeaders(state)
                    }

                    const result = await executeBaseQuery(baseQuery, {
                        url: `${KYC_URL}`,
                        method: 'GET',
                        headers,
                        params: payload,
                    }) as {
                        data?: apiResponseType<apiResponseDataType>
                        error?: unknown
                    }

                    return {
                        data: result.data as apiResponseType<apiResponseDataType>,
                    };
                }
                catch (error) {
                    const rtkError = rtkQueryCatchError(error, "GET-KYC-DETAILS faced application error ");
                    return rtkError;
                }
            },
            providesTags: [{ type: 'Kyc', id: 'DETAILS' }],
        }),


        // =======================================================
        // UPLOAD KYC DETAILS
        // =======================================================
        uploadKycDetails: build.mutation<apiResponseType<apiResponseDataType>, { email: string, poi_number: string, poa_number: string, poi_document: File, poa_document: File }>({
            async queryFn(payload, { getState, dispatch }, _extraOptions, baseQuery) {
                try {
                    let state = getState() as rootStateType;
                    // Get user api headers
                    let headers = kycApiHeaders(state)
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
                            throw new ApplicationServiceError("UPLOAD-KYC-DETAILS - Failed to fetch application headers")
                        }

                        // Get the latest Redux state
                        state = getState() as rootStateType;

                        headers = kycApiHeaders(state)
                    }

                    const formData = new FormData();

                    formData.append('email', payload.email);
                    formData.append('poi_number', payload.poi_number);
                    formData.append('poa_number', payload.poa_number);
                    formData.append('poi_document', payload.poi_document);
                    formData.append('poa_document', payload.poa_document);

                    const result = await executeBaseQuery(baseQuery, {
                        url: `${KYC_URL}/upload`,
                        method: 'POST',
                        headers,
                        data: formData,
                    }) as {
                        data?: apiResponseType<apiResponseDataType>;
                        error?: unknown;
                    };

                    return {
                        data: result.data as apiResponseType<apiResponseDataType>,
                    };
                }
                catch (error) {
                    const rtkError = rtkQueryCatchError(error, "UPLOAD-KYC-DETAILS faced application error ");
                    return rtkError;
                }
            },
            invalidatesTags: [{ type: 'Kyc', id: 'DETAILS' }],
        }),
    }),
})

export const { useGetKycDetailsQuery, useLazyGetKycDetailsQuery, useUploadKycDetailsMutation } = kycApis
