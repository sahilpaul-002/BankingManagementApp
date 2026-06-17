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
    selectTriggerClassName?: string
    selectGroupClassName?: string
    value: string | null
    onChange: (value: string) => void
    error?: string | undefined,
    hint?: string,
}

const CustomSelectComponent = forwardRef<HTMLButtonElement, SelectPropsTypes>((props, ref) => {
    // Destructure props
    const { id, label, labelCategory, labels, selectTriggerClassName, selectGroupClassName, value, hint, error, onChange, ...restAttributes } = props

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
                    className={clsx(`w-full h-full min-w-36 ${error ? "border-destructive ring-3 ring-destructive/20" : ""} cursor-pointer`, selectTriggerClassName)}
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
                    <SelectGroup className={clsx(`w-full min-w-36 max-h-[160px] overflow-scroll`, selectGroupClassName)}>
                        {/* <SelectLabel>{labelCategory}</SelectLabel> */}

                        {labels?.map((item, index) => {
                            if (typeof item === "string") {
                                return (
                                    <SelectItem key={index} value={item} className="w-full [&>span:first-child]:hidden [&>span:last-child]:w-full text-[var(--ink)]">
                                        {item}
                                    </SelectItem>
                                )
                            }

                            return (
                                <SelectItem key={index} value={item.value} className='w-full [&>span:first-child]:hidden [&>span:last-child]:w-full'>
                                    <div className="w-full! border-b border-gray-300 flex justify-between items-center">
                                        <span className='text-left truncate text-[var(--ink)]'>{item.label}</span>
                                        <span className="text-right truncate text-[var(--ink)]">
                                            {item.value}
                                        </span>
                                    </div>
                                </SelectItem>
                            )
                        })}
                    </SelectGroup>
                </SelectContent>

                {/* <SelectContent>
                    <SelectGroup
                        className={clsx(
                            "max-h-[160px] overflow-y-auto bg-red-400",
                            selectGroupClassName
                        )}
                    >
                        {labels?.map((item, index) => {
                            if (typeof item === "string") {
                                return (
                                    <SelectItem
                                        key={index}
                                        value={item}
                                    >
                                        {item}
                                    </SelectItem>
                                )
                            }

                            return (
                                <SelectItem
                                    key={index}
                                    value={item.value}
                                    className="
        w-full
        px-2
        [&>span:first-child]:hidden
        [&>span:last-child]:w-full
        bg-pink-400
    "
                                >
                                    <div className="w-full flex justify-between bg-blue-400">
                                        <span>{item.label}</span>
                                        <span>{item.value}</span>
                                    </div>
                                </SelectItem>
                            )
                        })}
                    </SelectGroup>
                </SelectContent> */}


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

CustomSelectComponent.displayName = "CustomSelectComponent";

export default CustomSelectComponent;