import React from 'react'
import { Check, X } from 'lucide-react';
import type { ValidatePasswordType } from '@/utils/validatePassword';

interface Props {
  passwordValidationRules: ValidatePasswordType
}

export default function PasswordValidationRules(props: Props) {
    // Destructure props
    const { passwordValidationRules } = props

    return (
        <div className='passwordValidationRules w-full h-full p-2!'>
            {passwordValidationRules.map((rule: {valid: boolean, message: string}, index: number) => (
                <div key={index} className="flex items-center gap-2">
                    <span className={`text-start  font-medium ${rule.valid ? "text-green-600" : "text-red-600"}`}>
                        {rule.valid ? <Check size={14} /> : <X size={14} />}
                    </span>
                    <span className="text-gray-800 text-[2.5vw] md:text-[1.5vw] lg:text-[14px]">{rule.message}</span>
                </div>
            ))}
        </div>
    );
}
