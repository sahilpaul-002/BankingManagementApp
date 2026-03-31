import clsx from 'clsx';
import React, { type CSSProperties } from 'react'
import { PropagateLoader } from "react-spinners"

interface PropagateLoaderPropsType {
    size?: number | string;
    color?: string;
    loading?: boolean;
    cssOverride?: CSSProperties;
    speedMultiplier?: number;
    wrapperClassName?: string;
}

export default function PropagateLoaderComponent(props: PropagateLoaderPropsType) {
    const { size, color, loading, cssOverride, speedMultiplier, wrapperClassName } = props;

    return (
        <div className={clsx("propogateLoader-container w-full h-full pt-[10px]!", wrapperClassName)}>
            <PropagateLoader
                size={size ?? 15}
                color={color ?? "#000000"}
                loading={loading ?? true}
                cssOverride={cssOverride ?? {}}
                speedMultiplier={speedMultiplier ?? 1}
            />
        </div>
    )
}