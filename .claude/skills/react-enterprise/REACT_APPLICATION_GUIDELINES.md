# React App - Development Guidelines

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
- **TanStack Table ** - Table structure representation
- **Apache ECharts ** - Charts structure visualization
- **Tailwind CSS ** - Latest Utility-first CSS
- **shadcn/ui** - Latest UI component library
- **react-toastify ** - Latest Toast notifications

### Development Tools
- **ESLint** - Code linting
- **TypeScript ESLint** - TypeScript-specific linting

---


## Styling Rules

# Use:

* Tailwind CSS
* shadcn/ui

# Things to avoid unless absolutely necessary:

* Plain CSS
* CSS Modules
* Inline CSS styles

# Rules:

* Prefer utility-first Tailwind styling
* Avoid large custom CSS files
* Prefer reusable utility classes
* Use cn() utility for conditional classes
* Use cva() for reusable variants
* Maintain consistent spacing, typography, and sizing patterns
* Support dark mode whenever applicable
* User the shadcn/ui's to create reusable custom ui components which will wrapp the shadcn/ui's but will the the theme and colors specified by the application

---


# Portal & Overlay Rendering Rules

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

* form submissions
* profile updates
* save operations
* async UI actions
* transactional user actions

Rules:

* Prefer React Actions over manual loading state management where applicable
* Async UI mutations should use transition-based flows
* Pending states should be automatically managed whenever possible
* Avoid excessive manual `isLoading` state management inside components

---

# useTransition Rules

Use `React.useTransition()` for handling pending UI states during async actions.

Use cases:

* API-triggered UI updates
* route transitions
* form submissions
* expensive UI updates
* optimistic updates

Rules:

* Prefer `useTransition` over manual loading booleans for UI transitions
* Pending states should disable relevant UI interactions
* Maintain responsive UI during async updates
* Avoid blocking urgent UI updates

Preferred pattern:

```tsx id="b0sh4k"
const [isPending, startTransition] = useTransition();

startTransition(async () => {
  await submitData();
});
```

Avoid:

* excessive `setLoading(true/false)` patterns
* blocking UI updates unnecessarily

---

# useActionState Rules

Use `React.useActionState()` for managing async action state.

Use cases:

* form submissions
* async mutations
* validation handling
* server interaction states

Rules:

* Prefer `useActionState` for common async action flows
* Keep action handlers centralized and predictable
* Return structured action states
* Avoid scattered async mutation logic

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

* cleaner async handling
* predictable action lifecycle
* simplified pending/error management

---

# React 19 Form Actions Rules

Use React 19 native form Actions whenever applicable.

Rules:

* Prefer `<form action={serverAction}>` patterns
* Avoid unnecessary manual submit handlers
* Use native form action flows for better React integration
* Prefer uncontrolled forms when suitable
* Allow React to automatically manage form reset behavior

Preferred pattern:

```tsx id="jlwmj6"
<form action={submitAction}>
```

Avoid:

* unnecessary `onSubmit` boilerplate
* manual form serialization patterns

---

# useFormStatus Rules

Use `useFormStatus()` from `react-dom` for form pending states.

Use cases:

* disabling submit buttons
* showing form loaders
* preventing duplicate submissions

Rules:

* Prefer `useFormStatus` over manually passing loading props deeply
* Submit buttons should react automatically to pending form states
* Forms should provide proper pending UX feedback

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

* Prefer React-managed form reset flows
* Use `requestFormReset()` only when manual reset control is required
* Avoid unnecessary manual reset implementations

---

# Activity Component Rules

Use `<Activity>` to manage visibility and rendering prioritization for large UI sections.

Use cases:

* dashboards
* tab systems
* analytics pages
* large layouts
* conditional feature rendering

Rules:

* Prefer `<Activity>` over frequent mount/unmount cycles for expensive UI sections
* Use Activity to preserve state while controlling visibility
* Improve rendering prioritization for enterprise dashboards

Preferred pattern:

```tsx id="6jlwm5"
<Activity mode={isVisible ? 'visible' : 'hidden'}>
  <Page />
</Activity>
```

Benefits:

* smoother UI transitions
* preserved component state
* improved rendering prioritization

---

# useEffectEvent Rules

Use `useEffectEvent()` to separate event logic from effects.

Use cases:

* subscriptions
* websocket events
* realtime systems
* notifications
* event-driven side effects

Rules:

* Use `useEffectEvent` to avoid stale closures
* Keep effects dependency-safe
* Separate event handlers from synchronization logic
* Avoid suppressing ESLint dependency warnings

Preferred pattern:

```tsx id="jlwmw2"
const onConnected = useEffectEvent(() => {
  showNotification('Connected!', theme);
});
```

Benefits:

* cleaner effects
* proper dependency handling
* fewer stale closure bugs
* improved maintainability

---

# Modern React Rules

Rules:

* Prefer functional patterns over imperative patterns
* Prefer concurrent-friendly APIs
* Avoid legacy lifecycle-style thinking
* Prefer React-native async handling features
* Keep components responsive during async work
* Use Suspense and lazy loading where appropriate
* Prefer declarative UI flows

---

# Forbidden Legacy Patterns

Avoid unless absolutely necessary:

* excessive manual loading state handling
* deeply nested effect chains
* unnecessary imperative DOM manipulation
* duplicated async state logic
* legacy class components
* suppressing React hook dependency warnings
* blocking synchronous rendering patterns

---

# Enterprise React Performance Rules

Rules:

* Use transitions for non-urgent updates
* Keep urgent interactions responsive
* Avoid unnecessary re-renders
* Preserve UI responsiveness during async work
* Prefer progressive rendering patterns
* Use Activity boundaries for expensive UI sections
* Use lazy loading for route-level modules


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
SignInPage.tsx
CustomButton.tsx
AuthLayout.tsx

// Utilities - camelCase
aesEncryption.ts
validatePassword.ts
axiosConfig.ts

// Redux files - camelCase with descriptive suffix
userSlice.ts
userApi.ts
userThunks.ts
reduxHooks.ts

// Constants - camelCase
constants.ts

// Types/Interfaces files - camelCase with suffix
configApisDataTypes.ts
```

### Components

```typescript
// Component names - PascalCase
export default function SignInPage() { }
export default function CustomInput() { }

// Component with forwardRef - PascalCase
const CustomInput = forwardRef<HTMLInputElement, CustomInputProps>((props, ref) => {
  // implementation
})
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
function getUserDetails() { }
function handleSubmit() { }
function validatePassword() { }

// Event handlers - handle prefix
const handleClick = () => { };
const handleSubmit = () => { };
const handleChange = () => { };

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
interface UserDetails { }
interface SignupRequestType { }
interface ApiResponseType<T> { }

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
className="signinPage-wrapper"
className="signinPage-container"
className="signinPage-signinForm-wrapper"
className="signinPage-signinForm-button-container"

// Tailwind utility classes
className="w-full h-screen bg-white"
```

### ID Attributes

```typescript
// Descriptive kebab-case
id="signinForm-input-email"
id="signupForm1-input-password"
id="signPage-signinForm-button"
```

---

## 🔄 State Management

### Architecture Overview

The application uses **Redux Toolkit** with three key patterns:

1. **Slices** - Local state management with reducers
2. **RTK Query** - API calls with caching
3. **Thunks** - Complex async operations

---

## 🌐 API Integration

### Axios Configuration

**File:** `src/configs/axiosConfig.ts`

The application uses a **centralized Axios instance** with:
- Request/response interceptors
- Automatic encryption/decryption
- Error handling
- Device ID tracking

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

---

## 🛤 Routing Implementation

---

## 📝 Form Handling

### React Hook Form + Zod Pattern

The application uses **React Hook Form** for form state and **Zod** for validation.

---

## 🚨 Error Handling

### Error Architecture

The application uses a **centralized error handling system** with:
1. Custom error classes
2. Centralized error handler
3. RTK Query error mapper
4. Error logging utility
5. User-facing error display (banners, toasts, modals)

---

## 🔒 Security Patterns

### Encryption Architecture

The application implements **end-to-end encryption** for API communication:

1. **AES-256** - Symmetric encryption for payload data
2. **RSA-2048** - Asymmetric encryption for AES keys and IVs
3. **Initialization Vector (IV)** - Unique per request for AES encryption

---

## ⚙️ TypeScript Configuration

### Path Aliases

**File:** `vite.config.ts`

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
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

---

## ✨ Best Practices

### Code Organization

```typescript
// ✅ DO: Group imports logically
// 1. React imports
import React, { useState, useEffect } from 'react'

// 2. Third-party libraries
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

// 3. Redux/state management
import { useAppDispatch, useAppSelector } from '@/redux/hooks/reduxHooks'
import { selectUserDetails } from '@/redux/slice/user/userSlice'
import { useSignInMutation } from '@/redux/features/user/userApi'

// 4. Local components
import CustomInput from '../common/CustomInput'
import CustomButton from '../common/CustomButton'

// 5. Utils and types
import { validatePassword } from '@/utils/validatePassword'
import type { UserDetails } from '@/types'
```

---

**Version:** 1.0  
**Maintained by:** Banking Management Team  
**Last Updated:** May 2026  

For questions or contributions, please refer to the project repository.
