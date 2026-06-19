import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
  FieldLegend,
  FieldTitle,
} from "@/components/ui/field"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import clsx from "clsx"
import { Activity, forwardRef, type ComponentPropsWithoutRef } from "react"

interface RadioGroupChoiceCardsType extends ComponentPropsWithoutRef<typeof RadioGroup> {
  id: string,
  label: string,
  error?: string | undefined,
  hint?: string,
  fieldLegendClassname?: string,
  defaultItem?: string,
  feildLabelClassname?: string,
  fieldItems?: { title: string, description?: string, value: string }[]
  fieldDescriptionClassname?: string,
  onValueChange: (value: string) => void
}

// export function RadioGroupChoiceCard() {
const CustonRadioGroupChoiceCardComponent = forwardRef<HTMLDivElement, RadioGroupChoiceCardsType>((props, ref) => {
  // Destructuring props
  const { id, label, error, hint, fieldLegendClassname, defaultItem,  feildLabelClassname, fieldItems, fieldDescriptionClassname, onValueChange, ...restAttributes } = props

  // Get window pathname
  const windowPathname = window.location.pathname
  const authPathnames = ["/", "/signup", "/verifyEmail", "/send2FaCode", "/verify2FaCode", "/sendForgotPasswordCode", "/verifyForgotPasswordCode"]

  return (
    <div className="input-container w-full h-fit">
      <RadioGroup  {...(defaultItem ? { defaultValue: defaultItem } : {})} className="max-w-sm" id={id} ref={ref} onValueChange={onValueChange} {...restAttributes}>
      {/* <RadioGroup  defaultValue="EMAIL-OTP" className="max-w-sm" id={id} ref={ref}> */}
        <FieldLegend variant="label" className={fieldLegendClassname}>{label ?? "Field Label"}</FieldLegend>
        {fieldItems?.map((item) => (
          <FieldLabel
            key={item.value}
            htmlFor={item.value}
            className={clsx(
              "py-2! border-2 border-[var(--navy-bg)] rounded-lg transition has-[button[data-state=checked]]:border-[var(--gold)]",
              feildLabelClassname
            )}
          >
            <Field orientation="horizontal">
              <FieldContent>
                <FieldTitle>
                  {item.title}
                </FieldTitle>

                {item.description && (
                  <FieldDescription
                    className={fieldDescriptionClassname}
                  >
                    {item.description}
                  </FieldDescription>
                )}
              </FieldContent>

              <RadioGroupItem
                value={item.value}
                id={item.value}
              />
            </Field>
          </FieldLabel>
        ))}
      </RadioGroup>

      <div className="error-hint-container w-fit h-fit mt-1!">
        <Activity mode={error ? "visible" : "hidden"}>
          <p className={authPathnames.includes(windowPathname) ? "auth-input-error" : "input-error"}>{error}</p>
        </Activity>
        <Activity mode={(hint && !error) ? "visible" : "hidden"}>
          <p className="input-hint">{hint}</p>
        </Activity>
      </div>
    </div>
  )
})

CustonRadioGroupChoiceCardComponent.displayName = "CustonRadioGroupChoiceCardComponent"

export default CustonRadioGroupChoiceCardComponent
