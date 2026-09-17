import { ClipboardPlus } from 'lucide-react';
import CustomButtonComponent from '@/components/common/CustomButtonComponent';

interface OnboardingDetailsEmptyStatePropsType {
    onAddOnboarding: () => void;
}

export default function OnboardingDetailsEmptyState({
    onAddOnboarding,
}: OnboardingDetailsEmptyStatePropsType) {
    return (
        <div className="w-full min-h-[420px] flex items-center justify-center">
            <div className="w-full max-w-md flex flex-col items-center justify-center text-center px-6! py-10!">
                <div className="w-14 h-14 flex items-center justify-center rounded-full bg-[var(--bg-subtle)] border border-[var(--line)] mb-4!">
                    <ClipboardPlus className="w-6 h-6 text-[var(--mute)]" />
                </div>

                <h3 className="text-base font-semibold text-[var(--ink)]">
                    Onboarding details not added
                </h3>

                <p className="mt-2! max-w-sm text-xs leading-5 text-[var(--mute)]">
                    Your address and banking information have not been added yet.
                    Add your onboarding details to complete your account setup.
                </p>

                <div className="w-fit h-fit mt-5!">
                    <CustomButtonComponent
                        id="userDetailsPage-add-onboarding-btn"
                        label="Add Onboarding Details"
                        type="button"
                        variant="navy"
                        onClick={onAddOnboarding}
                    />
                </div>
            </div>
        </div>
    );
}