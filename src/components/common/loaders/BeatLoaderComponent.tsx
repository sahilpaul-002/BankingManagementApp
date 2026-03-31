import clsx from 'clsx';
import React, { type CSSProperties } from 'react'
import { BeatLoader, PropagateLoader } from "react-spinners"

interface PropagateLoaderPropsType {
    size?: number | string;
    color?: string;
    loading?: boolean;
    cssOverride?: CSSProperties;
    speedMultiplier?: number;
    wrapperClassName?: string;
}

export default function BeatLoaderComponent(props: PropagateLoaderPropsType) {
    const { size, color, loading, cssOverride, speedMultiplier, wrapperClassName } = props;

    return (
        <div className={clsx("propogateLoader-container w-full h-full bg-transparent flex justify-center items-center", wrapperClassName)}>
            <BeatLoader
                size={size ?? 15}
                color={color ?? "#000000"}
                loading={loading ?? true}
                cssOverride={cssOverride ?? {}}
                speedMultiplier={speedMultiplier ?? 1}
            />
        </div>
    )
}