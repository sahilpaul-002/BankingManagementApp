import { createPortal } from "react-dom"
import HashLoaderComponent from "./HashLoaderComponent"
import { useMemo } from "react"

type DashboardPageLoaderComponentProps = {
    showPageLoader: boolean
}

export default function DashboardPageLoaderComponent(props: DashboardPageLoaderComponentProps) {
    // Destructure props
    const { showPageLoader } = props

    // Dynamic loader size
    const loaderSize = useMemo(() => {
        if (window.innerWidth < 768) return 60;
        if (window.innerWidth < 1024) return 80;
        return 100;
    }, []);

    // Loader color
    const loaderColor = getComputedStyle(document.documentElement)
        .getPropertyValue("--gold")
        .trim();

    return (
        createPortal(
            <div className="fixed inset-0 z-[9999999] bg-[var(--nav-bg)] flex items-center justify-center overflow-hidden">
                {/* Gradient overlays - matching BrandingComponent */}
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        backgroundImage: "radial-gradient(circle at 18% 22%, rgba(212,154,77,0.12), transparent 42%), radial-gradient(circle at 88% 78%, rgba(80,130,210,0.10), transparent 55%)"
                    }}
                />

                {/* Grid pattern background */}
                {/* <div
        className="absolute inset-0 pointer-events-none opacity-30"
        style={{
          backgroundImage: `
            repeating-linear-gradient(
              0deg,
              rgba(228,236,247,0.08) 0px,
              rgba(228,236,247,0.08) 1px,
              transparent 1px,
              transparent 32px
            ),
            repeating-linear-gradient(
              90deg,
              rgba(228,236,247,0.08) 0px,
              rgba(228,236,247,0.08) 1px,
              transparent 1px,
              transparent 32px
            )
          `
        }}
      /> */}

                <div className="w-full h-full hashLoaderContainer relative z-10 animate-fade-in">
                    <HashLoaderComponent visible={showPageLoader} size={loaderSize} color={loaderColor} />
                </div>
            </div>, document.body)
    )
}
