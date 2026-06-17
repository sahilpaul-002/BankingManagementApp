import clsx from 'clsx'
import React, { Activity, forwardRef, type ButtonHTMLAttributes } from 'react'
import BeatLoaderComponent from './loaders/BeatLoaderComponent'
import { Button } from '../ui/button'

interface ButtonPropsTypes extends ButtonHTMLAttributes<HTMLButtonElement> {
    id: string,
    label: string,
    type?: "submit" | "reset" | "button" | undefined
    className?: string
    showButtonLoader?: boolean
    variant?: "link" | "default" | "navy" | "gold" | "authResend" | "authLink" | "outline" | "secondary" | "ghost" | "destructive" | null | undefined
}

const CustomButtonComponent = forwardRef<HTMLButtonElement, ButtonPropsTypes>((props, ref) => {
    // Destructure props
    const { id, label, type, className, showButtonLoader, variant, ...restAttributes } = props

    return (
        <div className='customButtom-container-wrapper w-full h-full flex justify-center itmes-center'>
            <Button
                id={id} 
                ref={ref}
                variant={variant}
                type={type}
                size="lg"
                className="customButton-container w-full h-full text-sm font-semibold tracking-normal cursor-pointer"
                disabled={showButtonLoader}
                {...restAttributes}
            >
                {showButtonLoader ? (
                    <BeatLoaderComponent color='white' />
                ) : (
                    label
                )}
            </Button>
        </div>
    )
})

CustomButtonComponent.displayName = "CustomButtonComponent"
export default CustomButtonComponent
