import { Shield, DollarSign } from 'lucide-react';
import type { UseFormRegister, FieldErrors } from 'react-hook-form';
import CustomInputComponent from '@/components/common/CustomInputComponent';

interface CardLimitsFieldsComponentPropsType {
    register: UseFormRegister<any>;
    errors: FieldErrors<any>;
}

export default function CardLimitsFieldsComponent({
    register,
    errors,
}: CardLimitsFieldsComponentPropsType) {
    const cardLimitsErrors = errors.cardLimits as
        | {
              dailyLimit?: { message?: string };
              monthlyLimit?: { message?: string };
              yearlyLimit?: { message?: string };
          }
        | undefined;

    return (
        <div className="w-full flex flex-col gap-3 p-4! rounded-2xl bg-[var(--bg-subtle)] border border-[var(--line)]">
            <div className="flex items-center gap-2 text-[var(--ink)]">
                <Shield className="w-4 h-4 text-[var(--gold)]" />
                <div className="flex flex-col">
                    <span className="text-xs font-semibold uppercase tracking-wide text-[var(--ink-soft)]">
                        Spending Limits <span className="text-[var(--mute)] font-normal lowercase">(optional)</span>
                    </span>
                    <span className="text-[11px] text-[var(--mute)]">
                        If one limit is provided, daily, monthly, and yearly limits must all be specified.
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-3.5 pt-1!">
                {/* Daily Limit */}
                <CustomInputComponent
                    id="createCard-input-dailyLimit"
                    label="Daily Limit ($ USD)"
                    type="text"
                    placeholder="e.g. 1000.00"
                    fieldLabelClassname="text-[var(--ink-soft)] text-xs font-semibold uppercase tracking-wide"
                    inputClassname="px-4! text-[var(--ink)] font-mono"
                    error={cardLimitsErrors?.dailyLimit?.message}
                    {...register('cardLimits.dailyLimit')}
                />

                {/* Monthly Limit */}
                <CustomInputComponent
                    id="createCard-input-monthlyLimit"
                    label="Monthly Limit ($ USD)"
                    type="text"
                    placeholder="e.g. 5000.00"
                    fieldLabelClassname="text-[var(--ink-soft)] text-xs font-semibold uppercase tracking-wide"
                    inputClassname="px-4! text-[var(--ink)] font-mono"
                    error={cardLimitsErrors?.monthlyLimit?.message}
                    {...register('cardLimits.monthlyLimit')}
                />

                {/* Yearly Limit */}
                <CustomInputComponent
                    id="createCard-input-yearlyLimit"
                    label="Yearly Limit ($ USD)"
                    type="text"
                    placeholder="e.g. 50000.00"
                    fieldLabelClassname="text-[var(--ink-soft)] text-xs font-semibold uppercase tracking-wide"
                    inputClassname="px-4! text-[var(--ink)] font-mono"
                    error={cardLimitsErrors?.yearlyLimit?.message}
                    {...register('cardLimits.yearlyLimit')}
                />
            </div>
        </div>
    );
}
