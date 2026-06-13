import React, { type CSSProperties } from 'react'
import { DotLoader } from 'react-spinners';

interface DotLoaderProps {
    visible?: boolean;
    size?: number
    color?: string
    wrapperStyle?: CSSProperties
    speed?: number
}

export default function DotSpinnerLoader(props: DotLoaderProps) {
    // Destructure props
    const { visible, size, color, wrapperStyle, speed } = props;

    // const loaderColor = getComputedStyle(document.documentElement).getPropertyValue(color ?? '#000000').trim();
    const loaderColor = color ?? "#000000";

    return (
        <div className="dotLoader-container w-full h-full flex justify-center items-center">
            <DotLoader
                loading={visible ?? true}
                size={size ?? 80}
                cssOverride={wrapperStyle ?? {}}
                color={loaderColor}
                speedMultiplier={speed ?? 1}
            />
        </div>
    )
}
