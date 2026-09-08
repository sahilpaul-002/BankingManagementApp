# Banking Management Application — Backend API

A backend banking management application built from the ground up using **Node.js, Express.js, TypeScript, MongoDB, and Mongoose**.

The application is designed around real-world banking and financial workflows rather than simple CRUD operations. It focuses on modular service architecture, financial transaction consistency, validation, business rules, multi-step workflows, and asynchronous background processing.

---

## 🚀 Project Overview

This project provides a collection of interconnected backend APIs for managing core banking operations such as:

* User registration and authentication
* Two-factor authentication (2FA)
* User onboarding and bank account verification
* Admin approval and rejection workflows
* Fiat funding accounts
* Crypto deposit accounts
* Multi-currency wallets
* Fiat and crypto wallet loading
* Currency conversion and FX quotes
* Virtual and physical card management
* Card funding and transaction processing
* Beneficiary management
* Payout quotes and payout execution
* Fees and financial calculations
* Transaction and status management
* Background processing using scheduled cron jobs

The backend is structured so that individual services work together to execute complete financial workflows.

---

## 🏗️ High-Level Architecture

The application follows a service-oriented backend architecture:

```text
Client
  ↓
API Endpoint
  ↓
Middleware & Validation
  ↓
Application Service
  ↓
Business Rules
  ↓
Financial Calculations
  ↓
Database Transaction
  ↓
State / Transaction Updates
  ↓
API Response
```

Financial operations are designed around a clear flow:

```text
External Source
      ↓
Funding Account
      ↓
Wallet
      ↓
Financial Operation
      ↓
Transaction Processing
```

MongoDB transactions are used for operations where multiple financial records and balances need to remain consistent.

---

## 💳 Core API Modules

### Authentication & User Management

* User registration
* Login
* 2FA
* Session and authentication management
* User onboarding

### Bank & Funding Accounts

* Bank account verification
* Fiat funding accounts
* Crypto deposit accounts
* Funding account management

### Wallet Management

* Multi-currency wallets
* Fiat wallets
* Crypto wallets
* Wallet loading
* Wallet transactions
* Balance management

### Currency Conversion

* FX rate calculation
* Currency conversion quotes
* Quote execution
* Conversion fees
* Quote expiry handling

### Card Management

* Virtual and physical cards
* Card funding
* Card transactions
* Card authorization lifecycle

### Beneficiaries

* Beneficiary management
* Beneficiary validation
* Beneficiary-based payout flows

### Payouts

* Payout quotes
* Payout execution
* Holding balance management
* Transaction processing
* Payout status lifecycle

### Background Processing

Scheduled cron jobs are used for background operations such as:

* Payout processing
* Payout quote expiry
* Card authorization expiry
* Wallet currency-conversion quote expiry

---

## 🔐 Security & Validation

The API uses multiple layers of request processing and validation, including:

* Request validation
* Header validation
* Session validation
* JWT authentication
* Request source validation
* Rate limiting
* Request timeout handling
* Unique request validation
* Encrypted request/response processing
* Global error handling

The exact middleware and authorization requirements depend on the API being accessed.

---

## 🗄️ Database

The application uses **MongoDB with Mongoose** for data persistence.

MongoDB transactions are used for critical financial operations where multiple database changes need to be completed consistently.

Financial amounts are handled using MongoDB-compatible decimal representations where required to maintain appropriate monetary precision.

---

## ⚙️ Technology Stack

* **Node.js**
* **Express.js**
* **TypeScript**
* **MongoDB**
* **Mongoose**
* **Zod**
* **JWT**
* **Redis**
* **Node-Cron**
* **Postman**
* **Render**
* **Git / GitHub**

---

## 🌐 Live Backend

The backend application is publicly deployed on Render.

**Base URL:**

https://bankingmanagementapp.onrender.com

A public base route is available to verify that the deployed backend is running.

---

## 📚 API Documentation

For complete API details, request parameters, request bodies, headers, authentication requirements, responses, and API usage examples, refer to the publicly published Postman documentation:

**Postman API Documentation:**

https://documenter.getpostman.com/view/34434442/2sBY4WnGRq

The Postman documentation provides the practical API reference for consuming and testing the available endpoints.

---

## 📖 Application API Overview

A detailed explanation of the application's API structure, service orchestration, dependencies, financial flows, state management, background processing, and end-to-end workflows is available in the project documentation:

**Application API Overview**

`ApplicationApiOverview`

This document provides a higher-level understanding of how the different APIs and services work together and should be read alongside the Postman API documentation.

---

## 🔄 API Documentation Structure

The project documentation is divided into two main levels:

### 1. Application API Overview

Explains:

* Overall backend architecture
* API modules
* Service orchestration
* API dependencies
* Financial flows
* Entity relationships
* State and lifecycle management
* Background processing
* End-to-end business workflows

### 2. Postman API Documentation

Provides the endpoint-level details required to consume the APIs, including:

* HTTP methods
* Endpoints
* Headers
* Query parameters
* Request bodies
* Authentication requirements
* Responses
* API examples

Together, these provide both the **architectural overview** and the **practical API reference**.

---

## 💻 Source Code

The complete Node.js backend source code is available in this repository.

The project is maintained on the `BankingManagement-Node` branch.

---

## 🚧 Future Development

The backend API is currently being extended into a complete full-stack banking management demonstration.

A frontend application is being developed that will consume these APIs and provide an interactive interface for demonstrating the complete banking workflows end to end.

The goal is to bring the backend services and frontend application together into a complete working banking management demo.

---

## 👨‍💻 Project Focus

This project was built to gain deeper practical experience in:

* Backend architecture
* REST API development
* Financial transaction processing
* MongoDB and Mongoose
* Database transactions
* Service orchestration
* API validation
* Authentication and authorization
* Multi-step financial workflows
* Asynchronous processing
* Scheduled background jobs
* Designing interconnected backend services

---

## 📌 Documentation & Resources

**Live Backend:**
https://bankingmanagementapp.onrender.com

**Postman API Documentation:**
https://documenter.getpostman.com/view/34434442/2sBY4WnGRq

**GitHub Repository:**
https://github.com/sahilpaul-002/BankingManagementApp/tree/BankingManagement-Node
