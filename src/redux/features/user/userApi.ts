import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

interface SigninRequest {
    email: string
    password: string
};

interface SigninResponse {
    status: string,
    message: string,
    data: object
};

export const userApis = createApi({
    reducerPath: "userApis",

    baseQuery: fetchBaseQuery({
        baseUrl: 'http://localhost:3000/api/v1/user',

        prepareHeaders: (headers) => {
            // 🔥 Your custom headers
            headers.set('portal', 'business')
            headers.set('from-portal', 'false')
            headers.set('x-api-key', 'Z0PjX745by9mjgMjfZlNP2hViztkskjduhp8Gwwil')
            headers.set('agent-code', 'INC00001')
            headers.set('subagent-code', '01')
            headers.set('program-id', 'SPMAA0')
            headers.set('business-id', 'INBC00001')
            headers.set('client-id', 'cebd2dfb-b010-48ef-b2f2-ac7e640e3a6')
            headers.set(
                'authorization',
                'Bearer s:eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
            )

            // 🔥 Authorization (dynamic or static)
            // const token = localStorage.getItem('token')

            // if (token) {
            //     headers.set('authorization', `Bearer ${token}`)
            // } else {
            //     // fallback (your static token if needed)
            //     headers.set(
            //         'authorization',
            //         'Bearer s:eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
            //     )
            // }

            // 🔥 Optional but safe
            headers.set('Content-Type', 'application/json')

            return headers
        },
    }),



    endpoints: (build) => ({
        signIn: build.mutation<SigninResponse, SigninRequest>({
            query: (signInPayload: SigninRequest) => ({
                url: '/login',
                method: 'POST',
                body: signInPayload,
            }),

            // 🔥 Optional: clean response
            transformResponse: (response: SigninResponse) => {
                return response
            },

            // 🔥 Optional: clean error
            transformErrorResponse: (response: any) => {
                return response.status
            },

            // 🔥 Side effects (VERY IMPORTANT)
            async onQueryStarted(arg, { queryFulfilled }) {
                try {
                    const { data } = await queryFulfilled

                    // ✅ Save token after login
                    // localStorage.setItem('token', data.token)
                } catch (err) {
                    console.error('Login failed')
                }
            }
        }),
    }),
})

export const { useSignInMutation } = userApis