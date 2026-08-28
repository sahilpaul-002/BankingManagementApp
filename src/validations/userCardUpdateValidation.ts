import { z } from "zod";
import { Decimal } from "decimal.js";

const limitValidation = z
    .string({
        error: "Limit must be provided as a string",
    })
    .trim()
    .refine(
        (value) => {
            try {
                const decimal = new Decimal(value);

                return decimal.isFinite();
            } catch {
                return false;
            }
        },
        {
            message: "Limit must be a valid number",
        }
    )
    .refine(
        (value) => {
            const decimal = new Decimal(value);
            return decimal.greaterThanOrEqualTo(10);
        },
        {
            message: "Minimum limit must be 10",
        }
    )
    .refine(
        (value) => {
            const decimal = new Decimal(value);
            return decimal.decimalPlaces() <= 4;
        },
        {
            message: "Limit cannot have more than 4 decimal places",
        }
    );

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

        // Either all three or none
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

            const daily = new Decimal(value.daily_limit!);
            const monthly = new Decimal(value.monthly_limit!);
            const yearly = new Decimal(value.yearly_limit!);

            if (daily.greaterThanOrEqualTo(monthly)) {
                issues.push({
                    code: "custom",
                    path: ["daily_limit"],
                    message:
                        "Daily limit must be less than monthly limit",
                    input: value.daily_limit,
                });
            }

            if (monthly.greaterThanOrEqualTo(yearly)) {
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