import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import ReactDOM from "react-dom/client";
import { RouterProvider } from 'react-router-dom'
import router from './routes/router.ts';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

const root: HTMLElement | null = document.getElementById("root");

if (!root) {
  throw new Error("Root element not found");
}

ReactDOM.createRoot(root).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
)