import React, { type CSSProperties } from 'react'
import { HashLoader  } from 'react-spinners';

interface HashLoaderProps {
    visible?: boolean;
    size?: number
    color?: string
    wrapperStyle?: CSSProperties
}

export default function HashLoaderComponent(props: HashLoaderProps) {
  // Destructure props
    const { visible, size, color, wrapperStyle } = props;

    // const loaderColor = getComputedStyle(document.documentElement).getPropertyValue(color ?? '#000000').trim();
    const loaderColor = color ?? "#000000";

    return (
        <div className="hashLoader-container w-full h-full flex justify-center items-center">
            <HashLoader 
                loading={visible ?? true}
                size={size ?? 30}
                cssOverride={wrapperStyle ?? {}}
                color={loaderColor}
                speedMultiplier={1}
            />
        </div>
    )
}
