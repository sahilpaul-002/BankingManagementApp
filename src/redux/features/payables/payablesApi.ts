import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery, getAxiosInstance } from '@/configs/axiosConfig';
import { PAYABLES_URL } from '@/configs/constants';
import { selectApplicaitonHeaders } from '@/redux/slice/config/configSlice';
import type { rootStateType } from '@/redux/sotre';
import executeBaseQuery from '../executeBaseQuery';
import rtkQueryCatchError from '@/errorHandling/rtkQueryCatchError';
import type {
    AddBeneficiaryRequestBody,
    BeneficiariesListResponse,
    BeneficiaryDetailsResponse,
    BeneficiaryItem,
} from '@/fallbacks/payables/beneficiaries/beneficiariesFallbacks';
import type {
    CreatePayoutQuoteRequestBody,
    CreatePayoutQuoteResponse,
    ExecutePayoutQuoteRequestBody,
    ExecutePayoutQuoteResponse,
    PayoutTransactionsListResponse,
    PayoutTransactionDetailsResponse,
} from '@/fallbacks/payables/payouts/payoutsFallbacks';

const payablesApiHeaders = (state: rootStateType) => {
    const applicationHeaders = selectApplicaitonHeaders(state);
    const dynamicHeaders: Record<string, string | null> = {};

    if (applicationHeaders) {
        dynamicHeaders['x-api-key'] = applicationHeaders['x-api-key'] || null;
        dynamicHeaders['authorization'] = applicationHeaders['authorization'] || null;
    }
    return dynamicHeaders;
};

const axiosInstance = getAxiosInstance();

export const payablesApis = createApi({
    reducerPath: 'payablesApis',
    baseQuery: axiosBaseQuery(axiosInstance),
    tagTypes: ['Beneficiaries', 'Payouts'],
    endpoints: (build) => ({
        // =======================================================
        // GET BENEFICIARIES LIST
        // =======================================================
        getBeneficiaries: build.query<BeneficiariesListResponse, void>({
            async queryFn(_payload, { getState }, _extraOptions, baseQuery) {
                try {
                    const state = getState() as rootStateType;
                    const headers = payablesApiHeaders(state);

                    const result = (await executeBaseQuery(baseQuery, {
                        url: `${PAYABLES_URL}/beneficiaries`,
                        method: 'GET',
                        headers,
                    })) as {
                        data?: BeneficiariesListResponse;
                        error?: unknown;
                    };

                    return {
                        data: result.data as BeneficiariesListResponse,
                    };
                } catch (error) {
                    const rtkError = rtkQueryCatchError(
                        error,
                        'GET-BENEFICIARIES faced application error '
                    );
                    return rtkError;
                }
            },
            providesTags: ['Beneficiaries'],
        }),

        // =======================================================
        // GET BENEFICIARY DETAILS BY ID
        // =======================================================
        getBeneficiaryDetails: build.query<BeneficiaryDetailsResponse, string>({
            async queryFn(id, { getState }, _extraOptions, baseQuery) {
                try {
                    const state = getState() as rootStateType;
                    const headers = payablesApiHeaders(state);

                    const result = (await executeBaseQuery(baseQuery, {
                        url: `${PAYABLES_URL}/beneficiaries/${id}`,
                        method: 'GET',
                        headers,
                    })) as {
                        data?: BeneficiaryDetailsResponse;
                        error?: unknown;
                    };

                    return {
                        data: result.data as BeneficiaryDetailsResponse,
                    };
                } catch (error) {
                    const rtkError = rtkQueryCatchError(
                        error,
                        'GET-BENEFICIARY-DETAILS faced application error '
                    );
                    return rtkError;
                }
            },
        }),

        // =======================================================
        // ADD BENEFICIARY
        // =======================================================
        addBeneficiary: build.mutation<
            BeneficiaryDetailsResponse,
            AddBeneficiaryRequestBody
        >({
            async queryFn(payload, { getState }, _extraOptions, baseQuery) {
                try {
                    const state = getState() as rootStateType;
                    const headers = payablesApiHeaders(state);

                    const result = (await executeBaseQuery(baseQuery, {
                        url: `${PAYABLES_URL}/beneficiaries`,
                        method: 'POST',
                        headers,
                        data: payload,
                    })) as {
                        data?: BeneficiaryDetailsResponse;
                        error?: unknown;
                    };

                    return {
                        data: result.data as BeneficiaryDetailsResponse,
                    };
                } catch (error) {
                    const rtkError = rtkQueryCatchError(
                        error,
                        'ADD-BENEFICIARY faced application error '
                    );
                    return rtkError;
                }
            },
            invalidatesTags: ['Beneficiaries'],
        }),

        // =======================================================
        // CREATE PAYOUT QUOTE
        // =======================================================
        createPayoutQuote: build.mutation<
            CreatePayoutQuoteResponse,
            CreatePayoutQuoteRequestBody
        >({
            async queryFn(payload, { getState }, _extraOptions, baseQuery) {
                try {
                    const state = getState() as rootStateType;
                    const headers = payablesApiHeaders(state);

                    const result = (await executeBaseQuery(baseQuery, {
                        url: `${PAYABLES_URL}/payouts/quote`,
                        method: 'POST',
                        headers,
                        data: payload,
                    })) as {
                        data?: CreatePayoutQuoteResponse;
                        error?: unknown;
                    };

                    return {
                        data: result.data as CreatePayoutQuoteResponse,
                    };
                } catch (error) {
                    const rtkError = rtkQueryCatchError(
                        error,
                        'CREATE-PAYOUT-QUOTE faced application error '
                    );
                    return rtkError;
                }
            },
        }),

        // =======================================================
        // EXECUTE PAYOUT QUOTE
        // =======================================================
        executePayoutQuote: build.mutation<
            ExecutePayoutQuoteResponse,
            ExecutePayoutQuoteRequestBody
        >({
            async queryFn(payload, { getState }, _extraOptions, baseQuery) {
                try {
                    const state = getState() as rootStateType;
                    const headers = payablesApiHeaders(state);

                    const result = (await executeBaseQuery(baseQuery, {
                        url: `${PAYABLES_URL}/payouts/execute`,
                        method: 'POST',
                        headers,
                        data: payload,
                    })) as {
                        data?: ExecutePayoutQuoteResponse;
                        error?: unknown;
                    };

                    return {
                        data: result.data as ExecutePayoutQuoteResponse,
                    };
                } catch (error) {
                    const rtkError = rtkQueryCatchError(
                        error,
                        'EXECUTE-PAYOUT-QUOTE faced application error '
                    );
                    return rtkError;
                }
            },
            invalidatesTags: ['Payouts'],
        }),

        // =======================================================
        // GET PAYOUT TRANSACTIONS LIST
        // =======================================================
        getPayoutTransactions: build.query<PayoutTransactionsListResponse, void>({
            async queryFn(_payload, { getState }, _extraOptions, baseQuery) {
                try {
                    const state = getState() as rootStateType;
                    const headers = payablesApiHeaders(state);

                    const result = (await executeBaseQuery(baseQuery, {
                        url: `${PAYABLES_URL}/payouts/transactions`,
                        method: 'GET',
                        headers,
                    })) as {
                        data?: PayoutTransactionsListResponse;
                        error?: unknown;
                    };

                    return {
                        data: result.data as PayoutTransactionsListResponse,
                    };
                } catch (error) {
                    const rtkError = rtkQueryCatchError(
                        error,
                        'GET-PAYOUT-TRANSACTIONS faced application error '
                    );
                    return rtkError;
                }
            },
            providesTags: ['Payouts'],
        }),

        // =======================================================
        // GET PAYOUT TRANSACTION DETAILS BY ID
        // =======================================================
        getPayoutTransactionDetails: build.query<PayoutTransactionDetailsResponse, string>({
            async queryFn(id, { getState }, _extraOptions, baseQuery) {
                try {
                    const state = getState() as rootStateType;
                    const headers = payablesApiHeaders(state);

                    const result = (await executeBaseQuery(baseQuery, {
                        url: `${PAYABLES_URL}/payouts/transactions/${id}`,
                        method: 'GET',
                        headers,
                    })) as {
                        data?: PayoutTransactionDetailsResponse;
                        error?: unknown;
                    };

                    return {
                        data: result.data as PayoutTransactionDetailsResponse,
                    };
                } catch (error) {
                    const rtkError = rtkQueryCatchError(
                        error,
                        'GET-PAYOUT-TRANSACTION-DETAILS faced application error '
                    );
                    return rtkError;
                }
            },
        }),
    }),
});

export const {
    useGetBeneficiariesQuery,
    useGetBeneficiaryDetailsQuery,
    useAddBeneficiaryMutation,
    useCreatePayoutQuoteMutation,
    useExecutePayoutQuoteMutation,
    useGetPayoutTransactionsQuery,
    useGetPayoutTransactionDetailsQuery,
} = payablesApis;

