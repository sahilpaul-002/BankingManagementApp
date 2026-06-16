import React, { Activity, forwardRef } from 'react'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '../ui/input-otp';
import { Field, FieldLabel } from '../ui/field';
import { cn } from '@/lib/utils';

interface OtpInputPropsTypes {
    id: string,
    label: string,
    otpValue: string;
    onChange: (value: string) => void;
    onPaste?: (
        e: React.ClipboardEvent<HTMLInputElement>
    ) => void
    error?: string | undefined,
    hint?: string,
    otpLength?: number;
    disabled?: boolean;
    fieldLabelClassname?: string;
    otpInputClassName?: string;
    otpInputGroupClass?: string;
}

const CustomOtpInput = forwardRef<React.ElementRef<typeof InputOTP>, OtpInputPropsTypes>((props, ref) => {
    // Destructuring props
    const { id, label, otpValue, onChange, onPaste, error, hint, otpLength, disabled, fieldLabelClassname, otpInputClassName, otpInputGroupClass, ...restAttributes } = props
    const length = otpLength ?? 6

    // Get window pathname
    const windowPathname = window.location.pathname
    const authPathnames = ["/", "/signup", "/verifyEmail", "/send2FaCode", "/verify2FaCode", "/sendForgotPasswordCode", "/verifyForgotPasswordCode"]

    return (
        <div className="otpInput-container w-full h-fit">
            <Field>
                <FieldLabel htmlFor={`${id}`} className={fieldLabelClassname}>{label ?? "Field Label"}</FieldLabel>
                <InputOTP
                    ref={ref}
                    id={id}
                    maxLength={length ?? 6}
                    value={otpValue}
                    onChange={onChange}
                    onPaste={onPaste}
                    disabled={disabled}
                    className={cn("", otpInputClassName)}
                    {...restAttributes}
                >
                    <div className="otpInputGroup-error-hint-container flex flex-col justify-center items-start gap-2">
                        <InputOTPGroup>
                            {Array.from({ length }).map((_, index) => (
                                <InputOTPSlot
                                    key={index}
                                    index={index}
                                    className={cn("size-12 text-base ring-[var(--gold)]", otpInputGroupClass)}
                                />
                            ))}
                        </InputOTPGroup>
                        <Activity mode={error ? "visible" : "hidden"}>
                            <p className={authPathnames.includes(windowPathname) ? "auth-input-error" : "input-error"}>{error}</p>
                        </Activity>
                        <Activity mode={(hint && !error) ? "visible" : "hidden"}>
                            <p className="input-hint">{hint}</p>
                        </Activity>
                    </div>
                </InputOTP>
            </Field>
        </div>
    )
})

CustomOtpInput.displayName = "CustomOtpInput"

export default CustomOtpInput