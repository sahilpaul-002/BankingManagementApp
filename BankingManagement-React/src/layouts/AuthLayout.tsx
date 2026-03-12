import { useState, Activity, useEffect } from "react";
import HourGlassLoader from "../components/common/loaders/HourGlassLoader";
import AuthPage from "../pages/AuthPage";


export default function AuthLayout() {
  const dnsConfigData = {};
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
    if (Object.keys(dnsConfigData || {}).length > 0) {
      clearTimeout(timer)
      setDisplayPageLoader(false)
    }

    return () => clearTimeout(timer)
  }, [dnsConfigData])
  // ---------------------------------- XXXXXXXXXXXXXXXXXXXXXXXX ---------------------------------- \\ 


  return (
    <>
      {/* Display Page Loader */}
      <Activity mode={displayPageLoader ? 'visible' : 'hidden'}>
        <div className="hourGlassLoader-wrapper w-full h-full">
          <HourGlassLoader primaryColor={'--color-200'} secondaryColor={'--color-400'} />
        </div>
      </Activity>

      {/* Display Auth Layout */}
      <Activity mode={!displayPageLoader ? 'visible' : 'hidden'}>
        <div className="authLayout-container w-full h-full">
          <AuthPage />
        </div>
      </Activity>
    </>
  )
}
