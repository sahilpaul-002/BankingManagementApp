---
name: react-enterprise
description: Use when creating, modifying, reviewing, refactoring, debugging, or architecting React applications, TypeScript code, Redux Toolkit state management, RTK Query APIs, forms, routing, hooks, pages, components, layouts, tables, charts, and frontend application features.
---

# Purpose

Apply React enterprise standards before generating, reviewing, or modifying code.

# Required References

Read and follow:

- REACT_APPLICATION_GUIDELINES.md

# Technology Stack

- React 19
- TypeScript
- Vite
- Redux Toolkit
- RTK Query
- Tailwind CSS
- shadcn/ui
- React Hook Form
- Zod

# Development Rules

Always follow:

- Architecture standards
- Folder structure conventions
- Naming conventions
- Component patterns
- State management standards
- API integration standards
- TypeScript standards
- Performance guidelines
- Accessibility requirements

defined in:

- REACT_APPLICATION_GUIDELINES.md

# Code Generation Rules

When generating code:

- Use TypeScript
- Use React 19 patterns
- Use strict typing
- Use Redux Toolkit where state management is required
- Use RTK Query for API communication
- Use reusable components
- Follow project architecture
- Follow existing codebase patterns
- Prefer maintainable solutions over shortcuts

# Code Review Rules

When reviewing code:

Verify:

- Type safety
- Performance
- Accessibility
- Error handling
- Loading states
- Reusability
- Separation of concerns
- Architecture compliance
- Redux Toolkit best practices
- RTK Query best practices

# Forbidden Patterns

- any
- class components
- duplicated business logic
- direct DOM manipulation
- unnecessary useEffect chains
- unnecessary memoization
- hardcoded API logic inside UI components
- inconsistent folder structures

# Output Rules

Produce:

- Production-ready code
- Maintainable code
- Reusable code
- Consistent code

Follow REACT_APPLICATION_GUIDELINES.md as the source of truth.