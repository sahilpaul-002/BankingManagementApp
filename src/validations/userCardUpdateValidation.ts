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

const userCardUpdateValidationSchema = z
    .object({
        card_status: z
            .enum(["ACTIVE", "INACTIVE", "FROZEN", "BLOCKED"], {
                error: "Invalid card status - allowed status ['ACTIVE', 'INACTIVE', 'FROZEN', 'BLOCKED']",
            })
            .optional(),

        card_limits: z
            .object({
                daily_limit: limitValidation.optional(),

                monthly_limit: limitValidation.optional(),

                yearly_limit: limitValidation.optional(),
            })
            .partial()
            .optional(),
    })
    .refine(
        (data) =>
            data.card_status !== undefined ||
            data.card_limits !== undefined,
        {
            message:
                "At least one field (card_status or card_limits) must be provided",
        }
    );

export default userCardUpdateValidationSchema;