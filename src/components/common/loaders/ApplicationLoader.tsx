import DotSpinnerLoader from "./DotSpinnerLoader";
import HourGlassLoader from "./HourGlassLoader";
import RingSpinnerLoader from "./RingSpinnerLoader";

export default function ApplicationLoader() {
  return (
    <div className="w-full h-screen bg-[var(--nav-bg)] flex items-center justify-center relative overflow-hidden">
      {/* Gradient overlays - matching BrandingComponent */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle at 18% 22%, rgba(212,154,77,0.12), transparent 42%), radial-gradient(circle at 88% 78%, rgba(80,130,210,0.10), transparent 55%)"
        }}
      />

      {/* Grid pattern background */}
      <div
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
      />

      {/* Centered italic "H" */}
      <div className="applicationLoader-container w-full h-full relative z-10 animate-fade-in">
        {/* <h1
          className="text-[140px] md:text-[180px] font-medium italic text-[var(--gold)] opacity-90"
          style={{ fontFamily: 'var(--display)' }}
        >
          H
        </h1> */}
        {/* <HourGlassLoader primaryColor={'--gold'} secondaryColor={'--gold-2'} height={120} width={120} wrappperClassName={"backdrop-blur-2xl fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-90 z-100"} /> */}
        {/* <DotSpinnerLoader visible={true} size={160} color="var(--gold)" /> */}
        <RingSpinnerLoader visible={true} size={400} color="var(--gold)" />
      </div>
    </div>
  )
}
