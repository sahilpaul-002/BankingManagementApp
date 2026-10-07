import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP);

const COLUMN_COUNT = 8;

export default function ApplicationLoaderComponent() {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const tl = gsap.timeline({ repeat: -1, repeatDelay: 0.2 });

      // Phase 1: Wipe-In (Entrance: top to bottom, right-to-left stagger)
      tl.fromTo(
        ".applicationLoader-animationBlock",
        {
          height: 0,
          y: 0,
        },
        {
          height: "100%",
          stagger: { amount: -0.4 },
          duration: 0.7,
          ease: "power2.inOut",
        }
      );

      // Phase 2: Wipe-Out (Exit: slide down off-screen, right-to-left stagger)
      tl.to(".applicationLoader-animationBlock", {
        y: "100%",
        stagger: { amount: -0.4 },
        duration: 0.7,
        ease: "power2.inOut",
      });
    },
    { scope: containerRef }
  );

  return (
    <div
      ref={containerRef}
      className="w-full h-screen bg-[#0F172A] flex items-center justify-center relative overflow-hidden"
    >
      {/* Gradient overlays - matching BrandingComponent */}
      <div
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          backgroundImage:
            "radial-gradient(circle at 18% 22%, rgba(212,154,77,0.12), transparent 42%), radial-gradient(circle at 88% 78%, rgba(80,130,210,0.10), transparent 55%)",
        }}
      />

      {/* GSAP Columns Container */}
      <div className="w-full h-full flex fixed inset-0 z-20 pointer-events-none overflow-hidden">
        {Array.from({ length: COLUMN_COUNT }).map((_, index) => (
          <div
            key={index}
            className="applicationLoader-animationBlock flex-1 h-full bg-[var(--nav-bg)] border-r-2 border-[var(--gold)]/60 shadow-2xl"
            style={{ height: 0 }}
          />
        ))}
      </div>
    </div>
  );
}
