import React, { type CSSProperties } from 'react'
import { RingLoader } from 'react-spinners';

interface RingLoaderProps {
    visible?: boolean;
    size?: number
    color?: string
    wrapperStyle?: CSSProperties
}

export default function RingSpinnerLoaderComponent(props: RingLoaderProps) {
  // Destructure props
    const { visible, size, color, wrapperStyle } = props;

    // const loaderColor = getComputedStyle(document.documentElement).getPropertyValue(color ?? '#000000').trim();
    const loaderColor = color ?? "#000000";

    return (
        <div className="dotLoader-container w-full h-full flex justify-center items-center">
            <RingLoader
                loading={visible ?? true}
                size={size ?? 80}
                cssOverride={wrapperStyle ?? {}}
                color={loaderColor}
            />
        </div>
    )
}
