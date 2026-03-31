import clsx from 'clsx'
import React, { Activity, forwardRef, type ButtonHTMLAttributes } from 'react'
import BeatLoaderComponent from './loaders/BeatLoaderComponent'

interface ButtonPropsTypes extends ButtonHTMLAttributes<HTMLButtonElement> {
    id: string,
    label: string,
    className?: string
    showButtonLoader?: boolean
}

const CustomButton = forwardRef<HTMLButtonElement, ButtonPropsTypes>((props, ref) => {
    // Destructure props
    const { id, label, className, showButtonLoader, ...restAttributes } = props

    return (
        <div className='customButtom-container w-full h-full flex justify-center itmes-center'>
            <button
                id={id}
                ref={ref}
                className={clsx(
                    "customButton-container w-full h-full bg-[var(--color-100)] text-[var(--color-text6)] border hover:border-gray-600 rounded-xl hover:bg-[var(--color-100)]/80 hover:shadow-2xl text-[12px] sm:text-[14ps] lg:text-[16px] font-semibold tracking-tight cursor-pointer",
                    className
                )}
                {...restAttributes}
            >
                {showButtonLoader ? (
                    <BeatLoaderComponent color='white' />
                ) : (
                    label
                )}
            </button>
        </div>
    )
})

CustomButton.displayName = "CustomButton"
export default CustomButton
