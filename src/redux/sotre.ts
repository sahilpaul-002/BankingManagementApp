import { configureStore } from '@reduxjs/toolkit'
import { userApis } from './features/user/userApi'
import userSlice from "./slice/user/userSlice.js"
import configSlice from './slice/config/configSlice.js'
import { configApis } from './features/config/configApi.js'

// EXPORT RTK STORE
export const store = configureStore({
    reducer: {
        // Redux Slice Reducer
        config: configSlice.reducer,
        user: userSlice.reducer,

        // RTK Query reducer
        [userApis.reducerPath]: userApis.reducer,
        [configApis.reducerPath]: configApis.reducer, 
    },

    // 🔥 RTK Query middleware
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(userApis.middleware, configApis.middleware),
})

// EXPORT HOOKS TYPES
export type rootStateType = ReturnType<typeof store.getState>
export type appDispatchType = typeof store.dispatch