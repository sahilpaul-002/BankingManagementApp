// import { createBrowserRouter } from "react-router"
// import App from "../App"
// import AuthLayout from "../layouts/AuthLayout"
// import { Component } from "react"
// import SignInPage from "../components/auth/SignInPage"
// import SignUpPage from "@/components/auth/SignUpPage"

// const router = createBrowserRouter([
//     {
//         path: "/",
//         Component: App,
//         children: [
//             {
//                 Component: AuthLayout,
//                 children: [
//                     {
//                         index: true,
//                         Component: SignInPage
//                     },
//                     {
//                         path: "/signup",
//                         Component: SignUpPage
//                     }
//                 ]
//             }
//         ]
//     }
// ])

// export default router
import { createBrowserRouter } from "react-router";
import App from "../App";
import AuthLayout from "../layouts/AuthLayout";
import SignInPage from "../components/auth/SignInPage";
import SignUpPage from "@/components/auth/SignUpPage";
import ServiceUnavailable503 from "@/components/common/ServiceUnavailable503";

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
                        Component: SignInPage,
                    },
                    {
                        path: "signup",
                        Component: SignUpPage,
                    },
                ],
            },
        ],
    },
]);

export default router;