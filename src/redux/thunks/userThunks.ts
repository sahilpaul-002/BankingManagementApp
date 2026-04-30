import { createAsyncThunk } from "@reduxjs/toolkit";
import { configApis } from "../features/config/configApi";
import { userApis } from "../features/user/userApi";
import { resetConfigStates } from "../slice/config/configSlice";
import { resetUserState } from "../slice/user/userSlice"
import { clearBanner, clearDestroySession, resetUtilityStates } from "../slice/utility/utilitySlice";

let isLoggingOut = false;


export const logoutUser = createAsyncThunk(
    "user/logoutUser",
    async (_, { dispatch }) => {
        if (isLoggingOut) return;
        isLoggingOut = true;

        try {
            // Clear storage
            localStorage.clear();
            sessionStorage.clear();

            // Reset RTK Query cache
            dispatch(userApis.util.resetApiState());
            dispatch(configApis.util.resetApiState());

            // Reset redux states
            dispatch(resetUserState());
            dispatch(resetConfigStates());
            dispatch(resetUtilityStates());
            dispatch(clearDestroySession());
            dispatch(clearBanner());

            // Redirect
            window.location.href = "/";

        } finally {
            setTimeout(() => {
                isLoggingOut = false;
            }, 1000);
        }
    }
);