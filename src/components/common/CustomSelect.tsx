import React, { Activity, forwardRef } from 'react'
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import clsx from 'clsx'

type LabelItem = string | { label: string; value: string }

interface SelectPropsTypes {
    id: string
    label: string,
    labelCategory?: string,
    labels: LabelItem[] | null | undefined
    className?: string
    value: string | null
    onChange: (value: string) => void
    error?: string | undefined,
    hint?: string,
}

const CustomSelect = forwardRef<HTMLButtonElement, SelectPropsTypes>((props, ref) => {
    // Destructure props
    const { id, label, labelCategory, labels, className, value, hint, error, onChange, ...restAttributes } = props

    // Get the selected item
    const selectedItem = labels?.find((item) => {
        // console.log("Item:", item);
        // console.log("Value:", value)
        // const itemValue = typeof item === "string" ? item === value : item.value === value
        const itemValue = typeof item === "string" ? item : item.value;
        // console.log("ItemValue: ", itemValue)
        return itemValue === value;
    })

    return (
        <div className="customSelect-container w-full h-full">
            {/* <Select value={value} onValueChange={onChange}> */}
            <Select value={value ?? ""} onValueChange={onChange}>
                <SelectTrigger
                    id={id}
                    ref={ref}
                    className={clsx(`w-full min-w-48 px-2! ${error ? "border-destructive ring-3 ring-destructive/20" : ""}`, className)}
                    {...restAttributes}
                >
                    <SelectValue placeholder={label}>
                        {selectedItem ?
                            (typeof selectedItem === "string"
                                ? selectedItem
                                : selectedItem.value)
                            : (
                                "Dial code selection is facing issue"
                            )}
                    </SelectValue>
                </SelectTrigger>
                <SelectContent>
                    <SelectGroup className='w-full min-w-48 max-h-[160px] overflow-scroll p-2!'>
                        {/* <SelectLabel>{labelCategory}</SelectLabel> */}

                        {labels?.map((item, index) => {
                            if (typeof item === "string") {
                                return (
                                    <SelectItem key={index} value={item}>
                                        {item}
                                    </SelectItem>
                                )
                            }

                            return (
                                <SelectItem key={index} value={item.value} className='w-full'>
                                    <div className="min-w-48 flex justify-between items-center gap-4">
                                        <span>{item.label}</span>
                                        <span className="text-muted-foreground">
                                            {item.value}
                                        </span>
                                    </div>
                                </SelectItem>
                            )
                        })}
                    </SelectGroup>
                </SelectContent>
                <Activity mode={error ? "visible" : "hidden"}>
                    <p className="input-error mt-1.5!">{error}</p>
                </Activity>
                <Activity mode={(hint && !error) ? "visible" : "hidden"}>
                    <p className="input-hint mt-1.5!">{hint}</p>
                </Activity>
            </Select>
        </div >
    )
})

CustomSelect.displayName = "CustomSelect";

export default CustomSelect;