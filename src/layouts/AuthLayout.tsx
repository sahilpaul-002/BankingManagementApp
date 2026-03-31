import { useState, Activity, useEffect } from "react";
import HourGlassLoader from "../components/common/loaders/HourGlassLoader";
import AuthPage from "../pages/AuthPage";
import { useGetDnsConfigQuery } from "@/redux/features/config/configApi";
import { useNavigate } from "react-router";


export default function AuthLayout() {
  // Configure useNavigate
  const navigate = useNavigate();

  // Dns Config Data
  const { data, isLoading, isSuccess, error, isError } = useGetDnsConfigQuery({
      domainName: 'business.banking-management.com',
  })
  useEffect(() => {
      if (isSuccess) {
          console.log(data);
      }
      else if (isError) {
          console.error(error);
          navigate("/serviceUnavailable");

      }
  }, [data, error])
  // -------------------------------------- Logic to display the loader -------------------------------------- \\
  // State to manage the display of page loader
  const [displayPageLoader, setDisplayPageLoader] = useState(true);

  // UseEffect to configre timer for loasder display
  useEffect(() => {
    // Start 3s timeout
    const timer = setTimeout(() => {
      setDisplayPageLoader(false)
    }, 3000)

    // If dnsDetails arrives early → stop loader immediately
    if (isSuccess && Object.keys(data || {}).length > 0) {
      clearTimeout(timer)
      setDisplayPageLoader(false)
    }

    return () => clearTimeout(timer)
  }, [data])
  // ---------------------------------- XXXXXXXXXXXXXXXXXXXXXXXX ---------------------------------- \\ 


  return (
    <>
      {/* Display Page Loader */}
      <Activity mode={displayPageLoader ? 'visible' : 'hidden'}>
        <div className="hourGlassLoader-wrapper w-full h-screen">
          <HourGlassLoader primaryColor={'--color-200'} secondaryColor={'--color-400'} wrappperClassName={"bg-white/15 backdrop-blur-2xl fixed top-0 left-0 z-100"}/>
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
