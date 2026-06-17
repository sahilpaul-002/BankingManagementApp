"use client"
import React, { Activity, forwardRef, type ButtonHTMLAttributes, type InputHTMLAttributes } from 'react'
import { CalendarIcon } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { Field, FieldLabel } from "@/components/ui/field"
import {
    InputGroup,
    InputGroupAddon,
    InputGroupButton,
    InputGroupInput,
} from "@/components/ui/input-group"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import clsx from 'clsx'

interface DatePickerPropsTypes extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    id: string
    label: string
    placeHolder: string
    date: Date | null | undefined,
    setDate: React.Dispatch<React.SetStateAction<Date | null | undefined>>,
    fieldLabelClassName?: string
    inputGroupClassName?: string
    inputGroupInputClassName?: string
    inputGroupButtonClassName?: string
    max?: Date
    className?: string,
    error?: string | undefined,
    hint?: string,
}

function formatDate(date: Date | undefined) {
    if (!date) {
        return ""
    }

    return date.toLocaleDateString("en-US", {
        day: "2-digit",
        month: "long",
        year: "numeric",
    })
}

function isValidDate(date: Date | undefined) {
    if (!date) {
        return false
    }
    return !isNaN(date.getTime())
}

// export function DatePickerInput() {
const CustomDatePickerComponent = React.forwardRef<HTMLButtonElement, DatePickerPropsTypes>((props, ref) => {
    // Destructure props
    const { id, label, placeHolder, fieldLabelClassName, inputGroupClassName, inputGroupInputClassName, inputGroupButtonClassName, error, hint, ...restAttributes } = props

    const [open, setOpen] = React.useState(false)
    const [date, setDate] = React.useState<Date | undefined>(
        new Date("2025-06-01")
    )
    const [month, setMonth] = React.useState<Date>(date ?? new Date("2025-06-01"))
    const [value, setValue] = React.useState(formatDate(date))

    return (
        <div className="customDatePicker-container w-full h-full">
            {/* <Field className="mx-auto w-48"> */}
            <Field className="mx-auto w-full min-w-48">
                <FieldLabel htmlFor="date-required" className={fieldLabelClassName}>{label ?? "Field Label"}</FieldLabel>
                <InputGroup className={clsx('w-full h-fit px-2! py-1! ', inputGroupClassName)}>
                    <InputGroupInput
                        id="date-required"
                        // value={value}
                        placeholder={placeHolder}
                        className={clsx('w-full h-fit', inputGroupInputClassName)}
                        onChange={(e) => {
                            const date = new Date(e.target.value)
                            setValue(e.target.value)
                            if (isValidDate(date)) {
                                setDate(date)
                                setMonth(date)
                            }
                        }}
                        onKeyDown={(e) => {
                            if (e.key === "ArrowDown") {
                                e.preventDefault()
                                setOpen(true)
                            }
                        }}
                    />
                    <InputGroupAddon align="inline-end">
                        <Popover open={open} onOpenChange={setOpen}>
                            <PopoverTrigger asChild>
                                <InputGroupButton
                                    id="date-picker"
                                    variant="ghost"
                                    size="icon-xs"
                                    aria-label="Select date"
                                    className={inputGroupButtonClassName}
                                >
                                    <CalendarIcon />
                                    <span className="sr-only">Select date</span>
                                </InputGroupButton>
                            </PopoverTrigger>
                            <PopoverContent
                                className="w-auto overflow-hidden p-2!"
                                align="end"
                                alignOffset={-8}
                                sideOffset={10}
                            >
                                <Calendar
                                    mode="single"
                                    selected={date}
                                    month={month}
                                    onMonthChange={setMonth}
                                    onSelect={(date) => {
                                        setDate(date)
                                        setValue(formatDate(date))
                                        setOpen(false)
                                    }}
                                />
                            </PopoverContent>
                        </Popover>
                    </InputGroupAddon>
                </InputGroup>
                <Activity mode={error ? "visible" : "hidden"}>
                    <p className="input-error mt-1.5!">{error}</p>
                </Activity>
                <Activity mode={(hint && !error) ? "visible" : "hidden"}>
                    <p className="input-hint mt-1.5!">{hint}</p>
                </Activity>
            </Field>
        </div>
    )
}
)

CustomDatePickerComponent.displayName = "CustomDatePickerComponent"
export default CustomDatePickerComponent;

{/* <CustomDatePicker
    id="signupForm2-input-select-dateOfBirth"
    label="Date of Birth"
    placeHolder={"June 01, 2025"}
    date={field.value}
    setDate={field.onChange}
    fieldLabelClassName={"text-[var(--line-strong)]"}
    inputGroupClassName={"text-[var(--line-strong)]"}
    inputGroupInputClassName={"px-2!"}
    inputGroupButtonClassName={"text-[var(--line-strong)]"}
    max={new Date()}
    hint={"* Date of birth must be above 18 years"}
    error={errors?.dateOfBirth?.message}
/>  */}