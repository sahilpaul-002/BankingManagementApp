import { z } from "zod";
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
    .number({
        error: "Limit must be numeric",
    })
    .int("Limit must be a whole number")
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

        // Either all three or none
        if (hasDaily || hasMonthly || hasYearly) {
            if (!(hasDaily && hasMonthly && hasYearly)) {
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
                    message: "Daily limit must be less than monthly limit",
                    input: value.daily_limit,
                });
            }

            // Monthly < Yearly
            if (value.monthly_limit! >= value.yearly_limit!) {
                issues.push({
                    code: "custom",
                    path: ["monthly_limit"],
                    message: "Monthly limit must be less than yearly limit",
                    input: value.monthly_limit,
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