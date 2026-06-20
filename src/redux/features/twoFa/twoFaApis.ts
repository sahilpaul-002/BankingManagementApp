import { axiosBaseQuery, getAxiosInstance } from "@/configs/axiosConfig";
import { TWO_FA_URL } from "@/configs/constants";
import { ApplicationServiceError } from "@/errorHandling/error";
import { selectApplicaitonHeaders } from "@/redux/slice/config/configSlice";
import type { rootStateType } from "@/redux/sotre";
import { createApi } from "@reduxjs/toolkit/query/react";
import executeBaseQuery from "../executeBaseQuery";
import rtkQueryCatchError from "@/errorHandling/rtkQueryCatchError";
import { configApis } from "../config/configApi";
import { setAuthorized } from "@/redux/slice/user/userSlice";

type apiResponseDataType = Record<string, any>
type apiResponseType<T> = {
    status: string;
    message: string;
    data?: T;
    error?: any;
}

// =============================
// SET UP USER API HEADERS
// =============================
const twoFaApiHeaders = (state: rootStateType) => {
    const applicationHeaders = selectApplicaitonHeaders(state);

    // Build user api headers
    const dynamicHeaders: Record<string, string> = {}

    if (applicationHeaders) {
        dynamicHeaders['x-api-key'] = applicationHeaders['x-api-key'];
        dynamicHeaders['agent-code'] = applicationHeaders['agent-code'];
        dynamicHeaders['subagent-code'] = applicationHeaders['subagent-code'];
        dynamicHeaders['program-id'] = applicationHeaders['program-id'];
        dynamicHeaders['business-id'] = applicationHeaders['business-id'];
        dynamicHeaders['client-id'] = applicationHeaders['client-id'];
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
export const twoFaApis = createApi({
    reducerPath: 'twoFaApis',
    baseQuery: axiosBaseQuery(axiosInstance),
    endpoints: (build) => ({
        // =======================================================
        // SEND VERIFY EMAIL CODE
        // =======================================================
        sendVerifyEmailCode: build.mutation<apiResponseType<apiResponseDataType>, { email: string }>({
            async queryFn(payload, { getState, dispatch }, _extraOptions, baseQuery) {
                try {
                    const state = getState() as rootStateType

                    // Get user api headers
                    let headers = twoFaApiHeaders(state)
                    if (!headers || Object.keys(headers).length === 0) {
                        // throw new ApplicationServiceError("Verify2FaCode - Missing required dynamic api headers");
                        const domainName = window.location.hostname;
                        const result = await dispatch(
                            configApis.endpoints.getDnsConfig.initiate(
                                {
                                    domainName: domainName,
                                },
                                {
                                    forceRefetch: true  // Force RTK to refetch the query
                                }
                            )
                        )
                        if (result.isError) {
                            throw new ApplicationServiceError("SEND-EMAIL-CODE - Failed to fetch DNS Config data")
                        }

                        headers = twoFaApiHeaders(state)
                    }

                    const result = await executeBaseQuery(baseQuery, {
                        url: `${TWO_FA_URL}/sendVerifyEmailCode`,
                        method: 'POST',
                        headers,
                        data: payload,
                    }) as {
                        data?: apiResponseType<apiResponseDataType>
                        error?: unknown
                    }

                    return {
                        data: result.data as apiResponseType<apiResponseDataType>,
                    };
                }
                catch (error) {
                    const rtkError = rtkQueryCatchError(error, "SEND-EMAL-CODE faced application error ");
                    return rtkError;
                }
            },
        }),

        // =======================================================
        // VERIFY TWO FA CODE
        // =======================================================
        verifyEmailCode: build.mutation<apiResponseType<apiResponseDataType>, { email: string, code: string }>({
            async queryFn(payload, { getState, dispatch }, _extraOptions, baseQuery) {
                try {
                    const state = getState() as rootStateType

                    // Get user api headers
                    let headers = twoFaApiHeaders(state)
                    if (!headers || Object.keys(headers).length === 0) {
                        // throw new ApplicationServiceError("Verify2FaCode - Missing required dynamic api headers");
                        const domainName = window.location.hostname;
                        const result = await dispatch(
                            configApis.endpoints.getDnsConfig.initiate(
                                {
                                    domainName: domainName,
                                },
                                {
                                    forceRefetch: true  // Force RTK to refetch the query
                                }
                            )
                        )
                        if (result.isError) {
                            throw new ApplicationServiceError("VERIFY-EMAIL-CODE - Failed to fetch DNS Config data")
                        }

                        headers = twoFaApiHeaders(state)
                    }

                    const result = await executeBaseQuery(baseQuery, {
                        url: `${TWO_FA_URL}/verifyEmail`,
                        method: 'POST',
                        headers,
                        data: payload,
                    }) as {
                        data?: apiResponseType<apiResponseDataType>
                        error?: unknown
                    }

                    // Update the authorization status of user
                    dispatch(setAuthorized(true));

                    return {
                        data: result.data as apiResponseType<apiResponseDataType>,
                    };
                }
                catch (error) {
                    const rtkError = rtkQueryCatchError(error, "VERIFY-EMAIL-CODE faced application error ");
                    return rtkError;
                }
            },
        }),

        // =======================================================
        // SEND TWO FA CODE
        // =======================================================
        sendTwoFaCode: build.mutation<apiResponseType<apiResponseDataType>, { email: string }>({
            async queryFn(payload, { getState, dispatch }, _extraOptions, baseQuery) {
                try {
                    const state = getState() as rootStateType

                    // Get user api headers
                    let headers = twoFaApiHeaders(state)
                    if (!headers || Object.keys(headers).length === 0) {
                        // throw new ApplicationServiceError("Verify2FaCode - Missing required dynamic api headers");
                        const domainName = window.location.hostname;
                        const result = await dispatch(
                            configApis.endpoints.getDnsConfig.initiate(
                                {
                                    domainName: domainName,
                                },
                                {
                                    forceRefetch: true  // Force RTK to refetch the query
                                }
                            )
                        )
                        if (result.isError) {
                            throw new ApplicationServiceError("SEND-2FA-CODE - Failed to fetch DNS Config data")
                        }

                        headers = twoFaApiHeaders(state)
                    }

                    const result = await executeBaseQuery(baseQuery, {
                        url: `${TWO_FA_URL}/send2FaCode`,
                        method: 'POST',
                        headers,
                        data: payload,
                    }) as {
                        data?: apiResponseType<apiResponseDataType>
                        error?: unknown
                    }

                    return {
                        data: result.data as apiResponseType<apiResponseDataType>,
                    };
                }
                catch (error) {
                    const rtkError = rtkQueryCatchError(error, "SEND-2FA-CODE faced application error ");
                    return rtkError;
                }
            },
        }),

        // =======================================================
        // VERIFY TWO FA CODE
        // =======================================================
        verifyTwoFaCode: build.mutation<apiResponseType<apiResponseDataType>, { email: string, code: string }>({
            async queryFn(payload, { getState, dispatch }, _extraOptions, baseQuery) {
                try {
                    const state = getState() as rootStateType

                    // Get user api headers
                    let headers = twoFaApiHeaders(state)
                    if (!headers || Object.keys(headers).length === 0) {
                        // throw new ApplicationServiceError("Verify2FaCode - Missing required dynamic api headers");
                        const domainName = window.location.hostname;
                        const result = await dispatch(
                            configApis.endpoints.getDnsConfig.initiate(
                                {
                                    domainName: domainName,
                                },
                                {
                                    forceRefetch: true  // Force RTK to refetch the query
                                }
                            )
                        )
                        if (result.isError) {
                            throw new ApplicationServiceError("VERIFY-2FA-CODE - Failed to fetch DNS Config data")
                        }

                        headers = twoFaApiHeaders(state)
                    }

                    const result = await executeBaseQuery(baseQuery, {
                        url: `${TWO_FA_URL}/verify2FaCode`,
                        method: 'POST',
                        headers,
                        data: payload,
                    }) as {
                        data?: apiResponseType<apiResponseDataType>
                        error?: unknown
                    }

                    // Update the authorization status of user
                    dispatch(setAuthorized(true));

                    return {
                        data: result.data as apiResponseType<apiResponseDataType>,
                    };
                }
                catch (error) {
                    const rtkError = rtkQueryCatchError(error, "VERIFY-2FA-CODE faced application error ");
                    return rtkError;
                }
            },
        }),

        // =======================================================
        // SEND RESET PASSWORD CODE
        // =======================================================
        sendResetPasswordCode: build.mutation<apiResponseType<apiResponseDataType>, { email: string }>({
            async queryFn(payload, { getState, dispatch }, _extraOptions, baseQuery) {
                try {
                    const state = getState() as rootStateType

                    // Get user api headers
                    let headers = twoFaApiHeaders(state)
                    if (!headers || Object.keys(headers).length === 0) {
                        // throw new ApplicationServiceError("Verify2FaCode - Missing required dynamic api headers");
                        const domainName = window.location.hostname;
                        const result = await dispatch(
                            configApis.endpoints.getDnsConfig.initiate(
                                {
                                    domainName: domainName,
                                },
                                {
                                    forceRefetch: true  // Force RTK to refetch the query
                                }
                            )
                        )
                        if (result.isError) {
                            throw new ApplicationServiceError("SEND-RESET-PASSWORD-CODE - Failed to fetch DNS Config data")
                        }

                        headers = twoFaApiHeaders(state)
                    }

                    const result = await executeBaseQuery(baseQuery, {
                        url: `${TWO_FA_URL}/sendResetPasswordCode`,
                        method: 'POST',
                        headers,
                        data: payload,
                    }) as {
                        data?: apiResponseType<apiResponseDataType>
                        error?: unknown
                    }

                    // Store email in sessionStorage for verification page
                    sessionStorage.setItem('userEmail', payload.email);

                    return {
                        data: result.data as apiResponseType<apiResponseDataType>,
                    };
                }
                catch (error) {
                    const rtkError = rtkQueryCatchError(error, "SEND-RESET-PASSWORD-CODE faced application error ");
                    return rtkError;
                }
            },
        }),

        // =======================================================
        // VERIFY RESET PASSWORD CODE
        // =======================================================
        verifyResetPasswordCode: build.mutation<apiResponseType<apiResponseDataType>, { email: string, password: string, code: string }>({
            async queryFn(payload, { getState, dispatch }, _extraOptions, baseQuery) {
                try {
                    const state = getState() as rootStateType

                    // Get user api headers
                    let headers = twoFaApiHeaders(state)
                    if (!headers || Object.keys(headers).length === 0) {
                        // throw new ApplicationServiceError("Verify2FaCode - Missing required dynamic api headers");
                        const domainName = window.location.hostname;
                        const result = await dispatch(
                            configApis.endpoints.getDnsConfig.initiate(
                                {
                                    domainName: domainName,
                                },
                                {
                                    forceRefetch: true  // Force RTK to refetch the query
                                }
                            )
                        )
                        if (result.isError) {
                            throw new ApplicationServiceError("VERIFY-2FA-CODE - Failed to fetch DNS Config data")
                        }

                        headers = twoFaApiHeaders(state)
                    }

                    const result = await executeBaseQuery(baseQuery, {
                        url: `${TWO_FA_URL}/verifyResetPasswordCode`,
                        method: 'POST',
                        headers,
                        data: payload,
                    }) as {
                        data?: apiResponseType<apiResponseDataType>
                        error?: unknown
                    }

                    // Update the authorization status of user
                    dispatch(setAuthorized(true));

                    return {
                        data: result.data as apiResponseType<apiResponseDataType>,
                    };
                }
                catch (error) {
                    const rtkError = rtkQueryCatchError(error, "VERIFY-2FA-CODE faced application error ");
                    return rtkError;
                }
            },
        }),
    })
})

export const { useSendVerifyEmailCodeMutation, useVerifyEmailCodeMutation, useSendTwoFaCodeMutation, useVerifyTwoFaCodeMutation, useSendResetPasswordCodeMutation, useVerifyResetPasswordCodeMutation } = twoFaApis