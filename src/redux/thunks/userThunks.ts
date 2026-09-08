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
// import { kycApis } from "../features/kyc/kycApis";
// import { utilityApis } from "../features/utility/utilityApis";
// import { cardholderApis } from "../features/cardholder/cardholderApis";
// import { beneficiariesApis } from "../features/transfer/beneficiaries";
// import { payoutApis } from "../features/transfer/payout";
// import { cardsApis } from "../features/cards/cardsApis";
// import { entityApis } from "../features/entity/entityApis";
// import { accountApis } from "../features/account/accountApis";
// import { prefundApis } from "../features/prefund/prefundApis";
import { finishLogout, startLogout } from "../slice/appSession/appSessionSlice";

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
            // dispatch(kycApis.util.resetApiState());
            // dispatch(utilityApis.util.resetApiState());
            // dispatch(cardholderApis.util.resetApiState());
            // dispatch(beneficiariesApis.util.resetApiState());
            // dispatch(payoutApis.util.resetApiState());
            // dispatch(cardsApis.util.resetApiState());
            // dispatch(entityApis.util.resetApiState());
            // dispatch(accountApis.util.resetApiState());
            // dispatch(prefundApis.util.resetApiState());

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