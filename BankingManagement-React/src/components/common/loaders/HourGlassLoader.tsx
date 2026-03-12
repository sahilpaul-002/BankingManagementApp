import React, { type CSSProperties } from 'react'
import { Hourglass } from 'react-loader-spinner'

interface HourGlassLoaderProps {
    height?: string | number;
    width?: string | number;
    visible?: boolean;
    ariaLabel?: string;
    wrapperStyle?: CSSProperties
    wrapperClass?: string
    primaryColor?: string;
    secondaryColor?: string;
}

export default function HourGlassLoader(props: HourGlassLoaderProps) {
    // Destructure props
    const {height, width, visible, ariaLabel, wrapperStyle, wrapperClass, primaryColor, secondaryColor} = props;

    const colorPrimary = getComputedStyle(document.documentElement).getPropertyValue(primaryColor ?? '--color-200').trim();
    const colorSecondary = getComputedStyle(document.documentElement).getPropertyValue(secondaryColor ?? '--color-400').trim();
    
    return (
        // <div className="hourGlassLoader-container w-fit h-fit">
        <div className="hourGlassLoader-container w-full h-full bg-white/15 backdrop-blur-2xl flex justify-center items-center fixed top-0 left-0 z-100">
            <Hourglass
                visible={visible ?? true}
                height={height ?? 80}
                width={width ?? 80}
                ariaLabel={ariaLabel ?? "hourglass-loading"}
                wrapperStyle={wrapperStyle ?? {}}
                wrapperClass={wrapperClass ?? ""}
                // colors={['#306cce', '#72a1ea']}
                colors={[colorPrimary, colorSecondary]}
            />
        </div>
    )
}
