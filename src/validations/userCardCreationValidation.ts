import { z } from "zod";
import { Decimal } from "decimal.js";
import { MERCHANT_CATEGORIES } from "../configs/configConstants.js";

const merchantCategoriesCheck = z
    .array(z.string())
    .check(({ value, issues }) => {
        value.forEach((category, index) => {
            if (
                !MERCHANT_CATEGORIES.includes(
                    category as typeof MERCHANT_CATEGORIES[number]
                )
            ) {
                issues.push({
                    code: "custom",
                    path: [index],
                    message: `Invalid merchant category: ${category}`,
                    input: category,
                });
            }
        });
    });

const limitValidation = z
    .string({
        error: "Limit must be provided as a string",
    })
    .trim()
    .refine(
        (value) => {
            try {
                const decimal = new Decimal(value);

                return (
                    decimal.isFinite() &&
                    decimal.greaterThanOrEqualTo(10) &&
                    decimal.decimalPlaces() <= 4
                );
            } catch {
                return false;
            }
        },
        {
            message:
                "Limit must be a valid number with maximum 4 decimal places and at least 10",
        }
    );

const cardLimitsSchema = z
    .object({
        daily_limit: limitValidation.optional(),
        monthly_limit: limitValidation.optional(),
        yearly_limit: limitValidation.optional(),
    })
    .superRefine((value, ctx) => {
        const {
            daily_limit,
            monthly_limit,
            yearly_limit,
        } = value;

        const hasDaily = daily_limit !== undefined;
        const hasMonthly = monthly_limit !== undefined;
        const hasYearly = yearly_limit !== undefined;

        // If any limit is provided, all three must be provided
        if (hasDaily || hasMonthly || hasYearly) {
            if (!hasDaily || !hasMonthly || !hasYearly) {
                ctx.addIssue({
                    code: "custom",
                    path: [],
                    message:
                        "Daily, monthly and yearly limits must all be provided together.",
                });

                return;
            }

            const daily = new Decimal(daily_limit);
            const monthly = new Decimal(monthly_limit);
            const yearly = new Decimal(yearly_limit);

            if (daily.greaterThanOrEqualTo(monthly)) {
                ctx.addIssue({
                    code: "custom",
                    path: ["daily_limit"],
                    message:
                        "Daily limit must be less than monthly limit",
                });
            }

            if (monthly.greaterThanOrEqualTo(yearly)) {
                ctx.addIssue({
                    code: "custom",
                    path: ["monthly_limit"],
                    message:
                        "Monthly limit must be less than yearly limit",
                });
            }
        }
    });

const userCardCreationValidationSchema = z.object({
    name_on_card: z
        .string()
        .trim()
        .min(2, "Name on card is required")
        .max(50, "Name on card cannot exceed 50 characters"),

    card_type: z.enum(["VIRTUAL", "PHYSICAL"]),

    card_currency: z.enum(["USD"], {
        error: "Invalid card currency",
    }),

    card_limits: cardLimitsSchema.optional(),

    merchant_categories: merchantCategoriesCheck.optional(),
});

export default userCardCreationValidationSchema;