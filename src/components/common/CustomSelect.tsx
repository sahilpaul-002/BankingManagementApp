import React, { forwardRef } from 'react'
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
    value: string
    onChange: (value: string) => void
}

const CustomSelect = forwardRef<HTMLButtonElement, SelectPropsTypes>((props, ref) => {
    // Destructure props
    const { id, label, labelCategory, labels, className, value, onChange, ...restAttributes } = props

    // Get the selected item
    const selectedItem = labels?.find((item) =>
        typeof item === "string"
            ? item === value
            : item.value === value
    )

    return (
        <div className="customSelect-container w-full h-full">
            <Select value={value} onValueChange={onChange}>
                <SelectTrigger
                    id={id}
                    ref={ref}
                    className={clsx("w-full min-w-48 px-2!", className)}
                    {...restAttributes}
                >
                    {/* <SelectValue placeholder={label} /> */}
                    <SelectValue placeholder={label}>
                        {selectedItem &&
                            (typeof selectedItem === "string"
                                ? selectedItem
                                : selectedItem.label)}
                    </SelectValue>
                </SelectTrigger>
                <SelectContent>
                    <SelectGroup className='p-2!'>
                        {/* <SelectLabel>{labelCategory}</SelectLabel> */}
                        {/* {labels && (labels.map((item, index) => (
                            <SelectItem key={index} value={item}>
                                {item}
                            </SelectItem>
                        )))} */}
                        {labels?.map((item, index) => {
                            if (typeof item === "string") {
                                return (
                                    <SelectItem key={index} value={item}>
                                        {item}
                                    </SelectItem>
                                )
                            }

                            return (
                                <SelectItem key={index} value={item.value}>
                                    <div className="w-full flex justify-center items-center gap-4">
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
            </Select>
        </div>
    )
})

CustomSelect.displayName = "CustomSelect";

export default CustomSelect;