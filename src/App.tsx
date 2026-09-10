
import { Outlet, useLocation, useNavigationType } from 'react-router'
import './App.css'
import { ToastContainer, Bounce, Zoom, Slide, Flip } from "react-toastify";
import { selectDestroySessionParams, selectShowDestroySession, selectShowErrorBanner, selectShowInfoBanner, selectMessageBanner, clearBanner } from './redux/slice/utility/utilitySlice';
import DestroySession from './components/common/DestroySessionComponent';
import { useDispatch, useSelector } from 'react-redux';
import Banner from './components/common/BannerComponent';
import { Activity, useCallback, useEffect, useRef, useState } from 'react';
import type { appDispatchType, rootStateType } from './redux/sotre';
import { logoutUser } from './redux/thunks/userThunks';
import DashboardPageLoaderComponent from './components/common/loaders/DashboardPageLoaderComponent';

const AUTH_ROUTES = [
  "/",
  "/signup",
  "/sendEmailVerificationCode",
  "/verifyEmail",
  "/select2FaMethod",
  "/send2FaCode",
  "/verify2FaCode",
  "/sendResetPasswordCode",
  "/verifyForgotPasswordCode",
];

const isAuthRoute = (pathname: string): boolean => {
  return (
    AUTH_ROUTES.includes(pathname) ||
    pathname.startsWith("/send2FaCode/") ||
    pathname.startsWith("/verify2FaCode/")
  );
};

const SESSION_IDLE_TIME = 5 * 60 * 1000;

const SESSION_ACTIVITY_EVENTS = [
  'mousemove',
  'mousedown',
  'keydown',
  'scroll',
  'touchstart',
  'click',
];

function App() {
  // Confugure appDispatch
  const appDispatch = useDispatch<appDispatchType>();
  // Configure useLocation
  const location = useLocation();
  // Configure useNavigationType
  const navigationType = useNavigationType();
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

  // Auth states
  const isAuthenticated = useSelector((state: rootStateType) => state.user.isAuthenticated);
  const isAuthorized = useSelector((state: rootStateType) => state.user.isAuthorized);

  // Logout state
  const isLoggingOut = useSelector((state: rootStateType) => state.appSession.isLoggingOut);


  // Detect browser Back navigation to auth pages from dashboard
  const previousPathRef = useRef(location.pathname);
  useEffect(() => {
    const previousPath = previousPathRef.current;
    const currentPath = location.pathname;
    const wasAuthenticatedRoute = !AUTH_ROUTES.includes(previousPath);
    const currentIsAuthRoute = isAuthRoute(currentPath);

    if (navigationType === 'POP' && wasAuthenticatedRoute && currentIsAuthRoute && (isAuthenticated || isAuthorized)) {
      appDispatch(logoutUser());
    }

    previousPathRef.current = currentPath;
  }, [location.pathname, navigationType, isAuthenticated, isAuthorized, appDispatch]);

  // ---------------------------------- UI Time Out Logic ---------------------------------- \\
  const [showSessionTimeout, setShowSessionTimeout] = useState(false);
  const inactivityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clearInactivityTimer = useCallback(() => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = null;
    }
  }, []);

  const startInactivityTimer = useCallback(() => {
    clearInactivityTimer();

    inactivityTimerRef.current = setTimeout(() => {
      setShowSessionTimeout(true);
    }, SESSION_IDLE_TIME);
  }, [clearInactivityTimer]);

  const handleUserActivity = useCallback(() => {
    if (showSessionTimeout) {
      return;
    }

    startInactivityTimer();
  }, [showSessionTimeout, startInactivityTimer]);

  useEffect(() => {
    if (!isAuthorized) {
      clearInactivityTimer();
      return;
    }

    if (showSessionTimeout) {
      clearInactivityTimer();
      return;
    }

    SESSION_ACTIVITY_EVENTS.forEach((event) => {
      window.addEventListener(
        event,
        handleUserActivity
      );
    });

    startInactivityTimer();

    return () => {
      SESSION_ACTIVITY_EVENTS.forEach((event) => {
        window.removeEventListener(
          event,
          handleUserActivity
        );
      });

      clearInactivityTimer();
    };
  }, [isAuthorized, showSessionTimeout, handleUserActivity, startInactivityTimer, clearInactivityTimer]);

  const handleContinueSession = useCallback(() => {
    setShowSessionTimeout(false);

    startInactivityTimer();
  }, [startInactivityTimer]);
  // -------------------------------- XXXXXXXXXXXXXXXXXXXXXXX -------------------------------- \\

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

      {/* UI Time Out Destroy Session */}
      <Activity mode={(showSessionTimeout && isAuthorized) ? 'visible' : 'hidden'}>
        <DestroySession
          title="Your session is expiring"
          subtitle="Would you like to continue your session?"
          type="SESSION_INACTIVITY"
          onCancel={handleContinueSession}
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

      {/* Logout Overlay */}
      {isLoggingOut && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-[var(--bg-app)]">
          <DashboardPageLoaderComponent showPageLoader={true} />
        </div>
      )}
    </>
  )
}

export default App
