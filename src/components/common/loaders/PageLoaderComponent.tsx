import { createPortal } from "react-dom";
import HashLoaderComponent from "./HashLoaderComponent";
import { useMemo } from "react";

type PageLoaderComponentProps = {
  showPageLoader: boolean;
};

export default function PageLoaderContainer({
  showPageLoader,
}: PageLoaderComponentProps) {
  // Dynamic loader size
  const loaderSize = useMemo(() => {
    if (window.innerWidth < 768) return 60;
    if (window.innerWidth < 1024) return 80;
    return 100;
  }, []);

  // Navy loader color
  const loaderColor = getComputedStyle(document.documentElement)
    .getPropertyValue("--nav-bg")
    .trim();

  return createPortal(
    <div className="fixed inset-0 z-[9999999] flex items-center justify-center overflow-hidden bg-white/40">
      <div className="w-full h-full hashLoaderContainer relative z-10 flex items-center justify-center animate-fade-in">
        <HashLoaderComponent
          visible={showPageLoader}
          size={loaderSize}
          color={loaderColor}
        />
      </div>
    </div>,
    document.body
  );
}