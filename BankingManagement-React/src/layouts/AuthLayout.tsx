import { useState, Activity } from "react";
import HourGlassLoader from "../components/common/loaders/HourGlassLoader";


export default function AuthLayout() {
  // State to manage the display of page loader
  const [displayPageLoader, setDisplayPageLoader] = useState(true);
  return (
    <>
      {/* Display Page Loader */}
      <Activity mode={displayPageLoader ? 'visible' : 'hidden'}>
        <div className="hourGlassLoader-wrapper w-full h-full">
          <HourGlassLoader primaryColor={'--color-700'} secondaryColor={'--color-600'}/>
        </div>
      </Activity>

    {/* Display Auth Layout */}
    <Activity mode={!displayPageLoader ? 'visible' : 'hidden'}>
      <div className="authLayout-container w-full h-full">
      Auth Layout
    </div>
    </Activity>
    </>
  )
}
