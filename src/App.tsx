
import { Outlet } from 'react-router'
import './App.css'
import {ToastContainer, Bounce, Zoom, Slide, Flip} from "react-toastify";

function App() {

  return (
    <>
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
        transition={Zoom}
      />
      <div className="application-container bg-[var(--color-800)] w-screen min-h-screen">
        <Outlet />
      </div>
    </>
  )
}

export default App
