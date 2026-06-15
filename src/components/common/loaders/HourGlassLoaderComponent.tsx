import clsx from 'clsx';
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
    wrappperClassName?: string;
}

export default function HourGlassLoaderComponent(props: HourGlassLoaderProps) {
    // Destructure props
    const {height, width, visible, ariaLabel, wrapperStyle, wrapperClass, primaryColor, secondaryColor, wrappperClassName} = props;

    const colorPrimary = getComputedStyle(document.documentElement).getPropertyValue(primaryColor ?? '--color-200').trim();
    const colorSecondary = getComputedStyle(document.documentElement).getPropertyValue(secondaryColor ?? '--color-400').trim();
    
    return (
        <div className={clsx("hourGlassLoader-container w-fit h-fit flex justify-center items-center", wrappperClassName)}>/
        {/* <div className="hourGlassLoader-container min-h-[120px] flex justify-center items-center"> */}
            <Hourglass
                visible={visible ?? true}
                height={height ?? 80}
                width={width ?? 80}
                ariaLabel={ariaLabel ?? "hourglass-loading"}
                wrapperStyle={wrapperStyle ?? {}}
                wrapperClass={wrapperClass ?? ""}
                colors={[colorPrimary, colorSecondary]}
            />
        </div>
    )
}
