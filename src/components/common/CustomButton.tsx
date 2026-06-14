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
    variant: "link" | "default" | "navy" | "gold" | "outline" | "secondary" | "ghost" | "destructive" | null | undefined
}

const CustomButton = forwardRef<HTMLButtonElement, ButtonPropsTypes>((props, ref) => {
    // Destructure props
    const { id, label, type, className, showButtonLoader, variant, ...restAttributes } = props

    return (
        <button id={id} ref={ref} className='customButtom-container-wrapper w-full h-full flex justify-center itmes-center'>
            <Button
                variant={variant}
                type={type}
                size="lg"
                className="customButton-container w-full h-full text-[var(--nav-text-strong)] text-sm font-semibold tracking-normal cursor-pointer"
                disabled={showButtonLoader}
                {...restAttributes}
            >
                {showButtonLoader ? (
                    <BeatLoaderComponent color='white' />
                ) : (
                    label
                )}
            </Button>
        </button>
    )
})

CustomButton.displayName = "CustomButton"
export default CustomButton
