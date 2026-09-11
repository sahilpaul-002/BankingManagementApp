import { configureStore } from '@reduxjs/toolkit'
import { userApis } from './features/user/userApi.js'
import userSlice from "./slice/user/userSlice.js"
import configSlice from './slice/config/configSlice.js'
import { configApis } from './features/config/configApi.js'
import { helperApis } from './features/helper/helperApis.js'
import utilitySlice from './slice/utility/utilitySlice.js'
import { twoFaApis } from './features/twoFa/twoFaApis.js'
import { payablesApis } from './features/payables/payablesApi.js'
import appSessionSlice from './slice/appSession/appSessionSlice.js'

// EXPORT RTK STORE
export const store = configureStore({
    reducer: {
        // Redux Slice Reducer
        appSession: appSessionSlice.reducer,
        config: configSlice.reducer,
        utility: utilitySlice.reducer,
        user: userSlice.reducer,

        // RTK Query reducer
        [configApis.reducerPath]: configApis.reducer, 
        [helperApis.reducerPath]: helperApis.reducer,
        [userApis.reducerPath]: userApis.reducer,
        [twoFaApis.reducerPath]: twoFaApis.reducer,
        [payablesApis.reducerPath]: payablesApis.reducer,
    },

    // 🔥 RTK Query middleware
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(configApis.middleware, helperApis.middleware, userApis.middleware, twoFaApis.middleware, payablesApis.middleware),
})

// EXPORT STORE DISPATCH
export const storeDispatch = store.dispatch

// EXPORT HOOKS TYPES
export type rootStateType = ReturnType<typeof store.getState>
export type appDispatchType = typeof store.dispatch