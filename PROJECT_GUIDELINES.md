# Banking Management App - Development Guidelines

> **Version:** 1.0  
> **Last Updated:** May 2026  
> **Purpose:** Comprehensive source of truth for building React applications with Redux Toolkit, RTK Query, and TypeScript

---

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Folder Structure](#folder-structure)
4. [Naming Conventions](#naming-conventions)
5. [State Management](#state-management)
6. [API Integration](#api-integration)
7. [Component Development](#component-development)
8. [Routing Implementation](#routing-implementation)
9. [Form Handling](#form-handling)
10. [Error Handling](#error-handling)
11. [Security Patterns](#security-patterns)
12. [TypeScript Configuration](#typescript-configuration)
13. [Development Workflow](#development-workflow)
14. [Best Practices](#best-practices)

---

## 🎯 Project Overview

This Application follows a modular, feature-based architecture built with React, TypeScript, Redux Toolkit, and RTK Query. The application emphasizes:

- **Type Safety** - Full TypeScript implementation
- **State Management** - Redux Toolkit with RTK Query for API calls
- **Security** - End-to-end encryption for API requests/responses
- **Modularity** - Feature-based folder structure
- **Reusability** - Custom hooks, shared components, and utilities
- **Error Handling** - Centralized error management with custom error classes
- **Form Validation** - React Hook Form + Zod for robust validation

---

## 🛠 Technology Stack

### Core Technologies

- **React 19.2.0** - UI library with latest features
- **TypeScript 5.9.3** - Static type checking
- **Vite 7.3.1** - Build tool and dev server
- **Redux Toolkit 2.11.2** - State management
- **RTK Query** - Data fetching and caching (built into Redux Toolkit)

### Key Libraries

- **react-router-dom 7.13.1** - Client-side routing
- **react-hook-form 7.71.2** - Form state management
- **zod 4.3.6** - Schema validation
- **axios 1.14.0** - HTTP client
- **TanStack Table** - Table structure representation
- **Charts** - Charts structure visualization
- **Tailwind CSS 4.2.1** - Utility-first CSS
- **shadcn/ui** - UI component library (Use custome theme to overwrite the shadcn UI theme)
- **react-toastify 11.0.5** - Toast notifications

### Development Tools

- **ESLint** - Code linting
- **TypeScript ESLint** - TypeScript-specific linting

- **Type Safety** - Full TypeScript implementation
- **State Management** - Redux Toolkit with RTK Query for API calls
- **Security** - End-to-end encryption for API requests/responses
- **Modularity** - Feature-based folder structure
- **Reusability** - Custom hooks, shared components, and utilities
- **Error Handling** - Centralized error management with custom error classes
- **Form Validation** - React Hook Form + Zod for robust validation

---

<!-- ## 🛠 Technology Stack

### Core Technologies
- **React** - Latest
- **TypeScript** - Latest Static type checking
- **Vite** - Latest Build tool and dev server
- **Redux Toolkit** - Latest State management
- **RTK Query** - Data fetching and caching (built into Redux Toolkit)

### Key Libraries
- **react-router-dom ** - Latest Client-side routing
- **react-hook-form ** - Latest Form state management
- **zod ** - Latest Schema validation
- **axios ** - Latest HTTP client
- **Tailwind CSS ** - Latest Utility-first CSS
- **shadcn/ui** - Latest UI component library (Use custome theme to overwrite the shadcn UI theme))
- **react-toastify ** - Latest Toast notifications

### Development Tools
- **ESLint** - Code linting
- **TypeScript ESLint** - TypeScript-specific linting -->

---

## Styling Rules

# Use:

- Tailwind CSS
- shadcn/ui

# Things to avoid unless absolutely necessary:

- Plain CSS
- CSS Modules
- Inline CSS styles

# Rules:

- Prefer utility-first Tailwind styling
- Avoid large custom CSS files
- Prefer reusable utility classes
- Use cn() utility for conditional classes
- Use cva() for reusable variants
- Maintain consistent spacing, typography, and sizing patterns
- Support dark mode whenever applicable
- User the shadcn/ui's to create reusable custom ui components which will wrapp the shadcn/ui's but will the the theme and colors specified by the application

---

## Portal & Overlay Rendering Rules

Use createPortal from React DOM for all overlay-based UI components.

Examples:

Modals
Dialogs
Drawers
Popovers
Tooltips
Dropdown overlays
Fullscreen loaders
Floating action panels

Rules:

Overlay components must not render directly inside normal page DOM hierarchy
Overlay components should render using createPortal
Portals should preferably render into document.body
Maintain proper z-index layering strategy
Prevent layout breaking caused by nested parent containers
Ensure overlays remain accessible and keyboard navigable
Ensure proper focus trapping for dialogs/modals
Ensure body scroll locking when modal/dialog is open

Preferred example:

import { createPortal } from 'react-dom'

export function Modal() {
return createPortal(

<div className="fixed inset-0 z-50">
Modal Content
</div>,
document.body
)
}

Avoid:

Rendering modals directly inside deeply nested components
Excessive z-index hacks
Overlay clipping caused by parent overflow containers
Non-accessible overlay implementations

---

## React 19 Feature Usage Rules

The application must use the latest stable React 19 patterns and APIs wherever applicable.

Avoid legacy React patterns when newer React 19 APIs provide cleaner, more maintainable, or more performant alternatives.

---

# React Actions Rules

Use React 19 Actions for handling async UI interactions and mutations.

Examples:

- form submissions
- profile updates
- save operations
- async UI actions
- transactional user actions

Rules:

- Prefer React Actions over manual loading state management where applicable
- Async UI mutations should use transition-based flows
- Pending states should be automatically managed whenever possible
- Avoid excessive manual `isLoading` state management inside components

---

# useTransition Rules

Use `React.useTransition()` for handling pending UI states during async actions.

Use cases:

- API-triggered UI updates
- route transitions
- form submissions
- expensive UI updates
- optimistic updates

Rules:

- Prefer `useTransition` over manual loading booleans for UI transitions
- Pending states should disable relevant UI interactions
- Maintain responsive UI during async updates
- Avoid blocking urgent UI updates

Preferred pattern:

```tsx id="b0sh4k"
const [isPending, startTransition] = useTransition();

startTransition(async () => {
  await submitData();
});
```

Avoid:

- excessive `setLoading(true/false)` patterns
- blocking UI updates unnecessarily

---

# useActionState Rules

Use `React.useActionState()` for managing async action state.

Use cases:

- form submissions
- async mutations
- validation handling
- server interaction states

Rules:

- Prefer `useActionState` for common async action flows
- Keep action handlers centralized and predictable
- Return structured action states
- Avoid scattered async mutation logic

Preferred pattern:

```tsx id="zyjlwm"
const [state, submitAction, isPending] = useActionState(
  async (previousState, payload) => {
    return await submitForm(payload);
  },
  initialState,
);
```

Benefits:

- cleaner async handling
- predictable action lifecycle
- simplified pending/error management

---

# React 19 Form Actions Rules

Use React 19 native form Actions whenever applicable.

Rules:

- Prefer `<form action={serverAction}>` patterns
- Avoid unnecessary manual submit handlers
- Use native form action flows for better React integration
- Prefer uncontrolled forms when suitable
- Allow React to automatically manage form reset behavior

Preferred pattern:

```tsx id="jlwmj6"
<form action={submitAction}>
```

Avoid:

- unnecessary `onSubmit` boilerplate
- manual form serialization patterns

---

# useFormStatus Rules

Use `useFormStatus()` from `react-dom` for form pending states.

Use cases:

- disabling submit buttons
- showing form loaders
- preventing duplicate submissions

Rules:

- Prefer `useFormStatus` over manually passing loading props deeply
- Submit buttons should react automatically to pending form states
- Forms should provide proper pending UX feedback

Preferred pattern:

```tsx id="jlwmm1"
const { pending } = useFormStatus();
```

Example:

```tsx id="0jlwm4"
<button disabled={pending}>
```

---

# Form Reset Rules

Use React 19 automatic form reset behavior whenever applicable.

Rules:

- Prefer React-managed form reset flows
- Use `requestFormReset()` only when manual reset control is required
- Avoid unnecessary manual reset implementations

---

# Activity Component Rules

Use `<Activity>` to manage visibility and rendering prioritization for large UI sections.

Use cases:

- dashboards
- tab systems
- analytics pages
- large layouts
- conditional feature rendering

Rules:

- Prefer `<Activity>` over frequent mount/unmount cycles for expensive UI sections
- Use Activity to preserve state while controlling visibility
- Improve rendering prioritization for enterprise dashboards

Preferred pattern:

```tsx id="6jlwm5"
<Activity mode={isVisible ? "visible" : "hidden"}>
  <Page />
</Activity>
```

Benefits:

- smoother UI transitions
- preserved component state
- improved rendering prioritization

---

# useEffectEvent Rules

Use `useEffectEvent()` to separate event logic from effects.

Use cases:

- subscriptions
- websocket events
- realtime systems
- notifications
- event-driven side effects

Rules:

- Use `useEffectEvent` to avoid stale closures
- Keep effects dependency-safe
- Separate event handlers from synchronization logic
- Avoid suppressing ESLint dependency warnings

Preferred pattern:

```tsx id="jlwmw2"
const onConnected = useEffectEvent(() => {
  showNotification("Connected!", theme);
});
```

Benefits:

- cleaner effects
- proper dependency handling
- fewer stale closure bugs
- improved maintainability

---

# Modern React Rules

Rules:

- Prefer functional patterns over imperative patterns
- Prefer concurrent-friendly APIs
- Avoid legacy lifecycle-style thinking
- Prefer React-native async handling features
- Keep components responsive during async work
- Use Suspense and lazy loading where appropriate
- Prefer declarative UI flows

---

# Forbidden Legacy Patterns

Avoid unless absolutely necessary:

- excessive manual loading state handling
- deeply nested effect chains
- unnecessary imperative DOM manipulation
- duplicated async state logic
- legacy class components
- suppressing React hook dependency warnings
- blocking synchronous rendering patterns

---

# Enterprise React Performance Rules

Rules:

- Use transitions for non-urgent updates
- Keep urgent interactions responsive
- Avoid unnecessary re-renders
- Preserve UI responsiveness during async work
- Prefer progressive rendering patterns
- Use Activity boundaries for expensive UI sections
- Use lazy loading for route-level modules

## 📁 Folder Structure

```
BankingManagement-React/
├── public/                          # Static assets
│   └── vite.svg
│
├── src/
│   ├── assets/                      # Images, fonts, icons
│   │   └── react.svg
│   │
│   ├── components/                  # Reusable UI components
│   │   ├── auth/                    # Authentication-related components
│   │   │   ├── BrandingComponent.tsx
│   │   │   ├── SignInPage.tsx
│   │   │   └── SignUpPage.tsx
│   │   │
│   │   ├── common/                  # Shared components across features
│   │   │   ├── Banner.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── CustomButton.tsx
│   │   │   ├── CustomDatePicker.tsx
│   │   │   ├── CustomInput.tsx
│   │   │   ├── CustomPasswordInput.tsx
│   │   │   ├── CustomSelect.tsx
│   │   │   ├── DestroySession.tsx
│   │   │   ├── FormSkeleton.tsx
│   │   │   ├── PasswordValidationRules.tsx
│   │   │   ├── ServiceUnavailable503.tsx
│   │   │   └── loaders/
│   │   │
│   │   └── ui/                      # Shadcn UI base components
│   │       ├── button.tsx
│   │       ├── calendar.tsx
│   │       ├── field.tsx
│   │       ├── input.tsx
│   │       ├── label.tsx
│   │       ├── popover.tsx
│   │       ├── select.tsx
│   │       └── separator.tsx
│   │
│   ├── configs/                     # Application configuration
│   │   ├── axiosConfig.ts          # Axios instance and interceptors
│   │   └── constants.ts            # API URLs and constants
│   │
│   ├── errorHandling/               # Error management system
│   │   ├── appError.ts             # Custom error class
│   │   ├── error.ts                # Error type definitions
│   │   ├── errorLogger.ts          # Error logging utility
│   │   ├── handleErrors.ts         # Centralized error handler
│   │   ├── mapToRtkError.ts        # RTK error mapper
│   │   └── rtkQueryCatchError.ts   # RTK Query error handler
│   │
│   ├── layouts/                     # Layout components
│   │   └── AuthLayout.tsx          # Authentication pages layout
│   │
│   ├── lib/                         # Third-party library configurations
│   │   └── utils.ts                # Utility functions (e.g., cn for Tailwind)
│   │
│   ├── pages/                       # Page-level components
│   │   └── AuthPage.tsx            # Authentication page container
│   │
│   ├── redux/                       # State management
│   │   ├── features/               # RTK Query API definitions
│   │   │   ├── config/
│   │   │   │   ├── configApi.ts
│   │   │   │   └── configApisDataTypes.ts
│   │   │   ├── helper/
│   │   │   │   └── helperApis.ts
│   │   │   └── user/
│   │   │       └── userApi.ts
│   │   │
│   │   ├── hooks/                  # Custom Redux hooks
│   │   │   └── reduxHooks.ts
│   │   │
│   │   ├── slice/                  # Redux slices
│   │   │   ├── config/
│   │   │   │   └── configSlice.ts
│   │   │   ├── user/
│   │   │   │   └── userSlice.ts
│   │   │   └── utility/
│   │   │       └── utilitySlice.ts
│   │   │
│   │   ├── thunks/                 # Async thunks
│   │   │   └── userThunks.ts
│   │   │
│   │   └── sotre.ts                # Redux store configuration
│   │
│   ├── routes/                      # Routing configuration
│   │   └── router.ts               # Route definitions
│   │
│   ├── services/                    # Business logic services
│   │   └── getEncryptionKeys.ts
│   │
│   ├── utils/                       # Utility functions
│   │   ├── aesDecryption.ts
│   │   ├── aesEncryption.ts
│   │   ├── checkPasswordStrength.ts
│   │   ├── GetDeviceId.ts
│   │   ├── mobileCountryCodesList.ts
│   │   ├── rsaEncryption.ts
│   │   └── validatePassword.ts
│   │
│   ├── App.css                      # Global app styles
│   ├── App.tsx                      # Root app component
│   ├── index.css                    # Global CSS imports
│   └── main.tsx                     # Application entry point
│
├── .env                             # Environment variables
├── .gitignore                       # Git ignore rules
├── components.json                  # Shadcn UI configuration
├── eslint.config.js                 # ESLint configuration
├── index.html                       # HTML entry point
├── package.json                     # Dependencies and scripts
├── tsconfig.json                    # TypeScript base config
├── tsconfig.app.json               # TypeScript app config
├── tsconfig.node.json              # TypeScript Node config
└── vite.config.ts                  # Vite configuration
```

### Folder Structure Guidelines

#### **1. `/components`**

- **Purpose**: Reusable UI components
- **Subfolders**:
  - `auth/`: Authentication-specific components (SignIn, SignUp, Branding)
  - `common/`: Shared components used across features
  - `ui/`: Shadcn UI base components (don't modify directly)
- **Rules**:
  - Components should be in PascalCase with `.tsx` extension
  - Keep components focused and single-purpose
  - Use `forwardRef` for components that need ref access

#### **2. `/configs`**

- **Purpose**: Application-wide configuration files
- **Files**:
  - `axiosConfig.ts`: Axios instance, interceptors, base query
  - `constants.ts`: API URLs, environment constants
- **Rules**:
  - All configuration should be centralized here
  - Use environment variables for sensitive data
  - Export factory functions for instances

#### **3. `/redux`**

- **Purpose**: Complete state management solution
- **Subfolders**:
  - `features/`: RTK Query API endpoints (organized by domain)
  - `hooks/`: Typed Redux hooks for use in components
  - `slice/`: Redux Toolkit slices (state + reducers)
  - `thunks/`: Complex async operations
- **Rules**:
  - One slice per domain/feature
  - RTK Query for all API calls
  - Export selectors alongside slices

#### **4. `/errorHandling`**

- **Purpose**: Centralized error management
- **Files**:
  - Custom error classes
  - Error handlers for different scenarios
  - Error logging utilities
- **Rules**:
  - All errors should flow through centralized handler
  - Custom error classes for different error types
  - Always log errors with context

#### **5. `/pages`**

- **Purpose**: Top-level page components
- **Rules**:
  - One file per page/route
  - Compose from smaller components
  - Handle data fetching at page level

#### **6. `/layouts`**

- **Purpose**: Layout wrapper components
- **Rules**:
  - Define consistent structure for groups of pages
  - Handle loading states
  - Manage shared UI elements (headers, footers)

#### **7. `/utils`**

- **Purpose**: Pure utility functions
- **Rules**:
  - Must be pure functions (no side effects)
  - Well-typed with TypeScript
  - Single responsibility per file

#### **8. `/services`**

- **Purpose**: Business logic services
- **Rules**:
  - Encapsulate complex business operations
  - Can have side effects (unlike utils)
  - Reusable across components

---

## 🏷 Naming Conventions

### Files and Folders

```typescript
// Components - PascalCase
SignInComponent.tsx;
CustomButton.tsx;
AuthLayout.tsx;

// Utilities - camelCase
aesEncryption.ts;
validatePassword.ts;
axiosConfig.ts;

// Redux files - camelCase with descriptive suffix
userSlice.ts;
userApi.ts;
userThunks.ts;
reduxHooks.ts;

// Constants - camelCase
constants.ts;

// Types/Interfaces files - camelCase with suffix
configApisDataTypes.ts;
```

### Components

```typescript
// Component names - PascalCase
export default function SignInComponent() {}
export default function CustomInput() {}

// Component with forwardRef - PascalCase
const CustomInput = forwardRef<HTMLInputElement, CustomInputProps>(
  (props, ref) => {
    // implementation
  },
);
```

### Variables and Functions

```typescript
// Variables - camelCase
const isAuthenticated = true;
const userName = "John Doe";
const dnsConfigData = {};

// Boolean variables - is/has/should prefix
const isLoading = false;
const hasError = true;
const shouldRender = false;

// Functions - camelCase, verb prefix
function getUserDetails() {}
function handleSubmit() {}
function validatePassword() {}

// Event handlers - handle prefix
const handleClick = () => {};
const handleSubmit = () => {};
const handleChange = () => {};

// Async functions - async/await pattern
async function fetchUserData() {
  const response = await apiCall();
  return response;
}
```

### Constants

```typescript
// Constants - UPPER_SNAKE_CASE
export const API_BASE_URL = "/api/v1";
export const CONFIG_URL = "/api/v1/config";
export const USER_URL = "/api/v1/user";
export const HELPER_URL = "/api/v1/helper";

// Environment variables - VITE_ prefix
const ENVIRONMENT = import.meta.env.VITE_REACT_ENV;
const DNS_BASE_URL = import.meta.env.VITE_DNS_BASE_URL;
```

### Types and Interfaces

```typescript
// Interfaces - PascalCase with descriptive suffix
interface UserDetails {}
interface SignupRequestType {}
interface ApiResponseType<T> {}

// Type aliases - PascalCase with Type suffix
type rootStateType = ReturnType<typeof store.getState>;
type appDispatchType = typeof store.dispatch;
type SignupFormData = z.infer<typeof schema>;

// Props interfaces - PascalCase with Props/Types suffix
interface CustomInputPropsTypes extends InputHTMLAttributes<HTMLInputElement> {
  id: string;
  label: string;
}

interface DestroySessionPropsTypes {
  title: string;
  type: "DEFAULT" | "SESSION_INACTIVITY";
}
```

### Redux Naming

```typescript
// Slices - camelCase with Slice suffix
const userSlice = createSlice({ name: 'user', ... });
const configSlice = createSlice({ name: 'config', ... });

// RTK Query APIs - camelCase with Apis suffix
export const userApis = createApi({ reducerPath: 'userApis', ... });
export const configApis = createApi({ reducerPath: 'configApis', ... });

// Selectors - select prefix + descriptive name
export const selectUserDetails = (state: rootStateType) => state.user.userDetails;
export const selectIsAuthenticated = (state: rootStateType) => state.user.isAuthenticated;

// Actions - verb + noun pattern
setUserDetails()
logout()
resetUserState()
setShowErrorBanner()

// Thunks - verb + noun pattern
export const logoutUser = createAsyncThunk('user/logoutUser', ...);
```

### CSS Classes

```typescript
// Use descriptive kebab-case with BEM-like structure
className = "signinPage-wrapper";
className = "signinPage-container";
className = "signinPage-signinForm-wrapper";
className = "signinPage-signinForm-button-container";

// Tailwind utility classes
className = "w-full h-screen bg-white";
```

### ID Attributes

```typescript
// Descriptive kebab-case
id = "signinForm-input-email";
id = "signupForm1-input-password";
id = "signPage-signinForm-button";
```

---

## 🔄 State Management

### Architecture Overview

The application uses **Redux Toolkit** with three key patterns:

1. **Slices** - Local state management with reducers
2. **RTK Query** - API calls with caching
3. **Thunks** - Complex async operations

### Redux Store Setup

**File:** `src/redux/sotre.ts`

```typescript
import { configureStore } from "@reduxjs/toolkit";
import { userApis } from "./features/user/userApi.js";
import userSlice from "./slice/user/userSlice.js";
import configSlice from "./slice/config/configSlice.js";
import { configApis } from "./features/config/configApi.js";
import { helperApis } from "./features/helper/helperApis.js";
import utilitySlice from "./slice/utility/utilitySlice.js";

// EXPORT RTK STORE
export const store = configureStore({
  reducer: {
    // Redux Slice Reducers
    config: configSlice.reducer,
    utility: utilitySlice.reducer,
    user: userSlice.reducer,

    // RTK Query Reducers
    [configApis.reducerPath]: configApis.reducer,
    [helperApis.reducerPath]: helperApis.reducer,
    [userApis.reducerPath]: userApis.reducer,
  },

  // RTK Query Middleware
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      configApis.middleware,
      helperApis.middleware,
      userApis.middleware,
    ),
});

// EXPORT STORE DISPATCH
export const storeDispatch = store.dispatch;

// EXPORT HOOKS TYPES
export type rootStateType = ReturnType<typeof store.getState>;
export type appDispatchType = typeof store.dispatch;
```

**Key Points:**

- Combine slice reducers and RTK Query reducers
- Add RTK Query middleware for caching
- Export typed versions of state and dispatch

### Redux Slices Pattern

**File:** `src/redux/slice/user/userSlice.ts`

```typescript
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { rootStateType } from "../../sotre";

// 🔐 Define State Type
interface UserDetails {
  _id: string | null;
  full_name: string | null;
  email: string | null;
  mobile_country_code: string | null;
  mobile_country_name: string | null;
  phone_number: string | null;
  date_of_birth: string | null;
  gender: string | null;
  kyc_status: string | null;
  wallet_id: string | null;
  status: string | null;
  is_active: boolean | null;
  is_email_verified: boolean | null;
  is_phone_verified: boolean | null;
  is_2fa_enabled: boolean | null;
}

interface UserState {
  userDetails: UserDetails | null;
  isLogin: boolean;
  isAuthenticated: boolean;
}

// 🧠 Initial State
const initialState: UserState = {
  userDetails: null,
  isLogin: false,
  isAuthenticated: false,
};

// ⚙️ Create Slice
const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    // Set User Details
    setUserDetails: (state, action: PayloadAction<UserDetails>) => {
      state.userDetails = action.payload;
    },

    // Set Authenticated
    setAuthenticated: (state, action: PayloadAction<boolean>) => {
      state.isAuthenticated = action.payload;
    },

    // Set Login
    setLogin: (state, action: PayloadAction<boolean>) => {
      state.isLogin = action.payload;
    },

    // Logout
    logout: (state) => {
      state.isLogin = false;
      state.isAuthenticated = false;
    },

    // Reset User States
    resetUserState: () => initialState,
  },
});

// 📤 Export actions
export const { setUserDetails, logout, resetUserState } = userSlice.actions;

// 📤 Export reducer
export default userSlice;

// 📌 Selectors
export const selectUserDetails = (state: rootStateType) =>
  state.user.userDetails;
export const selectIsAuthenticated = (state: rootStateType) =>
  state.user.isAuthenticated;
```

**Slice Guidelines:**

1. Define TypeScript interfaces for state
2. Create initialState with proper types
3. Use PayloadAction for typed actions
4. Export actions separately
5. Export selectors alongside slice
6. Always include a reset action
7. Use Immer-friendly mutations (Redux Toolkit auto-handles immutability)

### RTK Query Pattern

**File:** `src/redux/features/user/userApi.ts`

```typescript
import { createApi } from "@reduxjs/toolkit/query/react";
import { axiosBaseQuery, getAxiosInstance } from "@/configs/axiosConfig";
import type { rootStateType } from "@/redux/sotre";

// Types
interface SignupRequestType {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  gender: string;
  dialCode: string;
  countryCode: string;
  phoneNumber: string;
  dateOfBirth: Date;
}

interface ApiResponseType<T> {
  status: string;
  message: string;
  data?: T;
  error?: any;
}

// Get Axios Instance
const axiosInstance = getAxiosInstance();

// Create API
export const userApis = createApi({
  reducerPath: "userApis",
  baseQuery: axiosBaseQuery(axiosInstance),
  endpoints: (build) => ({
    // Sign Up Mutation
    signUp: build.mutation<ApiResponseType<any>, SignupRequestType>({
      async queryFn(payload, { getState, dispatch }, _extraOptions, baseQuery) {
        try {
          const state = getState() as rootStateType;

          // Custom logic before request
          const headers = getUserApiHeaders(state);

          const result = await baseQuery({
            url: `${USER_URL}/signUp`,
            method: "POST",
            headers,
            data: payload,
          });

          return { data: result.data as ApiResponseType<any> };
        } catch (err) {
          return rtkQueryCatchError(err, "SignUp");
        }
      },
    }),

    // Sign In Mutation
    signIn: build.mutation<ApiResponseType<any>, SigninRequestType>({
      async queryFn(payload, { getState, dispatch }, _extraOptions, baseQuery) {
        // Similar implementation
      },
    }),
  }),
});

// Export hooks
export const { useSignInMutation, useSignUpMutation } = userApis;
```

**RTK Query Guidelines:**

1. Use `createApi` for all API definitions
2. Provide `reducerPath` (unique name)
3. Use custom `baseQuery` (axios-based)
4. Define mutations for POST/PUT/DELETE
5. Define queries for GET requests
6. Use `queryFn` for complex logic
7. Export auto-generated hooks
8. Handle errors with try-catch
9. Use TypeScript generics for type safety

### Custom Redux Hooks

**File:** `src/redux/hooks/reduxHooks.ts`

```typescript
import {
  type TypedUseSelectorHook,
  useDispatch,
  useSelector,
} from "react-redux";
import type { rootStateType, appDispatchType } from "../sotre";

export const useAppDispatch = () => useDispatch<appDispatchType>();
export const useAppSelector: TypedUseSelectorHook<rootStateType> = useSelector;
```

**Usage in Components:**

```typescript
import { useAppDispatch, useAppSelector } from "@/redux/hooks/reduxHooks";
import {
  selectUserDetails,
  setUserDetails,
} from "@/redux/slice/user/userSlice";

function MyComponent() {
  const dispatch = useAppDispatch();
  const userDetails = useAppSelector(selectUserDetails);

  // Fully typed!
}
```

### Thunks Pattern

**File:** `src/redux/thunks/userThunks.ts`

```typescript
import { createAsyncThunk } from "@reduxjs/toolkit";
import { userApis } from "../features/user/userApi";
import { resetUserState } from "../slice/user/userSlice";
import { resetConfigStates } from "../slice/config/configSlice";

let isLoggingOut = false;

export const logoutUser = createAsyncThunk(
  "user/logoutUser",
  async (_, { dispatch }) => {
    if (isLoggingOut) return;
    isLoggingOut = true;

    try {
      // Clear storage
      localStorage.clear();
      sessionStorage.clear();

      // Reset RTK Query cache
      dispatch(userApis.util.resetApiState());
      dispatch(configApis.util.resetApiState());

      // Reset redux states
      dispatch(resetUserState());
      dispatch(resetConfigStates());

      // Redirect
      window.location.href = "/";
    } catch (err) {
      logError("ERROR", {
        message: `LogoutUser faced error: ${err.message}`,
        error: err,
        context: "LogoutUser",
      });
      throw new InternalApplicationError(
        `LogoutUser faced error`,
        "LogoutUser",
        err,
      );
    } finally {
      setTimeout(() => {
        isLoggingOut = false;
      }, 1000);
    }
  },
);
```

**Thunk Guidelines:**

1. Use for complex async operations
2. Use flag to prevent duplicate operations
3. Always use try-catch-finally
4. Reset all relevant state
5. Clear caches when needed
6. Log errors with context

---

## 🌐 API Integration

### Axios Configuration

**File:** `src/configs/axiosConfig.ts`

The application uses a **centralized Axios instance** with:

- Request/response interceptors
- Automatic encryption/decryption
- Error handling
- Device ID tracking

#### Factory Pattern for Axios Instance

```typescript
import axios, { type AxiosInstance } from "axios";

let axiosInstance: AxiosInstance | null = null;

export const getAxiosInstance = (): AxiosInstance => {
  if (!axiosInstance) {
    axiosInstance = axios.create({
      withCredentials: true,
    });

    setupInterceptors(axiosInstance);
  }

  return axiosInstance;
};
```

**Key Points:**

- Singleton pattern for axios instance
- Factory function ensures single instance
- Credentials included for cookies

#### Request Interceptor Pattern

```typescript
const setupInterceptors = (instance: AxiosInstance) => {
  instance.interceptors.request.use(
    async (req) => {
      // 1. Add default headers
      req.headers = req.headers ?? {};
      req.headers["portal"] = "business";
      req.headers["from-portal"] = "true";
      req.headers["request-id"] = crypto.randomUUID();

      // 2. Add device ID
      const deviceId = await GetDeviceId();
      req.headers["x-device-id"] = deviceId;

      // 3. Skip encryption for specific APIs
      if (req.url?.includes("/getEncryptionKey")) {
        return req;
      }

      // 4. Get encryption keys
      let aesKey = sessionStorage.getItem("keyHex");
      let rsaKey = sessionStorage.getItem("publicKey");

      if (!aesKey || !rsaKey) {
        // Fetch keys
        const [aesKey, rsaKey] = await Promise.all([
          getAesEncryptionKey(),
          getRsaPublicKey(),
        ]);
        sessionStorage.setItem("keyHex", aesKey);
        sessionStorage.setItem("publicKey", rsaKey);
      }

      // 5. Generate IV for encryption
      const iv = window.crypto.getRandomValues(new Uint8Array(12));
      const ivHex = Array.from(iv)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

      // Store IV for response decryption
      ivStore.set(req, ivHex);

      // 6. Encrypt payload
      const rsaRes = await rsaEncryption({ ivHex }, rsaKey);
      const aesRes = await aesEncryption(aesKey, req.data, ivHex);

      req.data = {
        encryptedPayload1: rsaRes?.ciphertextBase64,
        encryptedPayload2: aesRes?.ciphertextHex,
      };

      return req;
    },
    (error) => Promise.reject(error),
  );
};
```

**Request Interceptor Flow:**

1. Add required headers (portal, request-id, device-id)
2. Skip encryption for key-fetching endpoints
3. Get or fetch encryption keys
4. Generate initialization vector (IV)
5. Encrypt request payload with RSA + AES
6. Store IV for response decryption

#### Response Interceptor Pattern

```typescript
instance.interceptors.response.use(
  async (res) => {
    try {
      const data = res?.data;

      // Decrypt if data is encrypted string
      if (data?.data && typeof data.data === "string") {
        const aesKey = sessionStorage.getItem("keyHex");
        const ivHex = ivStore.get(res.config);

        if (aesKey && ivHex) {
          const decryptRes = await aesDecryption({
            cipherTextHex: data.data,
            ivHex,
            aesEncryptionKeyHex: aesKey,
          });

          res.data.data = JSON.parse(decryptRes.decryptedText);
        }
      }

      return res;
    } catch (err) {
      logError("ERROR", {
        message: "Response interceptor error",
        error: err,
        context: res.config.url,
      });
      throw new InternalApplicationError(
        "Response interceptor error",
        "AxiosResponseInterceptor",
        err,
      );
    }
  },
  async (err) => {
    // Error handling
    if (globalDispatch) {
      handleErrors(err, globalDispatch);
    }
    return Promise.reject(err);
  },
);
```

**Response Interceptor Flow:**

1. Check if response data is encrypted
2. Get AES key and IV from storage/cache
3. Decrypt response data
4. Parse JSON
5. Handle errors through centralized handler

#### Custom Base Query for RTK Query

```typescript
export const axiosBaseQuery =
  (axiosInstance: AxiosInstance) =>
  async ({
    url,
    method,
    data,
    params,
    headers,
  }: {
    url: string;
    method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
    data?: unknown;
    params?: unknown;
    headers?: AxiosRequestConfig["headers"];
  }) => {
    try {
      const result = await axiosInstance.request({
        url:
          `${API_BASE}${url}` ||
          `${sessionStorage.getItem("dnsBaseUrl")}${url}`,
        method,
        data,
        params,
        ...(headers && { headers }),
      });
      return { data: result.data };
    } catch (err) {
      logError("ERROR", {
        message: "Axios base query error",
        error: err,
        context: url,
      });
      return {
        error: {
          status: err.response?.status || 500,
          data: err.response?.data || err.message,
        },
      };
    }
  };
```

**Base Query Purpose:**

- Integrate Axios with RTK Query
- Handle request/response flow
- Provide error handling
- Support dynamic base URL

### API Constants

**File:** `src/configs/constants.ts`

```typescript
// CONSTANT ROUTES
export const CONFIG_URL = "/api/v1/config";
export const HELPER_URL = "/api/v1/helper";
export const USER_URL = "/api/v1/user";
```

**Guidelines:**

- Use constants for all API URLs
- Organize by domain/feature
- Export from single file
- Use descriptive names

---

## 🧩 Component Development

### Component Structure

#### Functional Component Pattern

```typescript
import React, { useState } from 'react'
import CustomInput from '../common/CustomInput'
import CustomButton from '../common/CustomButton'

export default function SignInPage() {
  // 1. Hooks (useState, useEffect, custom hooks)
  const [showPassword, setShowPassword] = useState<boolean>(false)

  // 2. API calls (RTK Query hooks)
  const [signIn, { isLoading, error, data }] = useSignInMutation()

  // 3. Form handling (React Hook Form)
  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(validationSchema),
    mode: 'onTouched',
    reValidateMode: 'onChange',
  })

  // 4. Event handlers
  const onSubmit = async (formData: FormData) => {
    try {
      const response = await signIn(formData).unwrap()
      console.log('Success:', response)
    } catch (err) {
      console.log('Error:', err)
    }
  }

  // 5. Render
  return (
    <div className="signinPage-wrapper">
      <form onSubmit={handleSubmit(onSubmit)}>
        <CustomInput
          id="email"
          label="Email"
          type="email"
          error={errors?.email?.message}
          {...register("email")}
        />
        <CustomButton
          label="Sign In"
          showButtonLoader={isLoading}
        />
      </form>
    </div>
  )
}
```

**Component Order:**

1. Imports
2. Type definitions
3. Component function
4. Hooks (state, effects, custom hooks)
5. API calls
6. Form handling
7. Event handlers
8. Helper functions
9. Return JSX

### ForwardRef Pattern

For components that need ref access:

```typescript
import React, { forwardRef, type InputHTMLAttributes } from 'react'

interface CustomInputPropsTypes extends InputHTMLAttributes<HTMLInputElement> {
    id: string
    label: string
    type: string
    placeholder: string
    error?: string | undefined
    hint?: string
}

const CustomInput = forwardRef<HTMLInputElement, CustomInputPropsTypes>((props, ref) => {
    const { id, label, type, placeholder, error, hint, ...restAttributes } = props

    return (
        <div className="input-container">
            <label htmlFor={id}>{label}</label>
            <input
                ref={ref}
                id={id}
                type={type}
                placeholder={placeholder}
                aria-invalid={error ? true : false}
                {...restAttributes}
            />
            {error && <p className="input-error">{error}</p>}
            {hint && !error && <p className="input-hint">{hint}</p>}
        </div>
    )
})

export default CustomInput
```

**ForwardRef Guidelines:**

1. Use when component needs ref (forms, inputs)
2. Properly type both ref and props
3. Spread remaining props with `{...restAttributes}`
4. Handle props destruction carefully

### Conditional Rendering with Activity Component

This project uses React 19's `Activity` component for conditional rendering:

```typescript
import { Activity } from 'react'

<Activity mode={isVisible ? 'visible' : 'hidden'}>
  <div>Content to show/hide</div>
</Activity>
```

**Activity Component Benefits:**

- Better performance than conditional operators
- Maintains component state when hidden
- Cleaner syntax than `{condition && <Component />}`

### Component Props Best Practices

```typescript
// ✅ Good - Extend HTML attributes
interface CustomInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
}

// ✅ Good - Use descriptive prop names
<CustomInput
  id="email-input"
  label="Email Address"
  placeholder="Enter your email"
  error={errors.email?.message}
/>

// ✅ Good - Optional props with default values
interface ButtonProps {
  label: string
  variant?: 'primary' | 'secondary'  // Optional with type
  isLoading?: boolean
}

// ✅ Good - Spread remaining props
const CustomInput = ({ label, error, ...restProps }: CustomInputProps) => (
  <div>
    <label>{label}</label>
    <input {...restProps} />
  </div>
)
```

---

## 🛤 Routing Implementation

### Router Configuration

**File:** `src/routes/router.ts`

```typescript
import { createBrowserRouter } from "react-router";
import App from "../App";
import AuthLayout from "../layouts/AuthLayout";
import SignInPage from "../components/auth/SignInPage";
import SignUpPage from "@/components/auth/SignUpPage";
import ServiceUnavailable503 from "@/components/common/ServiceUnavailable503";

const router = createBrowserRouter([
  {
    path: "/",
    Component: App,
    children: [
      {
        path: "serviceUnavailable",
        Component: ServiceUnavailable503,
      },
      {
        Component: AuthLayout,
        children: [
          {
            index: true,
            Component: SignInPage,
          },
          {
            path: "signup",
            Component: SignUpPage,
          },
        ],
      },
    ],
  },
]);

export default router;
```

**Routing Structure:**

```
/ (App - Root)
├── /serviceUnavailable (Error page)
└── / (AuthLayout)
    ├── / (index - SignInPage)
    └── /signup (SignUpPage)
```

### Router Integration

**File:** `src/main.tsx`

```typescript
import { StrictMode } from 'react'
import ReactDOM from "react-dom/client";
import { RouterProvider } from 'react-router-dom'
import { Provider } from 'react-redux';
import router from './routes/router.ts';
import { store, storeDispatch } from './redux/sotre.ts';
import { setAxiosDispatch } from './configs/axiosConfig.ts';
import 'react-toastify/dist/ReactToastify.css';

// Set Global Store Dispatch for Axios
setAxiosDispatch(storeDispatch);

const root: HTMLElement | null = document.getElementById("root");

if (!root) {
  throw new Error("Root element not found");
}

ReactDOM.createRoot(root).render(
  <StrictMode>
    <Provider store={store}>
      <RouterProvider router={router} />
    </Provider>
  </StrictMode>
)
```

**Key Points:**

1. Wrap with Redux Provider first
2. Use RouterProvider with configured router
3. Set global dispatch for axios interceptors
4. Import global styles (Toastify CSS)

### Root App Component

**File:** `src/App.tsx`

```typescript
import { Outlet } from 'react-router'
import { ToastContainer } from "react-toastify"
import { useDispatch, useSelector } from 'react-redux'
import DestroySession from './components/common/DestroySession'
import Banner from './components/common/Banner'

function App() {
  const dispatch = useDispatch()

  // Global state for UI components
  const showDestroySession = useSelector(selectShowDestroySession)
  const destroySessionParams = useSelector(selectDestroySessionParams)
  const showErrorBanner = useSelector(selectShowErrorBanner)
  const showInfoBanner = useSelector(selectShowInfoBanner)
  const bannerMessage = useSelector(selectMessageBanner)

  return (
    <>
      {/* Toast Notifications */}
      <ToastContainer
        position="top-right"
        autoClose={5000}
        theme="dark"
      />

      {/* Global Banner */}
      <Activity mode={(showErrorBanner || showInfoBanner) ? 'visible' : 'hidden'}>
        <Banner
          message={bannerMessage ?? ""}
          variant={showErrorBanner ? "ERROR" : "INFO"}
          onDismiss={() => dispatch(clearBanner())}
        />
      </Activity>

      {/* Destroy Session Modal */}
      <Activity mode={showDestroySession ? 'visible' : 'hidden'}>
        <DestroySession
          title={destroySessionParams?.title ?? ""}
          type={destroySessionParams?.type ?? "DEFAULT"}
        />
      </Activity>

      {/* Render child routes */}
      <div className="application-container">
        <Outlet />
      </div>
    </>
  )
}

export default App
```

**App Component Responsibilities:**

- Global UI components (Toast, Banner, Modals)
- Render child routes via `<Outlet />`
- Manage global state subscriptions

### Layout Components

**File:** `src/layouts/AuthLayout.tsx`

```typescript
import { useState, Activity, useEffect } from "react"
import { useNavigate } from "react-router"
import { useGetDnsConfigQuery } from "@/redux/features/config/configApi"
import HourGlassLoader from "../components/common/loaders/HourGlassLoader"
import AuthPage from "../pages/AuthPage"

export default function AuthLayout() {
  const navigate = useNavigate()
  const [displayPageLoader, setDisplayPageLoader] = useState(true)

  // Fetch DNS config
  const { data, isLoading, isSuccess, error, isError } = useGetDnsConfigQuery({
      domainName: 'business.banking-management.com',
  })

  useEffect(() => {
      if (isError) {
          navigate("/serviceUnavailable")
      }
  }, [isError, navigate])

  // Loader display logic
  useEffect(() => {
    const timer = setTimeout(() => {
      setDisplayPageLoader(false)
    }, 3000)

    if (isSuccess && data) {
      clearTimeout(timer)
      setDisplayPageLoader(false)
    }

    return () => clearTimeout(timer)
  }, [data, isSuccess])

  return (
    <>
      {/* Loading State */}
      <Activity mode={displayPageLoader ? 'visible' : 'hidden'}>
        <HourGlassLoader />
      </Activity>

      {/* Content */}
      <Activity mode={!displayPageLoader ? 'visible' : 'hidden'}>
        <AuthPage />
      </Activity>
    </>
  )
}
```

**Layout Guidelines:**

1. Handle initial data fetching
2. Show loading states
3. Handle errors (redirect to error pages)
4. Render page content when ready
5. Use timeouts to prevent infinite loading

### Navigation

```typescript
import { Link, useNavigate } from 'react-router'

function MyComponent() {
  const navigate = useNavigate()

  // Declarative navigation
  return <Link to="/signup">Sign Up</Link>

  // Programmatic navigation
  const handleClick = () => {
    navigate('/dashboard')
  }

  // Navigate with state
  navigate('/profile', { state: { from: 'login' } })
}
```

---

## 📝 Form Handling

### React Hook Form + Zod Pattern

The application uses **React Hook Form** for form state and **Zod** for validation.

#### Complete Form Example

```typescript
import { useForm, Controller, type SubmitHandler } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

export default function SignUpPage() {
    // 1. Define Zod validation schema
    const signupFormValidationSchema = z.object({
        fullName: z
            .string()
            .min(4, "Full name must be at least 4 characters")
            .regex(/^[A-Za-z0-9 .'-]+$/, "Invalid characters in name"),

        email: z
            .string()
            .email("Invalid email"),

        password: z
            .string()
            .min(8, 'Password must be at least 8 characters')
            .regex(/[A-Z]/, 'Must contain uppercase')
            .regex(/[a-z]/, 'Must contain lowercase')
            .regex(/\d/, 'Must contain digit')
            .regex(/[!@#$%^&*]/, 'Must contain special character'),

        confirmPassword: z
            .string()
            .min(1, "Confirm password is required"),

        gender: z
            .string()
            .min(1, "Please select a gender"),

        dateOfBirth: z
            .date()
            .refine((date) => {
                const today = new Date()
                const minDate = new Date(
                    today.getFullYear() - 18,
                    today.getMonth(),
                    today.getDate()
                )
                return date <= minDate
            }, {
                message: "You must be at least 18 years old",
            }),
    }).refine((d) => d.password === d.confirmPassword, {
        message: 'Passwords do not match',
        path: ['confirmPassword'],
    })

    // 2. Infer TypeScript type from schema
    type SignupFormData = z.infer<typeof signupFormValidationSchema>

    // 3. Initialize React Hook Form
    const {
        register,
        handleSubmit,
        watch,
        control,
        formState: { errors },
        reset
    } = useForm<SignupFormData>({
        resolver: zodResolver(signupFormValidationSchema),
        mode: 'onTouched',
    reValidateMode: 'onChange',
    })

    // 4. API mutation hook
    const [signUp, { isLoading }] = useSignUpMutation()

    // 5. Submit handler
    const onSubmit: SubmitHandler<SignupFormData> = async (formData) => {
        try {
            const response = await signUp(formData).unwrap()
            console.log('Success:', response)
            reset() // Reset form after success
        } catch (error) {
            console.log('Error:', error)
        }
    }

    // 6. Watch field for real-time validation
    const password = watch("password")

    return (
        <form onSubmit={handleSubmit(onSubmit)}>
            {/* Regular input with register */}
            <CustomInput
                id="fullName"
                label="Full Name"
                type="text"
                placeholder="Enter full name"
                error={errors?.fullName?.message}
                {...register("fullName")}
            />

            {/* Password input with watch */}
            <CustomPasswordInput
                id="password"
                label="Password"
                type="password"
                placeholder="••••••••"
                password={password}
                error={errors?.password?.message}
                {...register("password")}
            />

            {/* Controlled component with Controller */}
            <Controller
                name="gender"
                control={control}
                defaultValue=""
                render={({ field }) => (
                    <CustomSelect
                        id="gender"
                        label="Select Gender"
                        labels={["Male", "Female", "Other"]}
                        value={field.value}
                        onChange={field.onChange}
                        error={errors?.gender?.message}
                    />
                )}
            />

            {/* Date picker with Controller */}
            <Controller
                name="dateOfBirth"
                control={control}
                render={({ field }) => (
                    <CustomDatePicker
                        id="dateOfBirth"
                        label="Date of Birth"
                        date={field.value}
                        setDate={field.onChange}
                        max={new Date()}
                        error={errors?.dateOfBirth?.message}
                    />
                )}
            />

            <CustomButton
                label="Sign Up"
                showButtonLoader={isLoading}
            />
        </form>
    )
}
```

### Validation Patterns

#### Common Zod Validators

```typescript
// String validations
z.string().min(4, "Min 4 characters");
z.string().max(50, "Max 50 characters");
z.string().email("Invalid email");
z.string().regex(/pattern/, "Must match pattern");

// Number validations
z.number().min(18, "Must be at least 18");
z.number().max(100, "Must be at most 100");
z.number().positive("Must be positive");
z.number().int("Must be integer");

// Date validations
z.date();
z.date().min(new Date("2000-01-01"));
z.date().max(new Date());

// Custom refine for complex validation
z.string().refine((val) => val !== "admin", {
  message: "Username cannot be 'admin'",
});

// Multiple field validation
z.object({
  password: z.string(),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});
```

#### Password Validation Pattern

```typescript
const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain an uppercase letter")
  .regex(/[a-z]/, "Password must contain a lowercase letter")
  .regex(/\d/, "Password must contain a digit")
  .regex(/[!@#$%^&*]/, "Password must contain a special character");
```

#### Phone Number Validation

```typescript
const phoneSchema = z
  .string()
  .min(4, "Phone number must be at least 4 digits")
  .max(15, "Phone number can be maximum 15 digits")
  .regex(/^[0-9]+$/, "Phone number must contain only digits");
```

### Form State Management

```typescript
const {
  register, // Register input fields
  handleSubmit, // Handle form submission
  watch, // Watch field values in real-time
  control, // Control for Controller component
  formState, // Form state (errors, isDirty, isValid, etc.)
  reset, // Reset form
  setValue, // Set field value programmatically
  getValues, // Get current form values
} = useForm<FormData>({
  resolver: zodResolver(validationSchema),
  mode: "onTouched",
  reValidateMode: "onChange",
  defaultValues: {
    email: "",
    password: "",
  },
});
```

### Error Handling in Forms

```typescript
// Display validation errors
{errors?.email?.message && (
    <p className="error-text">{errors.email.message}</p>
)}

// Handle API errors
const onSubmit = async (data) => {
    try {
        await signUp(data).unwrap()
    } catch (err) {
        // Show toast notification
        toast.error(err?.data?.message || "Sign up failed")

        // Or set form errors manually
        setError("email", {
            type: "manual",
            message: "Email already exists"
        })
    }
}
```

### Multi-Step Form Pattern

```typescript
export default function SignUpPage() {
    const [formStep, setFormStep] = useState<number>(1)

    const onError = (errors) => {
        // Check if step 1 fields have errors
        const step1Fields = ["fullName", "email", "password", "confirmPassword", "gender"]
        const hasStep1Error = step1Fields.some((field) => errors[field])

        if (hasStep1Error) {
            setFormStep(1)  // Go back to step 1
        }
    }

    return (
        <form onSubmit={handleSubmit(onValid, onError)}>
            {/* Step 1 */}
            <Activity mode={formStep === 1 ? 'visible' : 'hidden'}>
                <div>
                    {/* Step 1 fields */}
                    <button onClick={() => setFormStep(2)}>Next</button>
                </div>
            </Activity>

            {/* Step 2 */}
            <Activity mode={formStep === 2 ? 'visible' : 'hidden'}>
                <div>
                    {/* Step 2 fields */}
                    <button type="submit">Submit</button>
                    <button onClick={() => setFormStep(1)}>Back</button>
                </div>
            </Activity>
        </form>
    )
}
```

---

## 🚨 Error Handling

### Error Architecture

The application uses a **centralized error handling system** with:

1. Custom error classes
2. Centralized error handler
3. RTK Query error mapper
4. Error logging utility
5. User-facing error display (banners, toasts, modals)

### Custom Error Classes

**File:** `src/errorHandling/error.ts`

```typescript
// Base application error
export class ApplicationError extends Error {
  constructor(
    message: string,
    public service?: string,
    public originalError?: any,
  ) {
    super(message);
    this.name = "ApplicationError";
  }
}

// Service-level errors
export class ApplicationServiceError extends ApplicationError {
  constructor(message: string, service?: string, originalError?: any) {
    super(message, service, originalError);
    this.name = "ApplicationServiceError";
  }
}

// Internal errors
export class InternalApplicationError extends ApplicationError {
  constructor(message: string, service?: string, originalError?: any) {
    super(message, service, originalError);
    this.name = "InternalApplicationError";
  }
}
```

### Centralized Error Handler

**File:** `src/errorHandling/handleErrors.ts`

```typescript
import axios, { AxiosError } from "axios";
import { toast } from "react-toastify";
import {
  setShowErrorBanner,
  setShowInfoBanner,
  triggerDestroySession,
} from "@/redux/slice/utility/utilitySlice";

const handleErrors = (error: unknown, dispatch: any): never => {
  // Axios error handling
  if (axios.isAxiosError(error)) {
    const err = error as AxiosError<any>;
    const statusCode = err.response?.status;
    const status = err.response?.data?.status;
    const message = err.response?.data?.message || err.message;

    switch (statusCode) {
      case 400:
        console.error("BAD_REQUEST", err);
        throw error;

      case 401:
        console.error("UNAUTHENTICATED", err);
        if (status === "UNAUTHENTICATED") {
          dispatch(
            triggerDestroySession({
              title: "Unauthenticated Session",
              type: "DEFAULT",
            }),
          );
        }
        throw error;

      case 403:
        console.error("FORBIDDEN", err);
        dispatch(
          triggerDestroySession({
            title: "Forbidden Session Access",
            type: "DEFAULT",
          }),
        );
        throw error;

      case 404:
        console.error("NOT_FOUND", err);
        dispatch(setShowInfoBanner("Resource not found"));
        throw error;

      case 429:
        console.error("SERVICE_TIMEOUT", err);
        dispatch(
          triggerDestroySession({
            title: "Session Expiring",
            type: "SESSION_INACTIVITY",
          }),
        );
        throw error;

      case 500:
        console.error("INTERNAL_SERVER_ERROR", err);
        dispatch(setShowErrorBanner("Internal server error"));
        throw error;

      case 503:
        console.error("SERVICE_UNAVAILABLE", err);
        dispatch(setShowErrorBanner("Service unavailable"));
        throw error;

      default:
        console.error("UNKNOWN_ERROR", err);
        dispatch(setShowErrorBanner("An error occurred"));
        throw new AppErrorClass(
          statusCode || 500,
          status || "INTERNAL_SERVER_ERROR",
          message,
          err.response?.data,
        );
    }
  }

  // Non-Axios errors
  if (error instanceof Error) {
    console.error("APPLICATION_SERVICE_ERROR", error);
    dispatch(setShowErrorBanner("Application error"));
    throw new AppErrorClass(
      601,
      "APPLICATION_SERVICE_ERROR",
      error.message,
      error,
    );
  }

  // Unknown errors
  console.error("INTERNAL_APPLICATION_ERROR", error);
  dispatch(setShowErrorBanner("Internal error"));
  throw new AppErrorClass(
    600,
    "INTERNAL_APPLICATION_ERROR",
    "Unknown error occurred",
    error,
  );
};

export default handleErrors;
```

**Error Handler Features:**

- HTTP status code mapping
- Redux action dispatching for UI updates
- Session management (logout on 401/403/429)
- User-friendly error messages
- Console logging for debugging

### RTK Query Error Handling

**File:** `src/errorHandling/rtkQueryCatchError.ts`

```typescript
import mapToRtkError from "./mapToRtkError";
import { logError } from "./errorLogger";
import { ApplicationServiceError } from "./error";

const rtkQueryCatchError = (err: any, queryName: string) => {
  const error = err as any;
  const url = error?.config?.url || error?.url || "UNKNOWN_URL";

  logError("ERROR", {
    message: `${queryName} query faced error`,
    error: err,
    context: url,
  });

  const rtkError = mapToRtkError(err, queryName);
  return rtkError;
};

export default rtkQueryCatchError;
```

### Error Logging

**File:** `src/errorHandling/errorLogger.ts`

```typescript
type LogLevel = "INFO" | "WARN" | "ERROR" | "DEBUG";

interface LogOptions {
  message: string;
  error?: any;
  context?: string;
}

export const logError = (level: LogLevel, options: LogOptions) => {
  const { message, error, context } = options;

  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level}] ${message}`;

  if (context) {
    console.log(`Context: ${context}`);
  }

  switch (level) {
    case "ERROR":
      console.error(logMessage, error);
      break;
    case "WARN":
      console.warn(logMessage, error);
      break;
    case "INFO":
      console.info(logMessage);
      break;
    case "DEBUG":
      console.debug(logMessage, error);
      break;
  }

  // In production, send to logging service
  // Example: sendToSentry(level, message, error, context)
};
```

### Error Display Components

#### Banner Component

```typescript
// Utility slice manages banner state
export const setShowErrorBanner = (state, action: PayloadAction<string>) => {
    state.showErrorBanner = true
    state.showInfoBanner = false
    state.bannerMessage = action.payload
}

// Usage in App.tsx
const showErrorBanner = useSelector(selectShowErrorBanner)
const bannerMessage = useSelector(selectMessageBanner)

<Banner
    message={bannerMessage}
    variant={showErrorBanner ? "ERROR" : "INFO"}
    onDismiss={() => dispatch(clearBanner())}
/>
```

#### Toast Notifications

```typescript
import { toast } from "react-toastify";

// Success
toast.success("Operation successful");

// Error
toast.error("Operation failed");

// Warning
toast.warn("Please verify your input");

// Info
toast.info("Processing your request");
```

#### Destroy Session Modal

```typescript
// Triggered for session-related errors
dispatch(
  triggerDestroySession({
    title: "Session Expired",
    type: "SESSION_INACTIVITY",
  }),
);

// Modal handles logout and redirect
```

---

## 🔒 Security Patterns

### Encryption Architecture

The application implements **end-to-end encryption** for API communication:

1. **AES-256** - Symmetric encryption for payload data
2. **RSA-2048** - Asymmetric encryption for AES keys and IVs
3. **Initialization Vector (IV)** - Unique per request for AES encryption

### Encryption Flow

#### Request Encryption

```
1. Generate random IV (12 bytes)
2. Get/fetch AES key and RSA public key
3. Encrypt IV with RSA → encryptedPayload1
4. Encrypt request data with AES → encryptedPayload2
5. Send both encrypted payloads to server
6. Store IV for response decryption
```

#### Response Decryption

```
1. Receive encrypted response
2. Retrieve IV from request context
3. Decrypt response with AES using IV
4. Parse JSON data
```

### Encryption Implementation

#### AES Encryption

**File:** `src/utils/aesEncryption.ts`

```typescript
export const aesEncryption = async (
  aesEncryptionKeyHex: string,
  payload: any,
  ivHex: string,
) => {
  // Convert hex key to bytes
  const keyBytes = new Uint8Array(
    aesEncryptionKeyHex.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16)),
  );

  // Convert hex IV to bytes
  const ivBytes = new Uint8Array(
    ivHex.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16)),
  );

  // Import key
  const cryptoKey = await window.crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "AES-GCM" },
    false,
    ["encrypt"],
  );

  // Encrypt
  const encoder = new TextEncoder();
  const plaintext = encoder.encode(JSON.stringify(payload));

  const ciphertext = await window.crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: ivBytes,
    },
    cryptoKey,
    plaintext,
  );

  // Convert to hex
  const ciphertextHex = Array.from(new Uint8Array(ciphertext))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return { ciphertextHex };
};
```

#### AES Decryption

**File:** `src/utils/aesDecryption.ts`

```typescript
export const aesDecryption = async ({
  cipherTextHex,
  ivHex,
  aesEncryptionKeyHex,
}: {
  cipherTextHex: string;
  ivHex: string;
  aesEncryptionKeyHex: string;
}) => {
  // Convert hex strings to bytes
  const keyBytes = hexToBytes(aesEncryptionKeyHex);
  const ivBytes = hexToBytes(ivHex);
  const cipherBytes = hexToBytes(cipherTextHex);

  // Import key
  const cryptoKey = await window.crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "AES-GCM" },
    false,
    ["decrypt"],
  );

  // Decrypt
  const plaintext = await window.crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: ivBytes,
    },
    cryptoKey,
    cipherBytes,
  );

  // Convert to string
  const decoder = new TextDecoder();
  const decryptedText = decoder.decode(plaintext);

  return { decryptedText };
};
```

#### RSA Encryption

**File:** `src/utils/rsaEncryption.ts`

```typescript
export const rsaEncryption = async (payload: any, publicKeyPem: string) => {
  // Convert PEM to binary
  const pemContents = publicKeyPem
    .replace(/-----BEGIN PUBLIC KEY-----/, "")
    .replace(/-----END PUBLIC KEY-----/, "")
    .replace(/\s/g, "");

  const binaryString = atob(pemContents);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  // Import public key
  const publicKey = await window.crypto.subtle.importKey(
    "spki",
    bytes,
    {
      name: "RSA-OAEP",
      hash: "SHA-256",
    },
    false,
    ["encrypt"],
  );

  // Encrypt
  const encoder = new TextEncoder();
  const plaintext = encoder.encode(JSON.stringify(payload));

  const ciphertext = await window.crypto.subtle.encrypt(
    { name: "RSA-OAEP" },
    publicKey,
    plaintext,
  );

  // Convert to base64
  const ciphertextBase64 = btoa(
    String.fromCharCode(...new Uint8Array(ciphertext)),
  );

  return { ciphertextBase64 };
};
```

### Key Management

#### Fetching Encryption Keys

**File:** `src/services/getEncryptionKeys.ts`

```typescript
import { configApis } from "@/redux/features/config/configApi";
import { store } from "@/redux/sotre";

export const getAesEncryptionKey = async (): Promise<string | null> => {
  try {
    // Check session storage first
    const cachedKey = sessionStorage.getItem("keyHex");
    if (cachedKey) return cachedKey;

    // Fetch from API
    const result = await store.dispatch(
      configApis.endpoints.getAesEncryptionKey.initiate(),
    );

    if (result.isSuccess) {
      const key = result.data?.data?.key;
      sessionStorage.setItem("keyHex", key);
      return key;
    }

    return null;
  } catch (error) {
    console.error("Failed to get AES key:", error);
    return null;
  }
};

export const getRsaPublicKey = async (): Promise<string | null> => {
  try {
    // Check session storage first
    const cachedKey = sessionStorage.getItem("publicKey");
    if (cachedKey) return cachedKey;

    // Fetch from API
    const result = await store.dispatch(
      configApis.endpoints.getRsaEncryptionPublicKey.initiate(),
    );

    if (result.isSuccess) {
      const key = result.data?.data?.key;
      sessionStorage.setItem("publicKey", key);
      return key;
    }

    return null;
  } catch (error) {
    console.error("Failed to get RSA key:", error);
    return null;
  }
};
```

**Key Management Guidelines:**

1. Cache keys in sessionStorage
2. Fetch keys on first request
3. Re-fetch on login/signup
4. Clear on logout
5. Never log keys to console in production

### Device Fingerprinting

**File:** `src/utils/GetDeviceId.ts`

```typescript
import FingerprintJS from "@fingerprintjs/fingerprintjs";

const GetDeviceId = async (): Promise<string> => {
  try {
    // Check cache
    let deviceId = sessionStorage.getItem("deviceId");

    if (!deviceId) {
      // Generate fingerprint
      const fp = await FingerprintJS.load();
      const result = await fp.get();
      deviceId = result.visitorId;

      // Cache it
      sessionStorage.setItem("deviceId", deviceId);
    }

    return deviceId;
  } catch (error) {
    console.error("Failed to get device ID:", error);
    return "unknown-device";
  }
};

export default GetDeviceId;
```

**Device ID Usage:**

- Added to every API request header
- Used for fraud detection
- Tracks user sessions
- Cached for performance

### Security Best Practices

```typescript
// ✅ DO: Use HTTPS in production
const API_BASE =
  window.location.protocol === "https:"
    ? "https://api.example.com"
    : "http://localhost:3000";

// ✅ DO: Clear sensitive data on logout
localStorage.clear();
sessionStorage.clear();

// ✅ DO: Include credentials for cookies
axios.create({ withCredentials: true });

// ✅ DO: Validate on client AND server
const schema = z.string().email(); // Client-side
// Server validates again

// ❌ DON'T: Store sensitive data in localStorage
// ❌ localStorage.setItem('password', password)

// ❌ DON'T: Log sensitive data
// ❌ console.log('Password:', password)

// ❌ DON'T: Trust client-side validation alone
// Always validate on server

// ✅ DO: Use environment variables for secrets
const API_KEY = import.meta.env.VITE_API_KEY;
```

---

## ⚙️ TypeScript Configuration

### Path Aliases

**File:** `vite.config.ts`

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

**File:** `tsconfig.json` & `tsconfig.app.json`

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

**Usage:**

```typescript
// ✅ With alias
import { userApis } from "@/redux/features/user/userApi";
import { cn } from "@/lib/utils";
import CustomButton from "@/components/common/CustomButton";

// ❌ Without alias (relative paths)
import { userApis } from "../../../redux/features/user/userApi";
import { cn } from "../../../lib/utils";
import CustomButton from "../../common/CustomButton";
```

### TypeScript Configuration

**File:** `tsconfig.app.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",

    /* Type Checking */
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "forceConsistentCasingInFileNames": true,

    /* Bundler */
    "jsx": "react-jsx",
    "allowImportingTsExtensions": true,
    "verbatimModuleSyntax": true,
    "noEmit": true,

    /* Paths */
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### Type Safety Best Practices

```typescript
// ✅ DO: Define interfaces for all data structures
interface UserDetails {
  id: string;
  name: string;
  email: string;
}

// ✅ DO: Type function parameters and return values
function getUserById(id: string): Promise<UserDetails> {
  // implementation
}

// ✅ DO: Use generics for reusable types
interface ApiResponse<T> {
  status: string;
  data: T;
}

// ✅ DO: Use type inference from Zod schemas
const schema = z.object({
  name: z.string(),
  age: z.number(),
});
type FormData = z.infer<typeof schema>;

// ✅ DO: Type Redux state and dispatch
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// ✅ DO: Use const assertions for literal types
const ROLES = ["admin", "user", "guest"] as const;
type Role = (typeof ROLES)[number]; // 'admin' | 'user' | 'guest'

// ❌ DON'T: Use 'any' type
// const data: any = {}  // Avoid!

// ✅ DO: Use 'unknown' for unknown types
const data: unknown = await fetchData();
if (typeof data === "object" && data !== null) {
  // Type guard
}

// ✅ DO: Use utility types
type PartialUser = Partial<UserDetails>;
type ReadonlyUser = Readonly<UserDetails>;
type UserKeys = keyof UserDetails;
```

---

## 🚀 Development Workflow

### Environment Setup

**File:** `.env`

```env
VITE_REACT_ENV="DEVELOPMENT"
VITE_DNS_BASE_URL="http://localhost:3000"
VITE_DNS_X_API_KEY="your-api-key-here"
```

**Environment Variable Guidelines:**

1. Prefix with `VITE_` for Vite to expose them
2. Never commit `.env` to version control
3. Use different values for dev/staging/production
4. Document all required variables in README

**Accessing Environment Variables:**

```typescript
const ENV = import.meta.env.VITE_REACT_ENV;
const API_URL = import.meta.env.VITE_DNS_BASE_URL;
const API_KEY = import.meta.env.VITE_DNS_X_API_KEY;

// Type-safe environment variables
interface ImportMetaEnv {
  readonly VITE_REACT_ENV: string;
  readonly VITE_DNS_BASE_URL: string;
  readonly VITE_DNS_X_API_KEY: string;
}
```

### NPM Scripts

**File:** `package.json`

```json
{
  "scripts": {
    "dev": "vite", // Start dev server
    "build": "tsc -b && vite build", // Build for production
    "lint": "eslint .", // Lint code
    "preview": "vite preview" // Preview production build
  }
}
```

**Script Usage:**

```bash
# Development
npm run dev          # Start dev server at http://localhost:5173

# Production Build
npm run build        # Creates optimized build in /dist

# Linting
npm run lint         # Check code quality

# Preview
npm run preview      # Preview production build locally
```

### Project Initialization Checklist

When starting a new project with this architecture:

#### 1. **Install Dependencies**

```bash
npm install
```

#### 2. **Configure Environment**

```bash
# Create .env file
cp .env.example .env

# Update values
VITE_REACT_ENV="DEVELOPMENT"
VITE_DNS_BASE_URL="http://localhost:3000"
```

#### 3. **Setup Git**

```bash
git init
git add .
git commit -m "Initial commit"
```

#### 4. **Install Shadcn Components (as needed)**

```bash
npx shadcn@latest add button
npx shadcn@latest add input
npx shadcn@latest add select
# etc.
```

#### 5. **Configure TypeScript**

- Verify `tsconfig.json` paths match your project
- Ensure `@/*` alias is configured in both `vite.config.ts` and `tsconfig.json`

#### 6. **Setup Redux Store**

```typescript
// 1. Create store file
// 2. Add slices
// 3. Add RTK Query APIs
// 4. Wrap app with Provider
```

#### 7. **Configure Axios**

```typescript
// 1. Create axios instance
// 2. Setup interceptors
// 3. Integrate with RTK Query
```

#### 8. **Setup Routing**

```typescript
// 1. Define routes
// 2. Create layouts
// 3. Integrate with RouterProvider
```

---

## ✨ Best Practices

### Code Organization

```typescript
// ✅ DO: Group imports logically
// 1. React imports
import React, { useState, useEffect } from "react";

// 2. Third-party libraries
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// 3. Redux/state management
import { useAppDispatch, useAppSelector } from "@/redux/hooks/reduxHooks";
import { selectUserDetails } from "@/redux/slice/user/userSlice";
import { useSignInMutation } from "@/redux/features/user/userApi";

// 4. Local components
import CustomInput from "../common/CustomInput";
import CustomButton from "../common/CustomButton";

// 5. Utils and types
import { validatePassword } from "@/utils/validatePassword";
import type { UserDetails } from "@/types";
```

### Component Best Practices

```typescript
// ✅ DO: Use descriptive component names
function UserProfileCard() { }

// ✅ DO: Keep components focused (single responsibility)
function UserAvatar() { }      // Only handles avatar
function UserName() { }        // Only handles name display

// ✅ DO: Extract complex logic to custom hooks
function useUserAuthentication() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  // ... authentication logic
  return { isAuthenticated, login, logout }
}

// ✅ DO: Use composition over prop drilling
<UserContext.Provider value={user}>
  <UserProfile />
</UserContext.Provider>

// ✅ DO: Memoize expensive computations
const sortedUsers = useMemo(() => {
  return users.sort((a, b) => a.name.localeCompare(b.name))
}, [users])

// ✅ DO: Use callback memoization for event handlers
const handleClick = useCallback(() => {
  // Handler logic
}, [dependencies])
```

### State Management Best Practices

```typescript
// ✅ DO: Keep state close to where it's used
function UserProfile() {
  const [isEditing, setIsEditing] = useState(false); // Local state
  // ...
}

// ✅ DO: Use Redux for global/shared state
const userDetails = useAppSelector(selectUserDetails); // Global state

// ✅ DO: Use RTK Query for server state
const { data, isLoading, error } = useGetUserQuery(userId);

// ✅ DO: Normalize data in Redux
const usersById = {
  "1": { id: "1", name: "John" },
  "2": { id: "2", name: "Jane" },
};

// ❌ DON'T: Duplicate server data in Redux
// If using RTK Query, don't also store in slice

// ✅ DO: Use selectors for derived state
export const selectActiveUsers = (state) =>
  state.users.filter((user) => user.isActive);
```

### Performance Best Practices

```typescript
// ✅ DO: Lazy load routes
const Dashboard = lazy(() => import('./pages/Dashboard'))

// ✅ DO: Use React.memo for pure components
const UserCard = React.memo(({ user }) => {
  return <div>{user.name}</div>
})

// ✅ DO: Virtualize long lists
import { FixedSizeList } from 'react-window'

// ✅ DO: Debounce search inputs
const debouncedSearch = useDebouncedValue(searchTerm, 300)

// ✅ DO: Use proper key props in lists
{users.map(user => (
  <UserCard key={user.id} user={user} />
))}

// ❌ DON'T: Use index as key
// {users.map((user, index) => <UserCard key={index} />)}
```

### Security Best Practices

```typescript
// ✅ DO: Sanitize user input
import DOMPurify from 'dompurify'
const cleanHTML = DOMPurify.sanitize(userInput)

// ✅ DO: Use HTTPS in production
const API_URL = import.meta.env.PROD
  ? 'https://api.example.com'
  : 'http://localhost:3000'

// ✅ DO: Implement proper authentication checks
const ProtectedRoute = ({ children }) => {
  const isAuthenticated = useAppSelector(selectIsAuthenticated)
  return isAuthenticated ? children : <Navigate to="/login" />
}

// ✅ DO: Clear sensitive data on logout
const logout = () => {
  localStorage.clear()
  sessionStorage.clear()
  dispatch(resetUserState())
}

// ❌ DON'T: Store passwords or tokens in localStorage
// Use httpOnly cookies instead

// ✅ DO: Validate on both client and server
const clientValidation = z.string().email()  // Client
// Server performs same validation
```

### Testing Best Practices

```typescript
// ✅ DO: Test user interactions
test('submits form when button is clicked', () => {
  render(<LoginForm />)

  fireEvent.change(screen.getByLabelText(/email/i), {
    target: { value: 'test@example.com' }
  })

  fireEvent.click(screen.getByRole('button', { name: /sign in/i }))

  expect(mockSignIn).toHaveBeenCalledWith({
    email: 'test@example.com',
    password: 'password123'
  })
})

// ✅ DO: Test error states
test('shows error message on failed login', async () => {
  mockSignIn.mockRejectedValue(new Error('Invalid credentials'))

  render(<LoginForm />)

  // ... trigger login

  expect(await screen.findByText(/invalid credentials/i)).toBeInTheDocument()
})

// ✅ DO: Test loading states
test('shows loading spinner while submitting', () => {
  render(<LoginForm />)

  // ... trigger login

  expect(screen.getByRole('status')).toBeInTheDocument()
})
```

### Accessibility Best Practices

```typescript
// ✅ DO: Use semantic HTML
<button>Click me</button>          // Not <div onclick>
<nav>Navigation</nav>              // Not <div>
<main>Main content</main>          // Not <div>

// ✅ DO: Add ARIA labels
<button aria-label="Close dialog">×</button>
<input aria-describedby="email-error" />

// ✅ DO: Support keyboard navigation
<button onKeyDown={handleKeyDown}>Action</button>

// ✅ DO: Provide alt text for images
<img src="avatar.jpg" alt="User profile picture" />

// ✅ DO: Use proper form labels
<label htmlFor="email">Email</label>
<input id="email" type="email" />

// ✅ DO: Indicate required fields
<input required aria-required="true" />

// ✅ DO: Show validation errors accessibly
<input aria-invalid={hasError} aria-describedby="error-msg" />
{hasError && <p id="error-msg" role="alert">{errorMessage}</p>}
```

### Code Review Checklist

Before committing code, verify:

- [ ] All TypeScript errors resolved
- [ ] ESLint warnings fixed
- [ ] No console.logs in production code
- [ ] Proper error handling implemented
- [ ] Loading states handled
- [ ] Edge cases considered
- [ ] Responsive design implemented
- [ ] Accessibility features included
- [ ] Security best practices followed
- [ ] Code is DRY (Don't Repeat Yourself)
- [ ] Comments added for complex logic
- [ ] File/function names are descriptive
- [ ] Imports are organized
- [ ] Unused code removed

---

## 📚 Additional Resources

### Official Documentation

- [React Documentation](https://react.dev/)
- [Redux Toolkit Documentation](https://redux-toolkit.js.org/)
- [RTK Query Documentation](https://redux-toolkit.js.org/rtk-query/overview)
- [React Router Documentation](https://reactrouter.com/)
- [React Hook Form Documentation](https://react-hook-form.com/)
- [Zod Documentation](https://zod.dev/)
- [Vite Documentation](https://vitejs.dev/)
- [TypeScript Documentation](https://www.typescriptlang.org/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)

### Key Patterns Reference

| Pattern         | Location                | Purpose               |
| --------------- | ----------------------- | --------------------- |
| Redux Slice     | `/src/redux/slice/`     | State management      |
| RTK Query API   | `/src/redux/features/`  | Data fetching         |
| Custom Hooks    | `/src/redux/hooks/`     | Typed Redux hooks     |
| Error Handling  | `/src/errorHandling/`   | Centralized errors    |
| Form Validation | Component level         | Zod + React Hook Form |
| Encryption      | `/src/utils/`           | AES/RSA encryption    |
| Routing         | `/src/routes/router.ts` | Route configuration   |
| Layouts         | `/src/layouts/`         | Page wrappers         |

---

## 🎯 Summary

This Banking Management Application demonstrates a **production-ready architecture** for building scalable React applications. Key takeaways:

### Architecture Strengths

- **Modular Design** - Feature-based folder structure for scalability
- **Type Safety** - Full TypeScript implementation with strict mode
- **State Management** - Redux Toolkit + RTK Query for efficient state handling
- **Security First** - End-to-end encryption for all API communications
- **Error Resilience** - Centralized error handling with user-friendly feedback
- **Form Excellence** - React Hook Form + Zod for robust validation
- **Performance** - Lazy loading, memoization, and optimized re-renders

### When to Use This Architecture

✅ **Use for:**

- Enterprise applications
- Banking/financial applications
- Applications requiring strong security
- Large-scale applications with complex state
- Multi-role applications
- Applications with extensive forms

❌ **Consider Alternatives for:**

- Simple landing pages (use plain React)
- Static sites (use Next.js/Gatsby)
- Mobile apps (use React Native)
- Real-time apps (consider WebSockets architecture)

---

**Version:** 1.0  
**Maintained by:** Banking Management Team  
**Last Updated:** May 2026

For questions or contributions, please refer to the project repository.
