import swaggerJSDoc from "swagger-jsdoc";


const swaggerOptions: swaggerJSDoc.Options = {
    definition: {
        openapi: "3.0.3",

        info: {
            title: "Banking Management API",
            version: "1.0.0",
            description:
                "API documentation for the Banking Management application.",
        },

        servers: [
            {
                url: "http://localhost:3000",
                description: "Local Development Server",
            },
            // Add production server later
            // {
            //     url: "https://api.example.com",
            //     description: "Production Server",
            // },
        ],

        tags: [
            {
                name: "Configuration",
                description: "Configuration related APIs",
            },
            {
                name: "Helper",
                description: "Helper APIs",
            },
            {
                name: "Users",
                description: "User management APIs",
            },
            {
                name: "KYC",
                description: "User KYC related APIs",
            },
            {
                name: "Wallet",
                description: "Wallet management APIs",
            },
            {
                name: "Wallet Transactions",
                description: "Wallet transaction APIs",
            },
            {
                name: "Cards",
                description: "Card management APIs",
            },
            {
                name: "Card Transactions",
                description: "Card transaction APIs",
            },
            {
                name: "Beneficiaries",
                description: "Beneficiary management APIs",
            },
            {
                name: "Fiat Payout",
                description: "Fiat payout APIs",
            },
            {
                name: "Currency Conversion",
                description: "Currency conversion and quote APIs",
            },
        ],

        components: {
            securitySchemes: {
                BearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT",
                    description: "Enter your JWT access token.",
                },
            },

            schemas: {
                // ---------------------------------
                // Common Response
                // ---------------------------------
                ApiResponse: {
                    type: "object",
                    properties: {
                        status: {
                            type: "string",
                            example: "SUCCESS",
                        },
                        message: {
                            type: "string",
                            example: "Request completed successfully",
                        },
                        data: {
                            type: "object",
                            nullable: true,
                        },
                    },
                },

                // ---------------------------------
                // Error Response
                // ---------------------------------
                ErrorResponse: {
                    type: "object",
                    properties: {
                        status: {
                            type: "string",
                            example: "FAILED",
                        },
                        message: {
                            type: "string",
                            example: "Invalid request",
                        },
                    },
                },

                // ---------------------------------
                // Pagination
                // ---------------------------------
                Pagination: {
                    type: "object",
                    properties: {
                        page: {
                            type: "integer",
                            example: 1,
                        },
                        limit: {
                            type: "integer",
                            example: 10,
                        },
                        total_records: {
                            type: "integer",
                            example: 100,
                        },
                        total_pages: {
                            type: "integer",
                            example: 10,
                        },
                    },
                },

                // ---------------------------------
                // User
                // ---------------------------------
                User: {
                    type: "object",
                    properties: {
                        user_id: {
                            type: "string",
                            example: "user_123456",
                        },
                        email: {
                            type: "string",
                            format: "email",
                            example: "user@example.com",
                        },
                        first_name: {
                            type: "string",
                            example: "John",
                        },
                        last_name: {
                            type: "string",
                            example: "Doe",
                        },
                    },
                },

                // ---------------------------------
                // Wallet
                // ---------------------------------
                Wallet: {
                    type: "object",
                    properties: {
                        wallet_id: {
                            type: "string",
                            example: "wallet_123456",
                        },
                        user_id: {
                            type: "string",
                            example: "user_123456",
                        },
                        wallet_type: {
                            type: "string",
                            enum: ["FIAT", "CRYPTO"],
                            example: "FIAT",
                        },
                        wallet_currency: {
                            type: "string",
                            example: "USD",
                        },
                        balance: {
                            type: "number",
                            example: 1000.5,
                        },
                    },
                },

                // ---------------------------------
                // Wallet Transaction
                // ---------------------------------
                WalletTransaction: {
                    type: "object",
                    properties: {
                        transaction_id: {
                            type: "string",
                            example: "txn_123456",
                        },
                        wallet_id: {
                            type: "string",
                            example: "wallet_123456",
                        },
                        transaction_type: {
                            type: "string",
                            enum: [
                                "LOAD",
                                "WITHDRAW",
                                "TRANSFER",
                                "HOLD",
                                "RELEASE",
                                "REFUND",
                            ],
                            example: "LOAD",
                        },
                        transaction_status: {
                            type: "string",
                            enum: [
                                "PENDING",
                                "SUCCESS",
                                "FAILED",
                                "REVERSED",
                            ],
                            example: "SUCCESS",
                        },
                        amount: {
                            type: "number",
                            example: 100,
                        },
                        currency: {
                            type: "string",
                            example: "USD",
                        },
                    },
                },

                // ---------------------------------
                // Card
                // ---------------------------------
                Card: {
                    type: "object",
                    properties: {
                        card_id: {
                            type: "string",
                            example: "card_123456",
                        },
                        cardholder_id: {
                            type: "string",
                            example: "cardholder_123456",
                        },
                        card_type: {
                            type: "string",
                            enum: ["VIRTUAL", "PHYSICAL"],
                            example: "VIRTUAL",
                        },
                        card_number: {
                            type: "string",
                            example: "4111111111111111",
                        },
                        valid_date: {
                            type: "string",
                            example: "12/30",
                        },
                    },
                },

                // ---------------------------------
                // Card Transaction
                // ---------------------------------
                CardTransaction: {
                    type: "object",
                    properties: {
                        transaction_id: {
                            type: "string",
                            example: "txn_123456",
                        },
                        card_id: {
                            type: "string",
                            example: "card_123456",
                        },
                        cardholder_id: {
                            type: "string",
                            example: "cardholder_123456",
                        },
                        transaction_type: {
                            type: "string",
                            enum: [
                                "PURCHASE",
                                "REFUND",
                                "WITHDRAWAL",
                                "REVERSAL",
                                "FEE",
                            ],
                            example: "PURCHASE",
                        },
                        transaction_status: {
                            type: "string",
                            enum: [
                                "PENDING",
                                "SUCCESS",
                                "FAILED",
                                "REVERSED",
                            ],
                            example: "PENDING",
                        },
                        amount: {
                            type: "number",
                            example: 50,
                        },
                        currency: {
                            type: "string",
                            example: "USD",
                        },
                        merchant_name: {
                            type: "string",
                            example: "Amazon",
                        },
                        merchant_category: {
                            type: "string",
                            example: "RETAIL",
                        },
                        merchant_country: {
                            type: "string",
                            example: "US",
                        },
                    },
                },

                // ---------------------------------
                // Beneficiary
                // ---------------------------------
                Beneficiary: {
                    type: "object",
                    properties: {
                        beneficiary_id: {
                            type: "string",
                            example: "beneficiary_123456",
                        },
                        user_id: {
                            type: "string",
                            example: "user_123456",
                        },
                        account_number: {
                            type: "string",
                            example: "1234567890",
                        },
                        account_holder_name: {
                            type: "string",
                            example: "John Doe",
                        },
                    },
                },

                // ---------------------------------
                // Currency Conversion Quote
                // ---------------------------------
                CurrencyConversionQuote: {
                    type: "object",
                    properties: {
                        quote_id: {
                            type: "string",
                            example: "quote_123456",
                        },
                        source_currency: {
                            type: "string",
                            example: "USD",
                        },
                        destination_currency: {
                            type: "string",
                            example: "EUR",
                        },
                        source_amount: {
                            type: "number",
                            example: 100,
                        },
                        destination_amount: {
                            type: "number",
                            example: 92.5,
                        },
                        expires_at: {
                            type: "string",
                            format: "date-time",
                            example: "2026-08-10T15:30:00.000Z",
                        },
                    },
                },

                // ---------------------------------
                // Fiat Payout Quote
                // ---------------------------------
                FiatPayoutQuote: {
                    type: "object",
                    properties: {
                        quote_id: {
                            type: "string",
                            example: "quote_123456",
                        },
                        beneficiary_id: {
                            type: "string",
                            example: "beneficiary_123456",
                        },
                        source_wallet_currency: {
                            type: "string",
                            example: "USD",
                        },
                        amount: {
                            type: "number",
                            example: 100,
                        },
                        fee: {
                            type: "number",
                            example: 2.5,
                        },
                        total_amount: {
                            type: "number",
                            example: 102.5,
                        },
                        expires_at: {
                            type: "string",
                            format: "date-time",
                        },
                    },
                },
            },
        },

        // ---------------------------------
        // Global Security
        // ---------------------------------
        security: [
            {
                BearerAuth: [],
            },
        ],
    },

    // IMPORTANT:
    // swagger-jsdoc will scan these files for
    // @openapi / @swagger annotations.
    apis: [
        "./src/routes/**/*.ts",
        "./src/controllers/**/*.ts",
    ],
};

const swaggerSpec = swaggerJSDoc(swaggerOptions);

export default swaggerSpec;