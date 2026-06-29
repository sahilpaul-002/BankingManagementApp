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
        }),
});

export default userCardCreationValidationSchema