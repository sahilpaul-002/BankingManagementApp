import { createAsyncThunk } from "@reduxjs/toolkit";
import { configApis } from "../features/config/configApi";
import { userApis } from "../features/user/userApi";
import { resetConfigStates } from "../slice/config/configSlice";
import { resetUserState } from "../slice/user/userSlice"
import { clearBanner, clearDestroySession, resetUtilityStates } from "../slice/utility/utilitySlice";
import { InternalApplicationError } from "@/errorHandling/error";
import { logError } from "@/errorHandling/errorLogger";

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

        }
        catch (err) {
            const error = err as any;
            const url =
                error?.config?.url ||
                error?.url ||
                "UNKNOWN_URL";
            const service = "LogoutUser";
            const errorClassName = error?.constructor?.name || "UnknownErrorClass";

            logError("ERROR", {
                message: `{ ${service}} query faced internal service error: ${error.message} `,
                error: err,
                context: url,
            });
            throw new InternalApplicationError(
                `${service} query faced unknown internal application error: ${error?.message || "No error message"} `,
                service,
                error
            );
        }
        finally {
            setTimeout(() => {
                isLoggingOut = false;
            }, 1000);
        }
    }
);