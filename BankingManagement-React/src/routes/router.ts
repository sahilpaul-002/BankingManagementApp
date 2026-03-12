import { createBrowserRouter } from "react-router"
import App from "../App"
import AuthLayout from "../layouts/AuthLayout"
import { Component } from "react"
import SignInPage from "../components/auth/SignInPage"

const router = createBrowserRouter([
    {
        path: "/",
        Component: App,
        children: [
            {
                Component: AuthLayout,
                children: [
                    {
                        index: true,
                        Component: SignInPage
                    }
                ]
            }
        ]
    }
])

export default router