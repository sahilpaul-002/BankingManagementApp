// export default router
import { createBrowserRouter } from "react-router";
import App from "../App";
import AuthLayout from "../layouts/AuthLayout";
import SignInComponent from "../components/auth/SignInComponent";
import SignUpComponent from "@/components/auth/SignUpComponent";
import ServiceUnavailable503 from "@/pages/ServiceUnavailable503";
import { requireAuthentication } from "./gaurds/requireAuthentication";
import VerifyEmailComponent from "@/components/auth/VerifyEmailComponent";

const router = createBrowserRouter([
    {
        path: "/",
        Component: App,
        children: [
            {
                path: "serviceUnavailable",
                Component: ServiceUnavailable503,
            },
            {
                Component: AuthLayout,
                children: [
                    {
                        index: true,
                        Component: SignInComponent,
                    },
                    {
                        path: "signup",
                        Component: SignUpComponent,
                    },
                    {
                        path: "verifyEmail",
                        // loader: requireAuthentication,
                        Component: VerifyEmailComponent,
                    },
                    // {
                    //     path: "send2FaCode",
                    //     loader: requireAuthentication,
                    //     Component: Send2FaCodeComponent,
                    // },
                    // {
                    //     path: "verify2FaCode",
                    //     loader: requireAuthentication,
                    //     Component: Verify2FaCodeComponent,
                    // },
                    // {
                    //     path: "sendForgotPasswordCode",
                    //     Component: ForgotPasswordRequestComponent,
                    // },
                    // {
                    //     path: "verifyForgotPasswordCode",
                    //     Component: VerifyForgotPasswordCodeComponent,
                    // },
                ],
            },
        ],
    },
]);

export default router;