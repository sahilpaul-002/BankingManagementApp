import { z } from "zod";

const limitValidation = z
    .number({
        error: "Limit must be numeric",
    })
    .min(10, "Minimum limit must be 10");

const cardLimitsSchema = z
    .object({
        daily_limit: limitValidation.optional(),
        monthly_limit: limitValidation.optional(),
        yearly_limit: limitValidation.optional(),
    })
    .check(({ value, issues }) => {

        const hasDaily = value.daily_limit !== undefined;
        const hasMonthly = value.monthly_limit !== undefined;
        const hasYearly = value.yearly_limit !== undefined;

        // If card_limits is provided, all three limits must be provided
        if (hasDaily || hasMonthly || hasYearly) {

            if (!hasDaily || !hasMonthly || !hasYearly) {
                issues.push({
                    code: "custom",
                    path: [],
                    message:
                        "Daily, monthly and yearly limits must all be provided together.",
                    input: value,
                });

                return;
            }

            // Daily < Monthly
            if (value.daily_limit! >= value.monthly_limit!) {
                issues.push({
                    code: "custom",
                    path: ["daily_limit"],
                    message:
                        "Daily limit must be less than monthly limit",
                    input: value.daily_limit,
                });
            }

            // Monthly < Yearly
            if (value.monthly_limit! >= value.yearly_limit!) {
                issues.push({
                    code: "custom",
                    path: ["monthly_limit"],
                    message:
                        "Monthly limit must be less than yearly limit",
                    input: value.monthly_limit,
                });
            }
        }
    });

const userCardUpdateValidationSchema = z
    .object({
        card_status: z
            .enum(
                ["ACTIVE", "INACTIVE", "FROZEN", "BLOCKED"],
                {
                    error:
                        "Invalid card status - allowed status ['ACTIVE', 'INACTIVE', 'FROZEN', 'BLOCKED']",
                }
            )
            .optional(),

        card_limits: cardLimitsSchema.optional(),
    })
    .check(({ value, issues }) => {

        if (
            value.card_status === undefined &&
            value.card_limits === undefined
        ) {
            issues.push({
                code: "custom",
                path: [],
                message:
                    "At least one field (card_status or card_limits) must be provided",
                input: value,
            });
        }
    });

export default userCardUpdateValidationSchema;