import React, { Activity, forwardRef, type InputHTMLAttributes } from 'react'
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"

interface PasswordInputPropsTypes extends InputHTMLAttributes<HTMLInputElement> {
    id: string,
    label: string,
    type: string,
    placeholder: string,
    error?: string,
    hint?: string,
    fieldLabelClassname?: string,
    inputClassname?: string,
    fieldDescriptionRequired?: boolean,
    fieldDescriptionText?: string,
    fieldDescriptionClassname?: string
}

const CustomInput = forwardRef<HTMLInputElement, PasswordInputPropsTypes>((props, ref) => {
    // Destructure Props
    const { id, label, type, placeholder, error, hint, fieldLabelClassname, inputClassname, fieldDescriptionRequired, fieldDescriptionText, fieldDescriptionClassname, ...restAttributes } = props

    return (
        <div className="input-container w-full h-fit">
            <Field>
                <FieldLabel htmlFor={`${id}`} className={fieldLabelClassname}>{label ?? "Field Label"}</FieldLabel>
                <Input ref={ref} id={id} type={type} placeholder={placeholder ?? "Input Placeholder"} className={inputClassname} aria-invalid={error ? true : false} {...restAttributes} />
                <Activity mode={fieldDescriptionRequired ? "visible" : "hidden"} >
                    <FieldDescription className={fieldDescriptionClassname}>
                        {fieldDescriptionText ?? "Field description text"}
                    </FieldDescription>
                </Activity>
                <Activity mode={error ? "visible" : "hidden"}>
                    <p className={`${id}-input-error w-fit h-fit text-[13px] text-red-500 mt-1 font-medium`}>{error}</p>
                </Activity>
                <Activity mode={(hint && !error) ? "visible" : "hidden"}>
                    <p className={`${id}-input-hint w-fit h-fit text-[13px] text-yellow-500 mt-1 font-medium`}>{hint}</p>
                </Activity>
            </Field>
        </div>
    )
})

// CustomInput.displayName = "CustomInput"

export default CustomInput