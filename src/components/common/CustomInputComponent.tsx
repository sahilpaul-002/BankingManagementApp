import React, { Activity, forwardRef, type InputHTMLAttributes } from 'react'
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"

interface PasswordInputPropsTypes extends InputHTMLAttributes<HTMLInputElement> {
    id: string,
    label?: string,
    type: string,
    placeholder: string,
    error?: string | undefined,
    hint?: string,
    fieldLabelClassname?: string,
    inputClassname?: string,
    fieldDescriptionRequired?: boolean,
    fieldDescriptionText?: string,
    fieldDescriptionClassname?: string
}

const CustomInputComponent = forwardRef<HTMLInputElement, PasswordInputPropsTypes>((props, ref) => {
    // Destructure Props
    const { id, label, type, placeholder, error, hint, fieldLabelClassname, inputClassname, fieldDescriptionRequired, fieldDescriptionText, fieldDescriptionClassname, ...restAttributes } = props

    // Get window pathname
    const windowPathname = window.location.pathname
    const authPathnames = ["/", "/signup", "/verifyEmail", "/send2FaCode", "/verify2FaCode", "/sendForgotPasswordCode", "/verifyForgotPasswordCode"]

    return (
        <div className="input-container w-full h-fit">
            <Field>
                <FieldLabel htmlFor={`${id}`} className={fieldLabelClassname}>{label}</FieldLabel>
                <Input ref={ref} id={id} type={type} placeholder={placeholder ?? "Input Placeholder"} className={inputClassname} aria-invalid={error ? true : false} {...restAttributes} />
                <Activity mode={fieldDescriptionRequired ? "visible" : "hidden"} >
                    <FieldDescription className={fieldDescriptionClassname}>
                        {fieldDescriptionText ?? "Field description text"}
                    </FieldDescription>
                </Activity>
                <Activity mode={error ? "visible" : "hidden"}>
                    <p className={authPathnames.includes(windowPathname) ? "auth-input-error" : "input-error"}>{error}</p>
                </Activity>
                <Activity mode={(hint && !error) ? "visible" : "hidden"}>
                    <p className="input-hint">{hint}</p>
                </Activity>
            </Field>
        </div>
    )
})

CustomInputComponent.displayName = "CustomInputComponent"

export default CustomInputComponent