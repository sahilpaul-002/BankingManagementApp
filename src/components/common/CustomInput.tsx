import React from 'react'
import { Field, FieldDescription, FieldLabel } from "@/components/shadcnUI/field"
import { Input } from "@/components/shadcnUI/input"

export default function CustomInput() {
    return (
        <div className="input-container w-full h-full">
            <Field>
                <FieldLabel htmlFor="input-demo-api-key">API Key</FieldLabel>
                <Input id="input-demo-api-key" type="password" placeholder="sk-..." />
                <FieldDescription>
                    Your API key is encrypted and stored securely.
                </FieldDescription>
            </Field>
        </div>
    )
}
