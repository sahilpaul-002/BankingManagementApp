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
import UserInfoLayout from "@/layouts/UserInfoLayout";
import UserDetailsPage from "@/pages/UserDetailsPage";
import UserVerificationPage from "@/pages/UserVerificationPage";
import WalletsLayout from "@/layouts/WalletsLayout";
import PayablesLayout from "@/layouts/PayablesLayout";
import CardsLayout from "@/layouts/CardsLayout";
import DepositWalletsPage from "@/pages/DepositWalletsPage";
import CurrencyConversionPage from "@/pages/CurrencyConversionPage";
import WalletsStatementsPage from "@/pages/WalletsStatementsPage";
import BeneficiariesPage from "@/pages/BeneficiariesPage";
import PayoutPage from "@/pages/PayoutPage";
import CardholdersPage from "@/pages/CardholdersPage";
import ManageCardsPage from "@/pages/ManageCardsPage";
import CardDetailsPage from "@/pages/CardDetailsPage";

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
                    {
                        path: "wallets",
                        Component: WalletsLayout,
                        // loader: requireKycApproval,
                        children: [
                            {
                                path: "deposit",
                                Component: DepositWalletsPage,
                            },
                            {
                                path: "currencyConversion",
                                Component: CurrencyConversionPage,
                            },
                            {
                                path: "statements",
                                Component: WalletsStatementsPage,
                            },
                        ]
                    },
                    {
                        path: "payables",
                        Component: PayablesLayout,
                        // loader: requireKycApproval,
                        children: [
                            {
                                path: "beneficiaries",
                                Component: BeneficiariesPage,
                            },
                            {
                                path: "payout/:id?",
                                Component: PayoutPage,
                            }
                        ]
                    },
                    {
                        path: "cards",
                        Component: CardsLayout,
                        // loader: requireKycApproval,
                        children: [
                            {
                                path: "cardholders",
                                Component: CardholdersPage,
                            },
                            {
                              path: "manageCards",
                              Component: ManageCardsPage,
                            },
                            {
                                path: "manageCards/:id",
                                Component: CardDetailsPage,
                            },
                        ]
                    },
                    {
                        path: "user",
                        Component: UserInfoLayout,
                        children: [
                            {
                                index: true,
                                Component: UserDetailsPage,
                            },
                            {
                                path: "verification",
                                Component: UserVerificationPage,
                                //   loader: requireKycApproval,
                            }
                        ]
                    }
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