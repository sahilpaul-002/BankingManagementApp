import { z } from "zod";

const limitValidation = z
    .string()
    .trim()
    .regex(/^\d+$/, "Value must contain numbers only")
    .refine(
        (value) => Number(value) >= 10,
        {
            message: "Minimum limit must be 10",
        }
    );

const userCardCreationValidationSchema = z.object({
    name_on_card: z
        .string()
        .trim()
        .min(2, "Name on card is required")
        .max(50, "Name on card cannot exceed 50 characters"),

    card_type: z
        .enum(["VIRTUAL", "PHYSICAL"], {
            error: "Invalid card type",
        }),

    card_currency: z
        .enum(["USD", "EUR", "SGD"], {
            error: "Invalid card currency",
        }),

    card_limits: z
        .object({
            daily_limit: limitValidation,

            monthly_limit: limitValidation,

            yearly_limit: limitValidation
        })
        .optional(),
}).check(({ value, issues }) => {
        if (!value.card_limits) {
            return;
        }

        const { daily_limit, monthly_limit, yearly_limit } = value.card_limits;

        if (Number(daily_limit) >= Number(monthly_limit)) {
            issues.push({
                code: "custom",
                path: ["card_limits", "daily_limit"],
                input: daily_limit,
                message: "Daily limit must be less than monthly limit",
            });
        }

        if (Number(monthly_limit) >= Number(yearly_limit)) {
            issues.push({
                code: "custom",
                path: ["card_limits", "monthly_limit"],
                input: monthly_limit,
                message: "Monthly limit must be less than yearly limit",
            });
        }
    });

export default userCardCreationValidationSchema