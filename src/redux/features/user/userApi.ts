import { USER_URL } from '@/configs/constants'
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { selectDnsConfigDetails, type DnsConfigData } from '@/redux/slice/config/configSlice'
import type { RootState } from '@/redux/sotre'

interface SigninRequest {
    email: string
    password: string
};

interface SigninResponse {
    status: string,
    message: string,
    data?: object,
    error?: any
};

// ==============================
// BASE QUERY (STATIC BASE URL)
// ==============================
const customBaseQuery = fetchBaseQuery({
    baseUrl: 'http://localhost:3000', // 🔥 keep static

    prepareHeaders: (headers, { getState }) => {
        const state = getState() as RootState
        const dnsConfig = selectDnsConfigDetails(state)
        console.log("Dns data: ", dnsConfig);

        // ✅ Dynamic headers from Redux
        if (dnsConfig) {
            headers.set('x-api-key', dnsConfig.x_api_key)
            headers.set('agent-code', dnsConfig.agent_code)
            headers.set('subagent-code', dnsConfig.subagent_code)
            headers.set('program-id', dnsConfig.program_id)
            headers.set('business-id', dnsConfig.business_id)
            headers.set('client-id', dnsConfig.client_id)
            headers.set("authorization", `Bearer ${dnsConfig.accessToken}`)
        }

        // ✅ Static headers
        headers.set('portal', 'business')
        headers.set('from-portal', 'false')
        headers.set('Content-Type', 'application/json')

        return headers
    },
    credentials: "include"
})

// ==============================
// API
// ==============================
export const userApis = createApi({
    reducerPath: "userApis",

    baseQuery: customBaseQuery,


    // ==============================
    // SIGN IN
    // ==============================
    endpoints: (build) => ({
        signIn: build.mutation<SigninResponse, SigninRequest>({
            async queryFn(payload, { getState }, _extraOptions, baseQuery) {
                const state = getState() as RootState
                const dnsConfig = selectDnsConfigDetails(state)

                if (!dnsConfig) {
                    return {
                        error: {
                            status: 400,
                            data: 'DNS Config not loaded'
                        }
                    }
                }

                const result = await baseQuery({
                    url: `${dnsConfig.base_url_api}${USER_URL}/login`,
                    method: 'POST',
                    body: payload
                })

                if (result.error) {
                    return { error: result.error }
                }

                return {
                    data: result.data as SigninResponse
                }
            },

            // async onQueryStarted(payload, { queryFulfilled }) {
            //     try {
            //         const { data } = await queryFulfilled
            //         // localStorage.setItem('token', data.token)
            //     } catch (err) {
            //         console.error('Login failed')
            //     }
            // }
        })
    })
})

export const { useSignInMutation } = userApis