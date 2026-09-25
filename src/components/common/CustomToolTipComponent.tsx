import React, { type ReactNode } from 'react'
import { Info } from 'lucide-react'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import clsx from 'clsx'

interface CustomTooltipPropsTypes {
    content?: string | null
    children?: ReactNode
    side?: "top" | "right" | "bottom" | "left"
    align?: "start" | "center" | "end"
    sideOffset?: number
    showIcon?: boolean
    label?: string
    className?: string
    contentClassName?: string
    disabled?: boolean
}

const CustomTooltipComponent = (props: CustomTooltipPropsTypes) => {
    // Destructure Props
    const {
        content,
        children,
        side = "top",
        align = "center",
        sideOffset = 4,
        showIcon = false,
        label = "More information",
        className,
        contentClassName,
        disabled,
    } = props

    // Do not render tooltip when content is not available
    if (!content) {
        return null
    }

    // Create tooltip trigger
    const trigger = showIcon ? (
        <button
            type="button"
            aria-label={label}
            disabled={disabled}
            className={clsx(
                "inline-flex h-4 w-4 items-center justify-center rounded-full outline-none transition-colors cursor-pointer",
                "focus-visible:ring-2 focus-visible:ring-offset-1",
                className
            )}
        >
            <Info
                className="h-3.5 w-3.5 text-[var(--mute-2)]"
                aria-hidden="true"
            />
        </button>
    ) : (
        children
    )

    // Do not render tooltip when no trigger is available
    if (!trigger) {
        return null
    }

    return (
        <TooltipProvider delayDuration={150}>
            <Tooltip>
                <TooltipTrigger
                    asChild
                    disabled={disabled}
                >
                    {trigger}
                </TooltipTrigger>

                <TooltipContent
                    side={side}
                    align={align}
                    sideOffset={sideOffset}
                    className={clsx("px-2!", contentClassName)}
                >
                    {content}
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    )
}

CustomTooltipComponent.displayName = "CustomTooltipComponent"

export default CustomTooltipComponent