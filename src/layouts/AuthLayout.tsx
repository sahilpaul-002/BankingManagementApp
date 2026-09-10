import { useState, Activity, useEffect } from "react";
import HourGlassLoader from "../components/common/loaders/HourGlassLoaderComponent";
import AuthPage from "../pages/AuthPage";
import { useGetDnsConfigQuery, useLazyGetDnsConfigQuery } from "@/redux/features/config/configApi";
import { useNavigate } from "react-router";
import { useSelector } from "react-redux";
import { selectDnsConfigDetails } from "@/redux/slice/config/configSlice";
import ApplicationLoaderComponent from "@/components/common/loaders/ApplicationLoaderComponent";


export default function AuthLayout() {
  // Configure useNavigate
  const navigate = useNavigate();

  // --------------------------------------- Get/Use DNS Data --------------------------------------- \\
  // Get dns data from redux
  const dnsData = useSelector(selectDnsConfigDetails)

  // Dns Config Data
  const domainName = window.location.hostname;
  const [triggerDnsConfig, { isFetching, isLoading, isSuccess, isError, data }] = useLazyGetDnsConfigQuery();
  useEffect(() => {
    if (!dnsData && !isError) {
      triggerDnsConfig({
        domainName,
      });
    }
  }, [dnsData, isError, triggerDnsConfig, domainName]);

  useEffect(() => {
    if (!isLoading && !isFetching && isSuccess) {
      console.log(data);
    }

    if (!isLoading && !isFetching && isError) {
      navigate("/serviceUnavailable");
    }
  }, [isLoading, isFetching, data, isSuccess, isError, navigate])

  // Update the document title
  useEffect(() => {
    if (data?.data?.dashboard_name) {
      document.title = data?.data?.dashboard_name || "Banking Management"
    }
  }, [data?.data?.dashboard_name])

  // // Update favicon
  // useEffect(() => {
  //   if (!data?.data?.favicon_url) return

  //   let link =
  //     document.querySelector("link[rel*='icon']") as HTMLLinkElement

  //   if (!link) {
  //     link = document.createElement('link')
  //     link.rel = 'icon'
  //     document.head.appendChild(link)
  //   }

  //   link.href = data?.data.favicon_url
  // }, [data?.data?.favicon_url])
  // ---------------------------------------- XXXXXXXXXXXXXXXXXXXXXXXXXX ---------------------------------------- \\

  // -------------------------------------- Logic to display the loader -------------------------------------- \\
  // State to manage display of page loader
  const [displayPageLoader, setDisplayPageLoader] = useState(() => {
    return sessionStorage.getItem("app-loader-shown") !== "true";
  });

  // UseEffect to configre timer for loasder display
  useEffect(() => {
    // Already shown once → skip
    if (!displayPageLoader) return;

    const timer = setTimeout(() => {
      setDisplayPageLoader(false)

      // Mark loader as already displayed
      sessionStorage.setItem("app-loader-shown", "true");
    }, 3000)

    // If dnsDetails arrives early → stop loader immediately
    if (isSuccess && Object.keys(data || {}).length > 0) {
      clearTimeout(timer)
      setDisplayPageLoader(false)

      sessionStorage.setItem("app-loader-shown", "true");
    }

    return () => clearTimeout(timer)
  }, [displayPageLoader, isSuccess, data]);
  // ---------------------------------- XXXXXXXXXXXXXXXXXXXXXXXX ---------------------------------- \\ 


  return (
    <>
      {/* Display Page Loader */}
      <Activity mode={displayPageLoader ? 'visible' : 'hidden'}>
        <div className="applicationPageLoader-wrapper w-full h-screen">
          <ApplicationLoaderComponent />
        </div>
      </Activity>

      {/* Display Auth Layout */}
      <Activity mode={!displayPageLoader ? 'visible' : 'hidden'}>
        <div className="authLayout-container w-full min-h-screen">
          <AuthPage />
        </div>
      </Activity>
    </>
  )
}
