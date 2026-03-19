import React, { Activity, forwardRef, type ButtonHTMLAttributes, type InputHTMLAttributes } from 'react'
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { format } from "date-fns"
import { ChevronDownIcon } from "lucide-react"
import clsx from 'clsx'

interface DatePickerPropsTypes extends ButtonHTMLAttributes<HTMLButtonElement> {
    id: string
    label: string
    date: Date | null | undefined,
    setDate: React.Dispatch<React.SetStateAction<Date | null | undefined>>
    max?: Date
    className?: string,
    error?: string | undefined,
    hint?: string,
}

const CustomDatePicker = forwardRef<HTMLButtonElement, DatePickerPropsTypes>((props, ref) => {
    // Destructure props
    const { id, label, date, setDate, className, error, hint, ...restAttributes } = props

    return (
        <div className="customDatePicker-container w-full h-full">
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        ref={ref}
                        id={id}
                        type="button"
                        variant="outline"
                        data-empty={!date}
                        className={clsx(`min-w-[212px] px-2! justify-between text-left font-normal data-[empty=true]:text-muted-foreground ${error ? "border-destructive ring-3 ring-destructive/20" : ""}`, className)}
                        {...restAttributes}
                    >
                        {date ? format(date, "PPP") : <span>{label}</span>}
                        <ChevronDownIcon />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto px-2! py-1!" align="start">
                    <Calendar
                        mode="single"
                        selected={date ?? undefined}
                        onSelect={(d) => setDate(d)}
                        disabled={(d) => d > new Date()}
                        captionLayout="dropdown"
                        {...(date && { defaultMonth: date })}
                    />
                </PopoverContent>
                <Activity mode={error ? "visible" : "hidden"}>
                    <p className="input-error mt-1.5!">{error}</p>
                </Activity>
                <Activity mode={(hint && !error) ? "visible" : "hidden"}>
                    <p className="input-hint mt-1.5!">{hint}</p>
                </Activity>
            </Popover>
        </div>
    )
})

CustomDatePicker.displayName = "CustomDatePicker"
export default CustomDatePicker;