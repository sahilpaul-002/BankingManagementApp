
import { Outlet } from 'react-router'
import './App.css'
import { ToastContainer, Bounce, Zoom, Slide, Flip } from "react-toastify";
import { selectDestroySessionParams, selectShowDestroySession, selectShowErrorBanner, selectShowInfoBanner, selectMessageBanner, clearBanner } from './redux/slice/utility/utilitySlice';
import DestroySession from './components/common/DestroySessionComponent';
import { useDispatch, useSelector } from 'react-redux';
import Banner from './components/common/BannerComponent';
import { Activity } from 'react';

function App() {
  // Configure useDispatch
  const dispatch = useDispatch();
  // Get states from redux
  const showDestroySession = useSelector(selectShowDestroySession);
  console.log("Show destroy session: ", showDestroySession)
  const destroySessionParams = useSelector(selectDestroySessionParams);
  const showErrorBanner = useSelector(selectShowErrorBanner);
  const showInfoBanner = useSelector(selectShowInfoBanner);
  const bannerMessage = useSelector(selectMessageBanner);
  const isBannerVisible = showErrorBanner || showInfoBanner;

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

      {/* Banner */}
      <Activity mode={(isBannerVisible && bannerMessage) ? 'visible' : 'hidden'}>
        <Banner
          message={bannerMessage ?? ""}
          variant={showErrorBanner ? "ERROR" : "INFO"}
          visible={true}
          autoDismissMs={4000}
          onDismiss={() => dispatch(clearBanner())}
        />
      </Activity>

      {/* Destroy Session */}
      <Activity mode={(showDestroySession && destroySessionParams) ? 'visible' : 'hidden'}>
        <DestroySession
          title={destroySessionParams?.title ?? ""}
          type={destroySessionParams?.type ?? "DEFAULT"}
        />
      </Activity>

      <div className="application-container bg-[var(--bg-app)] text-[var(--ink)] w-screen min-h-screen">
        <Outlet />
      </div>
    </>
  )
}

export default App
