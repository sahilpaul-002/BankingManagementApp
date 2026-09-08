import React, { Activity, forwardRef, useEffect, type ButtonHTMLAttributes, type InputHTMLAttributes } from 'react'
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Field, FieldLabel } from "@/components/ui/field"
import { format } from "date-fns"
import { ChevronDownIcon } from "lucide-react"
import clsx from 'clsx'

interface DatePickerPropsTypes extends ButtonHTMLAttributes<HTMLButtonElement> {
    id: string
    label: string
    date?: Date
    setDate: (date: Date | undefined) => void
    max?: Date
    fieldLabelClassName?: string
    popoverTriggerButtonClassName?: string
    restrictTo18Years?: boolean
    error?: string | undefined,
    hint?: string,
}

const CustomDatePickerComponent = forwardRef<HTMLButtonElement, DatePickerPropsTypes>((props, ref) => {
    // Destructure props
    const { id, label, date, setDate, fieldLabelClassName, popoverTriggerButtonClassName, max, restrictTo18Years = false, error, hint, ...restAttributes } = props

    const [open, setOpen] = React.useState(false)

    // ---------------------------- Function to handle 18 years limit ---------------------------- \\
    const eighteenYearsAgo = React.useMemo(() => {
        const today = new Date()

        return new Date(
            today.getFullYear() - 18,
            today.getMonth(),
            today.getDate()
        )
    }, [])
    // useEffect(() => {
    //     if (restrictTo18Years && !date) {
    //         setDate(eighteenYearsAgo)
    //     }
    // }, [restrictTo18Years, date, eighteenYearsAgo, setDate])
    // ----------------------------------- XXXXXXXXXXXXXXXXXXXXXXXX ----------------------------------- \\

    return (
        <div className="customDatePicker-container w-full h-full">

            <Field className="mx-auto w-full h-fit min-w-44">
                <FieldLabel htmlFor="date-required" className={fieldLabelClassName}>{label ?? "Field Label"}</FieldLabel>
                <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            // variant="outline"
                            ref={ref}
                            id={id}
                            data-empty={!date}
                            className={clsx(` w-full min-w-[212px] px-2! justify-between text-left font-normal data-[empty=true]:text-muted-foreground ring-[1px] ring-white cursor-pointer ${error ? "border-destructive ring-3 ring-destructive/20" : ""}`, popoverTriggerButtonClassName)}
                            {...restAttributes}
                        >
                            {date ? date.toLocaleDateString() : "Select date"}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent
                        className="w-auto overflow-hidden p-2!"
                        align="end"
                        alignOffset={-8}
                        sideOffset={10}
                    >
                        <Calendar
                            mode="single"
                            selected={date ?? undefined}
                            {...(date
                                ? { defaultMonth: date }
                                : restrictTo18Years
                                    ? { defaultMonth: eighteenYearsAgo }
                                    : {}
                            )}
                            disabled={restrictTo18Years ? { after: eighteenYearsAgo } : max ? { after: max } : undefined
                            }
                            captionLayout="dropdown"
                            onSelect={(date) => {
                                setDate(date)
                                setOpen(false)
                            }}
                        />
                    </PopoverContent>
                </Popover>
                <Activity mode={error ? "visible" : "hidden"}>
                    <p className="input-error">{error}</p>
                </Activity>
                <Activity mode={(hint && !error) ? "visible" : "hidden"}>
                    <p className="input-hint mt-1.5!">{hint}</p>
                </Activity>
            </Field>
        </div >
    )
})

CustomDatePickerComponent.displayName = "CustomDatePickerComponent"
export default CustomDatePickerComponent;