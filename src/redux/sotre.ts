import { configureStore } from '@reduxjs/toolkit'
import { userApis } from './features/user/userApi'
import {userDetailsSlice} from "../redux/slice/user/userDetailsSlice.js" 

// EXPORT RTK STORE
export const store = configureStore({
    reducer: {
        // Redux Slice Reducer
        userDetails: userDetailsSlice.reducer,
        // 🔥 RTK Query reducer
        [userApis.reducerPath]: userApis.reducer,
    },

    // 🔥 RTK Query middleware
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(userApis.middleware),
})

// EXPORT HOOKS TYPES
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch