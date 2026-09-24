import React from 'react';
import { Check } from 'lucide-react';

interface CurrencyConversionStepperComponentProps {
    currentStep: number; // 1, 2, or 3
}

interface StepItem {
    id: number;
    label: string;
}

const STEPS: StepItem[] = [
    { id: 1, label: 'Conversion details' },
    { id: 2, label: 'Review & Execute' },
    { id: 3, label: 'Confirmation' },
];

export default function CurrencyConversionStepperComponent({
    currentStep,
}: CurrencyConversionStepperComponentProps) {
    return (
        <div className="w-full py-4 flex items-center justify-between">
            <div className="w-full flex items-center justify-between max-w-4xl mx-auto">
                {STEPS.map((step, index) => {
                    const isCompleted = currentStep > step.id;
                    const isActive = currentStep === step.id;

                    return (
                        <React.Fragment key={step.id}>
                            {/* Step Item */}
                            <div className="flex items-center gap-3 shrink-0">
                                <div
                                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-200 ${
                                        isCompleted
                                            ? 'bg-[var(--ok)] text-white'
                                            : isActive
                                            ? 'bg-[var(--ink)] text-white ring-4 ring-[var(--ink)]/10'
                                            : 'bg-[var(--line-strong)] text-[var(--mute)]'
                                    }`}
                                >
                                    {isCompleted ? <Check className="w-4 h-4 stroke-[3]" /> : step.id}
                                </div>
                                <span
                                    className={`text-xs font-medium tracking-wide transition-colors ${
                                        isActive || isCompleted ? 'text-[var(--ink)]' : 'text-[var(--mute)]'
                                    }`}
                                >
                                    {step.label}
                                </span>
                            </div>

                            {/* Line separator */}
                            {index < STEPS.length - 1 && (
                                <div className="flex-1 mx-4 h-[2px] bg-[var(--line)] relative">
                                    <div
                                        className="h-full bg-[var(--ok)] transition-all duration-300"
                                        style={{
                                            width: isCompleted ? '100%' : '0%',
                                        }}
                                    />
                                </div>
                            )}
                        </React.Fragment>
                    );
                })}
            </div>
        </div>
    );
}
