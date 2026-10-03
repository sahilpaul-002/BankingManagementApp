import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery, getAxiosInstance } from '@/configs/axiosConfig';
import { BENEFICIARIES_URL } from '@/configs/constants';
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
// SET UP BENEFICIARIES API HEADERS
// =============================
const beneficiariesApiHeaders = (state: rootStateType) => {
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
export const beneficiariesApis = createApi({
    reducerPath: 'beneficiariesApis',
    baseQuery: axiosBaseQuery(axiosInstance),
    tagTypes: ['Beneficiaries'],
    endpoints: (build) => ({
        // =======================================================
        // GET BENEFICIARIES LIST
        // =======================================================
        getBeneficiaries: build.query<apiResponseType<apiResponseDataType>, { email: string, pageNumber?: number, pageSize?: number }>({
            async queryFn(payload, { getState, dispatch }, _extraOptions, baseQuery) {
                try {
                    let state = getState() as rootStateType;
                    let headers = beneficiariesApiHeaders(state);
                    if (!headers || Object.keys(headers).length === 0) {
                        const result = await dispatch(
                            userApis.endpoints.getApplicationHeaders.initiate(
                                { email: payload.email },
                                { forceRefetch: true }
                            )
                        );
                        if (result.isError) {
                            throw new ApplicationServiceError('GET-BENEFICIARIES-LIST - Failed to fetch application headers');
                        }

                        // Get the latest Redux state
                        state = getState() as rootStateType;

                        headers = beneficiariesApiHeaders(state)
                    }

                    const result = await executeBaseQuery(baseQuery, {
                        url: `${BENEFICIARIES_URL}`,
                        method: 'GET',
                        headers,
                        params: {
                            email: payload.email,
                            ...(payload.pageNumber !== undefined && {
                                page: String(payload.pageNumber),
                            }),
                            ...(payload.pageSize !== undefined && {
                                page_size: String(payload.pageSize),
                            }),
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
                    const rtkError = rtkQueryCatchError(error, 'GET-BENEFICIARIES-LIST faced application error');
                    return rtkError;
                }
            },
            providesTags: [{ type: 'Beneficiaries', id: 'LIST' }],
        }),

        // =======================================================
        // ADD BENEFICIARY
        // =======================================================
        addBeneficiary: build.mutation<apiResponseType<apiResponseDataType>, { email: string; beneficiaryDetails: { accountNumber: string, accountCurrency: string, accountHolderName: string, swiftCode: string, ibanCode: string, bankName: string } }>({
            async queryFn(payload, { getState, dispatch }, _extraOptions, baseQuery) {
                try {
                    let state = getState() as rootStateType;
                    let headers = beneficiariesApiHeaders(state);
                    if (!headers || Object.keys(headers).length === 0) {
                        const result = await dispatch(
                            userApis.endpoints.getApplicationHeaders.initiate(
                                { email: payload.email },
                                { forceRefetch: true }
                            )
                        );
                        if (result.isError) {
                            throw new ApplicationServiceError('ADD-BENEFICARY - Failed to fetch application headers');
                        }

                        // Get the latest Redux state
                        state = getState() as rootStateType;

                        headers = beneficiariesApiHeaders(state)
                    }

                    const result = (await executeBaseQuery(baseQuery, {
                        url: `${BENEFICIARIES_URL}/add`,
                        method: 'POST',
                        headers,
                        params: { email: payload.email },
                        data: {
                            account_number: payload?.beneficiaryDetails?.accountNumber,
                            account_currency: payload?.beneficiaryDetails?.accountCurrency,
                            account_holder_name: payload?.beneficiaryDetails?.accountHolderName,
                            swift_code: payload?.beneficiaryDetails?.swiftCode,
                            iban_code: payload?.beneficiaryDetails?.ibanCode,
                            bank_name: payload?.beneficiaryDetails?.bankName
                        },
                    })) as {
                        data?: apiResponseType<apiResponseDataType>;
                        error?: unknown;
                    };

                    return {
                        data: result.data as apiResponseType<apiResponseDataType>,
                    };
                } catch (error) {
                    const rtkError = rtkQueryCatchError(error, 'ADD-BENEFICARY faced application error');
                    return rtkError;
                }
            },
            invalidatesTags: [{ type: 'Beneficiaries', id: 'LIST' }],
        }),
    }),
});

export const { useGetBeneficiariesQuery, useLazyGetBeneficiariesQuery, useAddBeneficiaryMutation } = beneficiariesApis;