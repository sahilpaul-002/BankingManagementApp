import React, { Activity, forwardRef, type InputHTMLAttributes } from 'react'
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { EyeOff, Eye } from "lucide-react";

interface InputPropsTypes extends InputHTMLAttributes<HTMLInputElement> {
    id: string,
    label: string,
    type: "password" | "text",
    placeholder: string,
    error?: string,
    hint?: string,
    fieldLabelClassname?: string,
    inputClassname?: string,
    fieldDescriptionRequired?: boolean,
    fieldDescriptionText?: string,
    fieldDescriptionClassname?: string,
    showPassword: boolean,
    setShowPassword: React.Dispatch<React.SetStateAction<boolean>>
}

const CustomPasswordInput = forwardRef<HTMLInputElement, InputPropsTypes>((props, ref) => {
    // Destructure Props
    const { id, label, type, placeholder, error, hint, fieldLabelClassname, inputClassname, fieldDescriptionRequired, fieldDescriptionText, fieldDescriptionClassname, showPassword, setShowPassword, ...restAttributes } = props

    return (
        <div className="input-container w-full h-fit relative">
            <Field>
                <FieldLabel htmlFor={`${id}`} className={fieldLabelClassname}>{label ?? "Field Label"}</FieldLabel>
                <Input ref={ref} id={id} type={type} placeholder={placeholder ?? "Input Placeholder"} className={inputClassname} aria-invalid={error ? true : false} {...restAttributes} />
                <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="w-fit! h-fit! absolute top-9 right-7 text-gray-500 hover:text-gray-700 cursor-pointer"
                    tabIndex={-1}
                >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
                <Activity mode={fieldDescriptionRequired ? "visible" : "hidden"} >
                    <FieldDescription className={fieldDescriptionClassname}>
                        {fieldDescriptionText ?? "Field description text"}
                    </FieldDescription>
                </Activity>
                <Activity mode={error ? "visible" : "hidden"}>
                    <p className={`${id}-input-erro w-fit h-fitr text-[13px] text-red-500 mt-1 font-medium`}>{error}</p>
                </Activity>
                <Activity mode={(hint && !error) ? "visible" : "hidden"}>
                    <p className={`${id}-input-hint w-fit h-fit text-[13px] text-yellow-500 mt-1 font-medium`}>{hint}</p>
                </Activity>
            </Field>
        </div>
    )
})

// CustomPasswordInput.displayName = "CustomPasswordInput"

export default CustomPasswordInput