import React, { Activity, forwardRef, useEffect, useState, type ChangeEvent, type InputHTMLAttributes } from 'react'
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { EyeOff, Eye } from "lucide-react";
import validatePassword, { type ValidatePasswordType } from '@/utils/validatePassword';
import checkPasswordStrength, { type PasswordStrengthType } from "../../utils/checkPasswordStrength"
import PasswordValidationRules from '../PasswordValidationRules';

interface InputPropsTypes extends InputHTMLAttributes<HTMLInputElement> {
    id: string,
    label: string,
    type: "password" | "text",
    placeholder: string,
    error?: string | undefined,
    hint?: string,
    fieldLabelClassname?: string,
    inputClassname?: string,
    fieldDescriptionRequired?: boolean,
    fieldDescriptionText?: string,
    fieldDescriptionClassname?: string,
    showPassword: boolean,
    setShowPassword: React.Dispatch<React.SetStateAction<boolean>>
    password?: string
}

const CustomPasswordInput = forwardRef<HTMLInputElement, InputPropsTypes>((props, ref) => {
    // Destructure Props
    const { id, label, type, placeholder, error, hint, fieldLabelClassname, inputClassname, fieldDescriptionRequired, fieldDescriptionText, fieldDescriptionClassname, showPassword, setShowPassword, password, ...restAttributes } = props

    const { onChange, onBlur, ...rest } = restAttributes;

    const [passwordFocused, setPasswordFocused] = useState<boolean>(false);
    const [passwordValidationRules, setPasswordValidationRules] = useState<ValidatePasswordType>(validatePassword(""))
    const [passwordStrength, setPasswordStrength] = useState<PasswordStrengthType | null>(null)

    const handlePasswordChange = (e: ChangeEvent<HTMLInputElement>) => {
        setPasswordValidationRules(validatePassword(e.target.value));

        // Call RHF onChange
        if (onChange) {
            onChange(e);
        }
    };

    useEffect(() => {
        const passwordStrength = checkPasswordStrength(passwordValidationRules);
        setPasswordStrength(passwordStrength);
    }, [passwordValidationRules]);

    useEffect(() => {
        if (!password) return;
        const hasPasswordError = passwordValidationRules?.some(rule => rule.valid === false);

        if (!hasPasswordError) {
            setPasswordFocused(false);
        }
    }, [password, passwordValidationRules]);

    return (
        <div className="input-container w-full h-fit">
            <Field>
                <div className="customPasswordInput-label-container w-full! h-full flex justify-between items-center gap-10">
                    <FieldLabel htmlFor={`${id}`} className={fieldLabelClassname}>{label ?? "Field Label"}</FieldLabel>
                    {(password && passwordStrength && passwordStrength?.label) && (
                        <div className="customPasswordInput-label-passwordStrength w-fit h-fit">
                            <span className="forgetPassword-newPassowrdInput-passwordStrength w-fit h-fit text-start text-sm font-medium tracking-tight flex justify-center items-center gap-2">
                                <span className="text-gray-700">{`Strength: `}</span>
                                <span className={`${passwordStrength?.color}`}>{passwordStrength?.label}</span>
                            </span>
                        </div>
                    )}
                </div>
                <div className="customPasswordInput-input-container relative">
                    <Input ref={ref} id={id} type={type} placeholder={placeholder ?? "Input Placeholder"} className={inputClassname} aria-invalid={error ? true : false} onChange={handlePasswordChange} onFocus={() => setPasswordFocused(true)} onBlur={() => setPasswordFocused(false)} {...rest} />
                    {passwordFocused && (
                        <div className="forgetPassword-newPassowrdInput-validationRules w-full h-fit bg-white px-2 py-1 border border-gray-300 shadow-lg tracking-tight rounded-lg absolute top-16 sm:top-10 left-0 z-99">
                            <PasswordValidationRules passwordValidationRules={passwordValidationRules} />
                        </div>
                    )}
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="w-fit! h-fit! absolute top-2 right-7 text-gray-500 hover:text-gray-700 cursor-pointer"
                        tabIndex={-1}
                    >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                </div>
                <Activity mode={fieldDescriptionRequired ? "visible" : "hidden"} >
                    <FieldDescription className={fieldDescriptionClassname}>
                        {fieldDescriptionText ?? "Field description text"}
                    </FieldDescription>
                </Activity>
                <Activity mode={error ? "visible" : "hidden"}>
                    <p className="input-error">{error}</p>
                </Activity>
                <Activity mode={(hint && !error) ? "visible" : "hidden"}>
                    <p className="input-hint">{hint}</p>
                </Activity>
            </Field>
        </div>
    )
})

CustomPasswordInput.displayName = "CustomPasswordInput"

export default CustomPasswordInput