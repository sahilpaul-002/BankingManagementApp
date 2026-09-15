// User credentials verified and 2fa pending state (i.e user authenticated but not yet authorized)
import { kycApis } from "@/redux/features/kyc/kycApis";
import { userApis } from "@/redux/features/user/userApi";
import { store } from "@/redux/sotre";
import { isKybApproved } from "@/utils/kybHelper";
import { isKycApproved } from "@/utils/kycHelper";
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


export const requireKycApproval = async () => {
    const email = sessionStorage.getItem("userEmail");

    if (!email) {
        return redirect("/dashboard");
    }

    const result = await store.dispatch(kycApis.endpoints.getKycDetails.initiate({ email }));

    if (result.isError || !result.data?.data) {
        return redirect("/dashboard");
    }

    const kycApproved = isKycApproved(result.data.data);

    if (!kycApproved) {
        return redirect("/user/verification");
    }

    return null;
};


export const requireKybApproval = async () => {
    const email = sessionStorage.getItem("userEmail");

    if (!email) {
        return redirect("/dashboard");
    }

    const result = await store.dispatch(userApis.endpoints.getUserOnboardingDetails.initiate({ email }));

    if (result.isError || !result.data?.data) {
        return redirect("/user");
    }

    const kybApproved = isKybApproved(result.data.data);

    if (!kybApproved) {
        return redirect("/user");
    }

    return null;
};

export const requireKycAndKybApproval = async () => {
    const kycResult = await requireKycApproval();

    if (kycResult) {
        return kycResult;
    }

    return requireKybApproval();
};