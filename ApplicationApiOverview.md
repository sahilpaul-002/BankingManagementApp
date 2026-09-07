# BANKING MANAGEMENT APPLICATION

## API Overview & Service Orchestration Guide

**Application architecture • API dependencies • business workflows • financial orchestration**

---

## 1. Document Purpose

This document provides a high-level overview of the Banking Management application's API architecture, functional domains, service dependencies, financial entities, transaction flows, state transitions, and end-to-end business processes.

It is intended for developers and API consumers who need to understand how the application's APIs work together rather than how individual APIs are implemented in code.

This document focuses on:

* The overall application lifecycle and API consumption order.
* The relationship between major API domains and financial entities.
* Prerequisites and dependencies between APIs.
* High-level orchestration performed by application services.
* Financial money movement between funding accounts, wallets, cards, and payouts.
* State and lifecycle transitions for major business processes.
* Authentication, session, configuration, and integration rules.

Detailed endpoint specifications, request/response structures, validations, headers, examples, and implementation-level code details should remain in the individual API documentation.

---

## 2. Application Overview

The application follows a layered financial architecture. A user first gains access to the application, completes authentication and onboarding, passes the required bank verification process, receives application-provided funding accounts, and then moves funds into application wallets. Wallet balances become the primary source for supported application-level financial operations.

```text
APPLICATION CONFIGURATION
        ↓
AUTHENTICATION & AUTHORIZATION
        ↓
USER ONBOARDING
        ↓
BANK VERIFICATION
        ↓
FUNDING ACCOUNTS
        ↓
WALLETS
        ↓
CARD / FX / PAYOUT OPERATIONS
        ↓
TRANSACTIONS / SETTLEMENT
```

### 2.1 Major API Services

| Services                       | Primary responsibility                                                                  |
| ------------------------------ | --------------------------------------------------------------------------------------- |
| Application Configuration      | Domain/API-key mapping, DNS configuration, and session initialization.                  |
| Authentication & Authorization | Signup, login, 2FA initiation, 2FA verification, and protected API access.              |
| User Onboarding                | User address and bank information management.                                           |
| Bank Verification              | Verification request, administrator approval/rejection, and post-approval provisioning. |
| Funding Accounts               | Application-provided fiat and crypto accounts that receive incoming funds.              |
| Wallets                        | Application-level balances used for financial operations.                               |
| FX / Currency Conversion       | Quotes, FX rates, fees, and wallet-to-wallet currency conversion.                       |
| Cards                          | Card creation, funding, spending, authorization, and transaction lifecycle.             |
| Beneficiaries                  | Recipients used by payout operations.                                                   |
| Payouts                        | Payout quotes, execution, holding, processing, and completion.                          |
| Fees / FX                      | Financial rate and fee calculation used by supported operations.                        |
| Background Services            | Scheduled processing such as payout processing and quote/authorization expiry.          |

---

## 3. Application Architecture

### 3.1 Core Application Entities

| Entity                 | Purpose                                                                             | Primary relationship                                                       |
| ---------------------- | ----------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| User                   | Application customer and owner of financial entities.                               | Owns onboarding data, funding accounts, wallets, cards, and beneficiaries. |
| External Bank Account  | User's external banking relationship submitted during onboarding.                   | Used for bank verification.                                                |
| Fiat Funding Account   | Application-provided USD account representing incoming fiat funds.                  | Funds fiat wallets.                                                        |
| Crypto Deposit Account | Application-provided crypto deposit account with network/asset and deposit address. | Funds crypto wallets.                                                      |
| Wallet                 | Application-level balance available for supported financial operations.             | Funds cards, FX conversion, and payouts.                                   |
| Card                   | Payment instrument associated with the user/cardholder.                             | Can be funded from an eligible wallet and used for transactions.           |
| Beneficiary            | Payout recipient and associated banking information.                                | Used by payout operations.                                                 |
| Payout Holding         | Intermediate financial state for funds committed to an outgoing payout.             | Sits between wallet deduction and payout completion where applicable.      |
| Transaction            | Financial activity record representing a money movement or operation.               | Associated with the relevant business operation.                           |

### 3.2 Core Financial Architecture Principle

```text
EXTERNAL SOURCE
      ↓
FUNDING ACCOUNT
      ↓
WALLET
      ↓
FINANCIAL OPERATION
```

Funding accounts and wallets are separate financial layers. Funding accounts represent money entering the application, while wallets represent funds available for application-level use.

---

## 4. API Access & Application Initialization

### 4.1 Domain and API-Key Configuration

Before a client application can use the API stack, the required domain-to-`x-api-key` mapping must exist. This establishes which API key is authorized to communicate with the API stack for a particular application/domain.

### 4.2 DNS Configuration

A DNS configuration document must be associated with the appropriate domain/application. The client then uses the Get DNS Configuration API to load the configuration associated with the domain available in the session.

### 4.3 Session Initialization

The Get DNS Configuration API is a required initialization step before normal application service APIs are used. The application session is described as valid for approximately 12 minutes and is destroyed after that period.

```text
Domain + x-api-key mapping
        ↓
DNS configuration
        ↓
Get DNS Configuration API
        ↓
Session configuration loaded
        ↓
Application service APIs
```

### 4.4 Client Integration Rule

* Call Get DNS Configuration at application/session initialization.
* Call it again approximately every 12 minutes, or before another service API if the previous configuration call is older than the session lifetime.

---

## 5. Authentication & Authorization Flow

```text
SIGN UP
   ↓
LOGIN
   ↓
SEND 2FA
   ↓
VERIFY 2FA
   ↓
AUTHORIZED USER
   ↓
PROTECTED SERVICE APIs
```

Protected service APIs should not be called directly after signup. The client must complete the authentication and 2FA authorization sequence before accessing protected financial services.

---

## 6. User Onboarding & Bank Verification

### 6.1 User Onboarding

After authentication and authorization, the user can submit or update onboarding information, including address information and bank account details.

### 6.2 Bank Verification Lifecycle

```text
BANK DETAILS
    ↓
VERIFICATION REQUEST
    ↓
ADMIN REVIEW
   ↙   ↘
REJECT   APPROVE
  ↓        ↓
UPDATE   VERIFIED
DETAILS      ↓
        cardholder_id
             ↓
    FUNDING ACCOUNT PROVISIONING
```

On approval, the documented provisioning flow performs the following related operations:

1. Mark bank details as verified.
2. Generate a `cardholder_id`.
3. Store the `cardholder_id` against the user.
4. Store the `cardholder_id` against the bank details.
5. Create the user's fiat funding account.
6. Create the user's crypto deposit account.

If the bank account is rejected, the bank details remain unverified and the user can update the details and repeat the verification process.

---

## 7. Funding Account Services

### 7.1 Fiat Funding

The application provides a USD fiat funding account after successful bank verification. It represents the application-side entry point for fiat money and is separate from the user's original external bank account.

```text
External Bank
    ↓
Application Fiat Funding Account
    ↓
USD Wallet
```

### 7.2 Crypto Funding

The application also provides a crypto deposit account containing a network, asset, and deposit address. For the documented demo environment, incoming crypto funding is simulated rather than performed through an actual blockchain transfer.

```text
External Crypto Wallet
          ↓
Application Deposit Address
          ↓
Crypto Deposit Account
          ↓
Crypto Wallet
```

### 7.3 Prefunding vs Wallet Loading

Prefunding increases the balance of the application-provided funding account. It does not directly increase the user's wallet. Wallet loading is a separate operation that moves eligible funds from the funding account into a wallet.

---

## 8. Wallet Services

Supported wallet currencies documented in the application include:

* USD
* EUR
* SGD
* USDC
* USDT

The wallet is the primary application-level balance used by supported financial operations.

```text
FIAT / CRYPTO FUNDING ACCOUNT
          ↓
       LOAD WALLET
          ↓
         WALLET
          ↓
CARD / FX / PAYOUT
```

Wallet loading should validate the relevant funding account, wallet, activity state, supported currency, amount, and available balance before performing the transfer.

For fiat and crypto loading, the documented architecture separates the funding account from the wallet so that incoming funds and application spending/transaction balances remain distinct.

---

## 9. Currency Conversion Services

### 9.1 Quote Generation

The FX/currency-conversion capability provides a quote containing the source currency, destination currency, amounts, FX rate, applicable fee, and the resulting transaction terms.

### 9.2 Quote Execution

```text
SOURCE WALLET
     ↓
CONVERSION QUOTE
     ↓
QUOTE VALIDATION / EXPIRY CHECK
     ↓
SOURCE WALLET DEBIT
     ↓
FEE APPLICATION
     ↓
DESTINATION WALLET CREDIT
     ↓
TRANSACTION RECORD
```

Creating a quote represents proposed transaction terms. Execution is the point at which the financial operation is performed. The documented conversion quote has an expiry period, and the application also contains background processing for quote expiry.

---

## 10. Card Services

### 10.1 Card Creation

After the required verification and cardholder information are available, the user can request a virtual or physical card. The documented card flow validates the user/cardholder context and applies configured card limits.

### 10.2 Card Funding

```text
ELIGIBLE WALLET
      ↓
CARD
      ↓
CARD TRANSACTIONS
```

Card funding uses an eligible wallet as the source. The wallet and card must satisfy the applicable activity, balance, amount, and limit requirements.

### 10.3 Card Transaction Lifecycle

```text
CARD TRANSACTION
      ↓
HOLD / PENDING
      ↓
COMPLETED
```

The application also contains scheduled processing for expired card authorization transactions.

---

## 11. Beneficiary Services

A beneficiary represents a payout recipient. Beneficiary information can include the beneficiary name, bank account information, SWIFT/BIC, IBAN, payout currency, and other required banking information.

```text
CREATE BENEFICIARY
       ↓
BENEFICIARY
       ↓
PAYOUT QUOTE
       ↓
PAYOUT EXECUTION
```

---

## 12. Payout Services

### 12.1 Payout Quote

The payout quote defines the proposed payout terms, including source/destination currencies, amounts, FX rate, fees, and total amount required. Quote creation does not execute the payout.

### 12.2 Payout Execution Orchestration

```text
EXECUTE PAYOUT QUOTE
        ↓
Validate quote
        ↓
Check quote validity / expiry
        ↓
Identify source wallet
        ↓
Validate available balance
        ↓
Apply required financial deductions
        ↓
Move committed funds into payout holding where applicable
        ↓
Create payout transaction
        ↓
PENDING
```

### 12.3 Payout Processing

```text
PENDING
   ↓
PROCESSING
   ↓
SUCCESS
```

The documented demo environment uses a scheduled process to simulate the external payout provider. The scheduled process checks eligible pending transactions and advances the payout lifecycle.

The application also contains scheduled processing for payout quote expiry.

---

## 13. Fee & FX Services

Fees and FX rates are supporting capabilities used by financial operations such as wallet loading, currency conversion, card creation, and payouts. The exact fee configuration and calculation rules belong to the individual API/service documentation.

```text
FINANCIAL OPERATION
      ↓
Determine applicable FX / fee information
      ↓
Calculate transaction terms
      ↓
Execute or return quote
```

---

## 14. Service Orchestration Model

A client-facing API should be understood as a business operation that may coordinate several internal validation, calculation, financial, and persistence steps. The overview therefore separates the API endpoint from the service orchestration it represents.

```text
CLIENT
  ↓
API ENDPOINT
  ↓
APPLICATION SERVICE
  ├─ Validation
  ├─ Business rules
  ├─ Supporting services
  ├─ Financial calculations
  ├─ Financial transaction
  └─ State / transaction record
  ↓
API RESPONSE
```

### 14.1 Example: Load Wallet Orchestration

```text
LOAD WALLET REQUEST
       ↓
Validate request / user context
       ↓
Validate wallet
       ↓
Validate funding account
       ↓
Check available balance
       ↓
Determine applicable FX / fee where required
       ↓
Deduct funding account balance
       ↓
Credit wallet
       ↓
Create transaction record
```

### 14.2 Example: Execute Payout Orchestration

```text
EXECUTE QUOTE
    ↓
Quote validation
    ↓
Beneficiary / wallet validation
    ↓
Quote validity check
    ↓
Balance validation
    ↓
Financial deduction
    ↓
Holding / payout transaction
    ↓
PENDING
    ↓
Background processing
```

### 14.3 Transaction Consistency

Where a financial operation changes multiple related balances or records, the documented architecture treats the operation as a coordinated transaction so that related financial state is kept consistent.

---

## 15. Background / Cron Services

| Background process                      | High-level responsibility                                                                 |
| --------------------------------------- | ----------------------------------------------------------------------------------------- |
| Bank payout processing                  | Processes eligible pending payout transactions and advances the demo payout lifecycle.    |
| Payout quote expiry                     | Identifies payout quotes that have passed their validity period and handles expiry state. |
| Card authorization expiry               | Processes card authorization transactions that have reached their expiry condition.       |
| Wallet currency-conversion quote expiry | Processes wallet currency-conversion quotes that have reached their expiry condition.     |

Background services are part of the application's orchestration model because some business processes continue after the initiating API request has completed.

---

## 16. API Dependency Map

### 16.1 Application Access Dependency

```text
Domain/API-key configuration
        ↓
DNS configuration
        ↓
Get DNS Configuration
        ↓
Application service access
```

### 16.2 User Authorization Dependency

```text
Signup
  ↓
Login
  ↓
Send 2FA
  ↓
Verify 2FA
  ↓
Protected APIs
```

### 16.3 Financial Onboarding Dependency

```text
User onboarding
      ↓
Bank verification
      ↓
Approval
      ↓
Funding account provisioning
```

### 16.4 Wallet Dependency

```text
Funding account
      ↓
Create wallet
      ↓
Load wallet
      ↓
Application financial operations
```

### 16.5 Payout Dependency

```text
Beneficiary
    ↓
Payout quote
    ↓
Execute quote
    ↓
Payout transaction
    ↓
Background processing
```

---

## 17. State & Lifecycle Model

### 17.1 Bank Verification

```text
UNVERIFIED
    ↓
ADMIN REVIEW
   ↙   ↘
APPROVED   REJECTED
```

### 17.2 Payout

```text
PENDING
   ↓
PROCESSING
   ↓
SUCCESS
```

### 17.3 Quote

```text
QUOTE CREATED
      ↓
ACTIVE
   ↙      ↘
EXECUTED   EXPIRED
```

The exact statuses and transition rules should be taken from the individual API/service documentation where they are defined. This overview intentionally presents the business-level lifecycle rather than implementation-specific status handling.

---

## 18. End-to-End Business Flows

### 18.1 New User to Financially Enabled User

1. Application configuration is established.
2. DNS configuration is loaded.
3. User signs up.
4. User logs in.
5. 2FA is sent and verified.
6. User completes onboarding and submits bank details.
7. Bank verification request is generated.
8. Administrator approves or rejects the bank account.
9. On approval, `cardholder_id` and application funding accounts are provisioned.
10. User receives funding account information.

### 18.2 Fiat Funding to Wallet

```text
External / simulated fiat source
          ↓
Fiat funding account
          ↓
Load wallet
          ↓
Fiat wallet
```

### 18.3 Crypto Funding to Wallet

```text
External / simulated crypto source
          ↓
Crypto deposit account
          ↓
Load wallet
          ↓
Crypto wallet
```

### 18.4 Wallet to Card

```text
Wallet
  ↓
Card funding
  ↓
Card
  ↓
Card transaction
```

### 18.5 Wallet to FX Conversion

```text
Source wallet
     ↓
Conversion quote
     ↓
Quote execution
     ↓
Source wallet debit + fee
     ↓
Destination wallet credit
```

### 18.6 Wallet to Payout

```text
Wallet
  ↓
Payout quote
  ↓
Execute quote
  ↓
Payout holding / transaction
  ↓
Processing
  ↓
Beneficiary / external payout
```

---

## 19. Complete Financial Money Flow

### 19.1 Fiat

```text
USER EXTERNAL BANK
       ↓
APPLICATION FIAT FUNDING ACCOUNT
       ↓
USD WALLET
       ├────────→ CARD FUNDING → CARD SPENDING
       ├────────→ FX CONVERSION → OTHER WALLET
       └────────→ PAYOUT → HOLDING → BENEFICIARY
```

### 19.2 Crypto

```text
USER EXTERNAL CRYPTO WALLET
          ↓
APPLICATION DEPOSIT ADDRESS
          ↓
CRYPTO DEPOSIT ACCOUNT
          ↓
CRYPTO WALLET
          ↓
SUPPORTED CRYPTO OPERATIONS / CONVERSION
```

---

## 20. API Consumption Guidelines

| Rule                         | Guideline                                                                                                                                                         |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Application initialization   | Load the required DNS/application configuration before consuming protected application services.                                                                  |
| Session lifecycle            | Respect the documented approximately 12-minute session/configuration lifecycle and refresh configuration when required.                                           |
| Authorization                | Complete Login → Send 2FA → Verify 2FA before protected service access.                                                                                           |
| Bank verification            | Complete required bank verification before relying on post-verification financial provisioning.                                                                   |
| Funding vs wallet            | Treat funding accounts and wallets as separate financial entities.                                                                                                |
| Wallet as transaction source | Use eligible wallet balances for supported card, FX, and payout operations rather than treating the original funding account as the normal transaction balance.   |
| Quote vs execution           | Creating a quote defines transaction terms; execution performs the financial operation.                                                                           |
| Asynchronous processing      | Some operations continue through background services after the initiating API request returns.                                                                    |
| Demo integrations            | Where an external bank, blockchain, card processor, or payout provider is not actually integrated, the corresponding demo flow should be understood as simulated. |

---

## 21. API Overview Matrix

| Capability                | Typical API/service responsibilities                   | Main dependencies                              | Primary result                                              |
| ------------------------- | ------------------------------------------------------ | ---------------------------------------------- | ----------------------------------------------------------- |
| Application Configuration | Initialize domain/DNS/session context.                 | Domain mapping, DNS configuration.             | Client/application configuration available.                 |
| Authentication            | Register and authorize user.                           | Signup, login credentials, 2FA.                | Authorized user session/context.                            |
| Onboarding                | Maintain user and bank information.                    | Authorized user.                               | Onboarding information stored.                              |
| Bank Verification         | Request review and process approval/rejection.         | Onboarding bank details, administrator action. | Verified user + provisioned financial accounts on approval. |
| Funding                   | Receive/prefund fiat or crypto balances.               | Provisioned funding account.                   | Funding account balance updated.                            |
| Wallet                    | Create, load, view, and transact with wallet balances. | Funding account and wallet.                    | Application-level wallet balance and transaction records.   |
| FX                        | Quote and execute currency conversion.                 | Wallets, FX rate, fee configuration.           | Destination wallet credited and source wallet adjusted.     |
| Cards                     | Create, fund, and process card activity.               | Verified/cardholder context, eligible wallet.  | Card and card transaction lifecycle.                        |
| Beneficiary               | Create/manage payout recipients.                       | Authorized user.                               | Beneficiary available for payouts.                          |
| Payout                    | Quote, execute, hold, process, and complete payouts.   | Beneficiary, quote, source wallet.             | Payout transaction and final state.                         |
| Background Processing     | Process pending/expired records.                       | Eligible transaction/quote states.             | State transitions and completion/expiry handling.           |

---

## 22. Complete Application API Map

```text
APPLICATION CONFIGURATION
        ↓
DNS / SESSION INITIALIZATION
        ↓
USER AUTHENTICATION
        ↓
2FA AUTHORIZATION
        ↓
USER ONBOARDING
        ↓
BANK VERIFICATION
        ↓
FUNDING ACCOUNT PROVISIONING
        ↓
FIAT / CRYPTO FUNDING
        ↓
WALLET CREATION & LOADING
        ↓
+-------------------+-------------------+-------------------+
|                   |                   |                   |
CARD              FX                  BENEFICIARY → PAYOUT
|                   |                   |
CARD TXNS       WALLET CONVERSION    QUOTE → EXECUTE → HOLD
|                   |                   |
AUTH / HOLD      QUOTE EXPIRY        PROCESSING
|                   |                   |
COMPLETION        COMPLETION          SUCCESS

BACKGROUND SERVICES ORCHESTRATE EXPIRY AND PROCESSING
```

---

## 23. Documentation Boundaries

This overview should be used as the map to the application. Individual API documents should remain the source for endpoint-level integration details.

| This overview contains    | Individual API documentation contains           |
| ------------------------- | ----------------------------------------------- |
| Application architecture  | Endpoint URL and HTTP method                    |
| Functional domains        | Headers and authentication details              |
| API dependencies          | Query parameters                                |
| Service orchestration     | Request body                                    |
| Business-level money flow | Response body                                   |
| Lifecycle/state overview  | Validation rules                                |
| End-to-end workflows      | Error responses                                 |
| Integration rules         | Examples / cURL / Postman details               |
| High-level demo behavior  | Implementation-specific behavior where required |

---

## 24. Final Architecture Summary

The Banking Management application is organized around a progression from application access and user authorization to financial onboarding, funding, wallet management, and higher-level financial operations.

```text
CONFIGURATION
    ↓
AUTHENTICATION
    ↓
ONBOARDING
    ↓
VERIFICATION
    ↓
FUNDING ACCOUNTS
    ↓
WALLETS
    ↓
FINANCIAL OPERATIONS
    ↓
TRANSACTIONS
    ↓
BACKGROUND PROCESSING / SETTLEMENT
```

The central financial architecture is:

```text
External Source → Funding Account → Wallet → Financial Operation
```

The API architecture mirrors this progression by enforcing prerequisites and orchestrating the supporting services required to perform each business operation.

---

**End of API Overview & Service Orchestration Guide**
