// import clsx from 'clsx'
// import React, { Activity, forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
// import BeatLoaderComponent from './loaders/BeatLoaderComponent'
// import { Button } from '../ui/button'

// interface ButtonPropsTypes extends ButtonHTMLAttributes<HTMLButtonElement> {
//     id: string,
//     label: ReactNode,
//     type?: "submit" | "reset" | "button" | undefined
//     className?: string
//     showButtonLoader?: boolean
//     variant?: "link" | "default" | "navy" | "gold" | "authResend" | "authLink" | "outline" | "secondary" | "ghost" | "destructive" | null | undefined
// }

// const CustomButtonComponent = forwardRef<HTMLButtonElement, ButtonPropsTypes>((props, ref) => {
//     // Destructure props
//     const { id, label, type, className, showButtonLoader, variant, ...restAttributes } = props

//     return (
//         <div className='customButtom-container-wrapper w-full h-full flex justify-center itmes-center'>
//             <Button
//                 id={id} 
//                 ref={ref}
//                 variant={variant}
//                 type={type}
//                 size="lg"
//                 className={clsx("customButton-container w-full h-full text-xs sm:text-sm font-semibold tracking-normal cursor-pointer", className)}
//                 disabled={showButtonLoader}
//                 {...restAttributes}
//             >
//                 {showButtonLoader ? (
//                     <BeatLoaderComponent color='white' />
//                 ) : (
//                     label
//                 )}
//             </Button>
//         </div>
//     )
// })

// CustomButtonComponent.displayName = "CustomButtonComponent"
// export default CustomButtonComponent


import clsx from "clsx";
import {
    forwardRef,
    type ButtonHTMLAttributes,
    type ReactNode,
} from "react";

import BeatLoaderComponent from "./loaders/BeatLoaderComponent";
import { Button } from "../ui/button";

interface ButtonPropsTypes extends ButtonHTMLAttributes<HTMLButtonElement> {
    id?: string;
    label?: ReactNode;
    type?: "submit" | "reset" | "button" | undefined
    children?: ReactNode;
    showButtonLoader?: boolean;
    variant?:
        | "link"
        | "default"
        | "navy"
        | "gold"
        | "authResend"
        | "authLink"
        | "outline"
        | "secondary"
        | "ghost"
        | "destructive"
        | null
        | undefined;
    size?: "default" | "sm" | "lg" | "icon";
}

const CustomButtonComponent = forwardRef<
    HTMLButtonElement,
    ButtonPropsTypes
>((props, ref) => {
    const {
        id,
        label,
        children,
        type = "button",
        className,
        showButtonLoader = false,
        variant,
        size = "lg",
        disabled,
        ...restAttributes
    } = props;

    const buttonContent = children ?? label;

    return (
        <div className="customButtom-container-wrapper flex h-full w-full items-center justify-center">
            <Button
                {...restAttributes}
                id={id}
                ref={ref}
                variant={variant}
                type={type}
                size={size}
                disabled={disabled || showButtonLoader}
                className={clsx(
                    "customButton-container w-full h-full text-xs sm:text-sm font-semibold tracking-normal cursor-pointer py-2! px-4!",
                    className
                )}
            >
                {showButtonLoader ? (
                    <BeatLoaderComponent color="white" />
                ) : (
                    buttonContent
                )}
            </Button>
        </div>
    );
});

CustomButtonComponent.displayName = "CustomButtonComponent";

export default CustomButtonComponent;