import z from "zod";

const userLoginValidationSchema = z.object({
    email: z
        .email("Invalid email format")
        .trim()
        .max(100, "Email too long")
        .refine((email) => {
            // Prevent disposable email domains
            const disposableDomains = [
                // "example.com",
                "mailinator.com",
                "10minutemail.com",
                "tempmail.com",
                "guerrillamail.com",
                "dispostable.com",
                "trashmail.com",
                // "yopmail.com",
                "fakeinbox.com",
                "getnada.com",
                "temp-mail.org",
                "maildrop.cc",
                "mytemp.email",
                "disposablemail.com",
                "trashmail.net",
                "tempmail.net",
                "throwawaymail.com"
            ];

            const domain = email.split("@")[1];

            return domain ? !disposableDomains.includes(domain) : false;
        }, {
            message: "Disposable email addresses are not allowed"
        }),

    password: z
        .string("Password is required and must be a string")
        .min(8, "Password must be at least 8 characters")
        .max(50, "Password cannot exceed 50 characters")
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_+\-=<>])[A-Za-z\d@$!%*?&#^()_+\-=<>]{8,}$/, "Password must contain at least one uppercase letter, one lowercase letter, one digit, and one special character.")
        .superRefine((password, ctx) => {
            if (!/[A-Z]/.test(password)) {
                ctx.addIssue({
                    code: "custom",
                    message: "Password must contain at least one uppercase letter (A-Z)"
                });
            }

            if (!/[a-z]/.test(password)) {
                ctx.addIssue({
                    code: "custom",
                    message: "Password must contain at least one lowercase letter (a-z)"
                });
            }

            if (!/\d/.test(password)) {
                ctx.addIssue({
                    code: "custom",
                    message: "Password must contain at least one number (0-9)"
                });
            }

            if (!/[@$!%*?&#^()_+\-=<>]/.test(password)) {
                ctx.addIssue({
                    code: "custom",
                    message:
                        "Password must contain at least one special character (@ $ ! % * ? & # ^ ( ) _ + - = < >)"
                });
            }

            if (!/^[A-Za-z\d@$!%*?&#^()_+\-=<>]+$/.test(password)) {
                ctx.addIssue({
                    code: "custom",
                    message:
                        "Password contains invalid characters. Allowed special characters are: @ $ ! % * ? & # ^ ( ) _ + - = < >"
                });
            }

        })
})

export default userLoginValidationSchema;