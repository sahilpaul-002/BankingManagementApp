import { configureStore } from '@reduxjs/toolkit'
import { userApis } from './features/user/userApi.js'
import userSlice from "./slice/user/userSlice.js"
import configSlice from './slice/config/configSlice.js'
import { configApis } from './features/config/configApi.js'
import { helperApis } from './features/helper/helperApis.js'
import utilitySlice from './slice/utility/utilitySlice.js'
import { twoFaApis } from './features/twoFa/twoFaApis.js'
import { beneficiariesApis } from './features/beneficiaries/beneficiariesApi.js'
import appSessionSlice from './slice/appSession/appSessionSlice.js'
import { kycApis } from './features/kyc/kycApis.js'
import { walletApis } from './features/wallet/walletApis.js'
import { transferApis } from './features/transfer/transferApis.js'
import { cardholdersApis } from './features/cardholder/cardholdersApi.js'
import { cardApis } from './features/card/cardApi.js'

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
        [kycApis.reducerPath]: kycApis.reducer,
        [walletApis.reducerPath]: walletApis.reducer,
        [beneficiariesApis.reducerPath]: beneficiariesApis.reducer,
        [transferApis.reducerPath]: transferApis.reducer,
        [cardholdersApis.reducerPath]: cardholdersApis.reducer,
        [cardApis.reducerPath]: cardApis.reducer,
    },

    // 🔥 RTK Query middleware
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(configApis.middleware, helperApis.middleware, userApis.middleware, twoFaApis.middleware, kycApis.middleware, walletApis.middleware, beneficiariesApis.middleware, transferApis.middleware, cardholdersApis.middleware, cardApis.middleware),
})

// EXPORT STORE DISPATCH
export const storeDispatch = store.dispatch

// EXPORT HOOKS TYPES
export type rootStateType = ReturnType<typeof store.getState>
export type appDispatchType = typeof store.dispatch