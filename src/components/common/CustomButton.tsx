import clsx from 'clsx'
import React, { forwardRef, type ButtonHTMLAttributes } from 'react'

interface ButtonPropsTypes extends ButtonHTMLAttributes<HTMLButtonElement> {
    id: string,
    label: string,
    className?: string
}

const CustomButton = forwardRef<HTMLButtonElement, ButtonPropsTypes>((props, ref) => {
    // Destructure props
    const { id, label, className, ...restAttributes } = props
    return (
        <div className='customButtom-container w-full h-full'>
            <button
                id={id}
                ref={ref}
                className={clsx(
                    "customButton-container w-full h-full border border-gray-600 rounded-lg bg-[var(--color-700)] hover:bg-[var(--color-100)] hover:text-[var(--color-text6)] text-[12px] sm:text-[14ps] lg:text-[16px] font-semibold tracking-tight",
                    className
                )}
                {...restAttributes}
            >
                {label}
            </button>
        </div>
    )
})

CustomButton.displayName = "CustomButton"
export default CustomButton
