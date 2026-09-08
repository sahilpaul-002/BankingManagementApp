// User credentials verified and 2fa pending state (i.e user authenticated but not yet authorized)
import { store } from "@/redux/sotre";
import { redirect } from "react-router-dom";

export const requireAuthentication = () => {
    const state = store.getState();

    if (!state.user.isAuthenticated) {
        return redirect("/");
    }

    return null;
};

export const requireAuthorization = () => {
    const state = store.getState();

    if (!state.user.isAuthorized) {
        return redirect("/")
    }
}


// export const requireKycApproval = () => {
//     const email = sessionStorage.getItem('userEmail');

//     const kycQueryState = email
//         ? kycApis.endpoints.getKycDetails.select({ email, cardholderEmail: email })(store.getState())
//         : null;

//     const kycHasError = Boolean(kycQueryState?.isError);

//     if (kycHasError) {
//         return redirect("/dashboard");
//     }

//     return null;
// }