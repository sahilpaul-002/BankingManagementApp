import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery, getAxiosInstance } from '@/configs/axiosConfig';
import { CARDHOLDER_URL } from '@/configs/constants';
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
// SET UP CARDHOLDER API HEADERS
// =============================
const cardholdersApiHeaders = (state: rootStateType) => {
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
export const cardholdersApis = createApi({
    reducerPath: 'cardholdersApis',
    baseQuery: axiosBaseQuery(axiosInstance),
    tagTypes: ['Cardholders'],
    endpoints: (build) => ({
        // =======================================================
        // GET CARDHOLDERS LIST
        // =======================================================
        getCardholders: build.query<apiResponseType<apiResponseDataType>, { email: string, pageNumber: number, pageSize: number }>({
            async queryFn(payload, { getState, dispatch }, _extraOptions, baseQuery) {
                try {
                    let state = getState() as rootStateType;
                    let headers = cardholdersApiHeaders(state);
                    if (!headers || Object.keys(headers).length === 0) {
                        const result = await dispatch(
                            userApis.endpoints.getApplicationHeaders.initiate(
                                { email: payload.email },
                                { forceRefetch: true }
                            )
                        );
                        if (result.isError) {
                            throw new ApplicationServiceError('GET-CARDHOLDERS-LIST - Failed to fetch application headers');
                        }

                        // Get the latest Redux state
                        state = getState() as rootStateType;

                        headers = cardholdersApiHeaders(state)
                    }

                    const result = await executeBaseQuery(baseQuery, {
                        url: `${CARDHOLDER_URL}`,
                        method: 'GET',
                        headers,
                        params: {
                            email: payload.email,
                            page: payload.pageNumber,
                            page_size: payload.pageSize,
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
                    const rtkError = rtkQueryCatchError(error, 'GET-CARDHOLDERS-LIST faced application error');
                    return rtkError;
                }
            },
            providesTags: [{ type: 'Cardholders', id: 'LIST' }],
        }),

        // =======================================================
        // ADD CARDHOLDER
        // =======================================================
        addCardholder: build.mutation<apiResponseType<apiResponseDataType>, { email: string; cardholderDetails: { email: string, fullName: string, mobileCountryCode: string, mobileCountryName: string, phoneNumber: string, dateOfBirth: string, gender: "MALE" | "FEMALE" } }>({
            async queryFn(payload, { getState, dispatch }, _extraOptions, baseQuery) {
                try {
                    let state = getState() as rootStateType;
                    let headers = cardholdersApiHeaders(state);
                    if (!headers || Object.keys(headers).length === 0) {
                        const result = await dispatch(
                            userApis.endpoints.getApplicationHeaders.initiate(
                                { email: payload.email },
                                { forceRefetch: true }
                            )
                        );
                        if (result.isError) {
                            throw new ApplicationServiceError('ADD-CARDHOLDER - Failed to fetch application headers');
                        }

                        // Get the latest Redux state
                        state = getState() as rootStateType;

                        headers = cardholdersApiHeaders(state)
                    }

                    const result = (await executeBaseQuery(baseQuery, {
                        url: `${CARDHOLDER_URL}/add`,
                        method: 'POST',
                        headers,
                        params: { email: payload.email },
                        data: {
                            email: payload?.cardholderDetails?.email,
                            full_name: payload?.cardholderDetails?.fullName,
                            mobile_country_code: payload?.cardholderDetails?.mobileCountryCode,
                            mobile_country_name: payload?.cardholderDetails?.mobileCountryName,
                            phone_number: payload?.cardholderDetails?.phoneNumber,
                            date_of_birth: payload?.cardholderDetails?.dateOfBirth,
                            gender: payload?.cardholderDetails?.gender
                        },
                    })) as {
                        data?: apiResponseType<apiResponseDataType>;
                        error?: unknown;
                    };

                    return {
                        data: result.data as apiResponseType<apiResponseDataType>,
                    };
                } catch (error) {
                    const rtkError = rtkQueryCatchError(error, 'ADD-CARDHOLDER faced application error');
                    return rtkError;
                }
            },
            invalidatesTags: [{ type: 'Cardholders', id: 'LIST' }],
        }),
    }),
});

export const { useGetCardholdersQuery, useLazyGetCardholdersQuery, useAddCardholderMutation } = cardholdersApis;