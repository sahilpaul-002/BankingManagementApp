# Banking Management Application

A full-stack banking management application built with **React, TypeScript, Node.js, Express, MongoDB, and Redis**.

The application provides a secure and modular platform for managing users, KYC, wallets, cards, transactions, authentication, two-factor authentication, and other banking-related operations.

---

## 🚀 Features

### 👤 User Management

- User registration and authentication
- User profile management
- Email verification
- User status management
- Admin and master-admin roles
- Risk category management
- User activation/deactivation

### 🔐 Authentication & Security

- JWT-based authentication
- Password hashing
- Session management
- Two-Factor Authentication (2FA)
- Email OTP
- TOTP-based authentication
- Password reset functionality
- Rate limiting
- Secure HTTP headers using Helmet
- CORS protection
- Request validation using Zod

### 🪪 KYC Management

- KYC status management
- KYC document management
- KYC workflow support
- KYC statuses:
  - `PENDING`
  - `IN-PROGRESS`
  - `RFI`
  - `COMPLETED`

### 💳 Card Management

- Card creation
- Virtual and physical card support
- Card status management
- Card limits
- Card transactions
- Cardholder management
- Card transaction statuses
- Merchant information
- Transaction references

### 💰 Wallet Management

- Wallet creation
- Fiat wallet support
- Cryptocurrency wallet support
- Wallet balance management
- Wallet loading
- Wallet withdrawal
- Wallet transfers
- Wallet transactions
- Currency conversion
- Transaction history

### 💱 Currency Conversion

- Currency conversion quotes
- Quote expiry handling
- Wallet currency conversion
- Exchange rate processing
- Conversion transaction management

### 🏦 Beneficiary Management

- Add beneficiaries
- Manage beneficiary bank details
- Beneficiary validation
- Fiat payouts
- Payout quotes
- Payout transaction processing

### 🔑 Configuration APIs

The application provides configuration APIs for retrieving:

- DNS configuration
- Mobile country codes
- Symmetric encryption keys
- Asymmetric public keys
- Other application configurations

### 📧 Notifications

- Email notifications
- OTP delivery
- Password reset emails
- Account verification emails
- Transaction-related notifications

### ☁️ File & Media Management

- Cloudinary integration
- Image/document upload support
- Multipart form-data handling

### 📊 Logging & Monitoring

- Winston-based application logging
- Morgan HTTP request logging
- Error logging
- Structured application errors

### ⏱️ Background Jobs

- Scheduled jobs using `node-cron`
- Automated background processing
- Expired quote handling
- Other scheduled banking operations

---

# 🏗️ Technology Stack

## Frontend

- React
- TypeScript
- React Router
- HTML5
- CSS3
- Tailwind CSS / Bootstrap

## Backend

- Node.js
- TypeScript
- Express.js
- Mongoose
- Zod

## Database

- MongoDB
- MongoDB Atlas

## Cache & Sessions

- Redis
- Express Session
- Connect Redis
- LRU Cache

## Authentication & Security

- JSON Web Token (JWT)
- bcrypt
- Helmet
- CORS
- Express Rate Limit
- Speakeasy
- OTP authentication

## External Services

- Cloudinary
- Resend / Nodemailer
- MongoDB Atlas
- Redis

## API Documentation

- Swagger
- Swagger UI
- Postman

---

# 📁 Project Structure

The project follows a modular architecture.

```text
BankingManagementApp/
│
├── BankingManagement-Node/
│   │
│   ├── src/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── schemas/
│   │   ├── types/
│   │   ├── utils/
│   │   ├── validations/
│   │   ├── config/
│   │   └── server/
│   │
│   ├── dist/
│   ├── package.json
│   ├── tsconfig.json
│   └── .env
│
├── BankingManagement-React/
│   │
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── layouts/
│   │   ├── services/
│   │   ├── hooks/
│   │   ├── utils/
│   │   ├── types/
│   │   └── routes/
│   │
│   ├── public/
│   ├── package.json
│   └── tsconfig.json
│
└── README.md
