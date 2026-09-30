import { createAsyncThunk } from "@reduxjs/toolkit";
import { configApis } from "../features/config/configApi";
import { userApis } from "../features/user/userApi";
import { helperApis } from "../features/helper/helperApis";
import { resetConfigStates } from "../slice/config/configSlice";
import { resetUserState } from "../slice/user/userSlice";
import {clearBanner, clearDestroySession, resetUtilityStates} from "../slice/utility/utilitySlice";
import { InternalApplicationError } from "@/errorHandling/error";
import { logError } from "@/errorHandling/errorLogger";
import { twoFaApis } from "../features/twoFa/twoFaApis";
import { kycApis } from "../features/kyc/kycApis";
// import { cardholderApis } from "../features/cardholder/cardholderApis";
// import { cardsApis } from "../features/cards/cardsApis";
import { finishLogout, startLogout } from "../slice/appSession/appSessionSlice";
import { beneficiariesApis } from "../features/beneficiaries/beneficiariesApi";
import { walletApis } from "../features/wallet/walletApis";
import { transferApis } from "../features/transfer/transferApis";

let isLoggingOut = false;

export const logoutUser = createAsyncThunk(
    "user/logoutUser",
    async (_, { dispatch }) => {
        // Prevent multiple logout requests
        if (isLoggingOut) {
            return;
        }

        isLoggingOut = true;

        // Inform UI logout has started
        dispatch(startLogout());

        try {
            // Destroy servier-side session before cleareing ui data
            try {
                await dispatch(
                    helperApis.endpoints.destroySession.initiate()
                ).unwrap();
            } catch (error) {
                logError("WARN", {
                    message: "Failed to destroy server session during logout",
                    error,
                    context: "LogoutUser.destroySession",
                });
            }

            // Clear browser storage
            localStorage.clear();
            sessionStorage.clear();

            // Clear RTK Query caches
            dispatch(configApis.util.resetApiState());
            dispatch(helperApis.util.resetApiState());
            dispatch(userApis.util.resetApiState());
            dispatch(twoFaApis.util.resetApiState());
            dispatch(kycApis.util.resetApiState());
            dispatch(walletApis.util.resetApiState());
            dispatch(beneficiariesApis.util.resetApiState());
            dispatch(transferApis.util.resetApiState())
            // dispatch(cardholderApis.util.resetApiState());
            // dispatch(cardsApis.util.resetApiState());
            // dispatch(accountApis.util.resetApiState());

            // Reset normal Redux slices.
            dispatch(resetUserState());
            dispatch(resetConfigStates());
            dispatch(resetUtilityStates());
            dispatch(clearDestroySession());
            dispatch(clearBanner());

            /*
             * Redirect only AFTER cleanup is complete.
             *
             * replace() prevents the user from using the browser's
             * back button to return to the authenticated page.
             */
            window.location.replace("/");
        }
        catch (err) {
            const error = err as any;

            const url =
                error?.config?.url ||
                error?.url ||
                "UNKNOWN_URL";

            const service = "LogoutUser";

            logError("ERROR", {
                message: `{ ${service} } query faced internal service error: ${error?.message || "Unknown error"
                    }`,
                error,
                context: url,
            });

            // If logout fails allow the ui to reder again
            dispatch(finishLogout());
            isLoggingOut = false;

            throw new InternalApplicationError(
                `${service} query faced unknown internal application error: ${error?.message || "No error message"
                }`,
                service,
                error
            );
        }
        finally {
            isLoggingOut = false;
        }
    }
);