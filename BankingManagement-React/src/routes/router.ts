import { createBrowserRouter } from "react-router"
import App from "../App"
import AuthLayout from "../layouts/AuthLayout"

const router = createBrowserRouter([
    {
        path: "/",
        Component: App,
        children: [
            {
                index: true,
                Component: AuthLayout,
                // children: [

                // ]
            }
        ]
    }
])

export default router