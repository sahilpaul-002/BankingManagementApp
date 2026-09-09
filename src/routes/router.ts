// export default router
import { createBrowserRouter, redirect } from "react-router";
import App from "../App";
import AuthLayout from "../layouts/AuthLayout";
import SignInComponent from "../components/auth/SignInComponent";
import SignUpComponent from "@/components/auth/SignUpComponent";
import ServiceUnavailable503 from "@/pages/ServiceUnavailable503";
import { requireAuthentication, requireAuthorization } from "./gaurds/requireAuthentication";
import VerifyEmailComponent from "@/components/auth/VerifyEmailComponent";
import SendEmailVerificationCodeComponent from "@/components/auth/SendEmailVerificationCodeComponent";
import Select2FaMethodComponent from "@/components/auth/Select2FaMethodComponent";
import Send2FaCodeComponent from "@/components/auth/Send2FaCodeComponent";
import Verify2FaCodeComponent from "@/components/auth/Verify2FaCodeComponent";
import SendResetPasswordCodeComponent from "@/components/auth/SendResetPasswordCodeComponent";
import VerifyResetPasswordCodeComponent from "@/components/auth/VerifyResetPasswordCodeComponent";
import DashboardLayout from "@/layouts/DashboardLayout";
import DashboardPage from "@/pages/DashboardPage";

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
                        path: "sendEmailVerificationCode",
                        loader: requireAuthentication,
                        Component: SendEmailVerificationCodeComponent,
                    },
                    {
                        path: "verifyEmail",
                        loader: requireAuthentication,
                        Component: VerifyEmailComponent,
                    },
                    {
                        path: "select2FaMethod",
                        loader: requireAuthentication,
                        Component: Select2FaMethodComponent,
                    },
                    {
                        path: "send2FaCode/:twoFatype",
                        loader: requireAuthentication,
                        Component: Send2FaCodeComponent,
                    },
                    {
                        path: "verify2FaCode/:twoFatype",
                        loader: requireAuthentication,
                        Component: Verify2FaCodeComponent,
                    },
                    {
                        path: "sendResetPasswordCode",
                        Component: SendResetPasswordCodeComponent,
                    },
                    {
                        path: "verifyForgotPasswordCode",
                        Component: VerifyResetPasswordCodeComponent,
                    },
                ],
            },
            {
                Component: DashboardLayout,
                // loader: requireAuthorization,
                children: [
                    {
                        path: "dashboard",
                        Component: DashboardPage,
                    },
                ],
            },
            // Catch-all route
            {
                path: "*",
                loader: () => redirect("/"),
            },
        ],
    },
]);

export default router;