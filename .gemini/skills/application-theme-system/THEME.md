# Banking Management Application(BMA) Design System Theme

Complete documentation of the current Banking Management frontend design system tokens and global styling conventions.

This documentation reflects the current global stylesheet used by the React + TypeScript frontend with **Tailwind CSS v4**, **shadcn/ui**, **tw-animate-css**, **Geist Variable**, and **Orbitron**.

---

## Overview

The current BMA design system is built around a **light application surface with deep navy navigation and warm gold brand accents**, with semantic shadcn tokens available for dark mode.

The design language is intended for a modern fintech / digital-banking interface:

- **Deep navy** for navigation, primary text, and strong UI emphasis
- **Warm gold** for brand accents, actions, highlights, and authentication-page emphasis
- **Cool neutral surfaces** for application backgrounds and cards
- **Green / amber / red / blue semantic colors** for status feedback
- **Orbitron + Geist** for the current frontend typography
- **Compact 4px scrollbars** with a navy/gold gradient treatment
- **Subtle motion** through reusable utility animations

The current implementation does **not** contain the previously documented Forest Green theme variant. The active custom brand palette is the Midnight Navy / Gold system described below.

---

# 1. Global CSS Foundation

The stylesheet currently imports:

```css
@import "tailwindcss";
@import "tw-animate-css";
@import "shadcn/tailwind.css";
@import "@fontsource-variable/geist";
@import "@fontsource/orbitron";
```

The application also defines a custom Tailwind dark-mode variant:

```css
@custom-variant dark (&:is(.dark *));
```

This means dark-mode utilities are activated when an ancestor carries the `.dark` class.

---

# 2. Global Reset

The design system applies a global box-sizing and spacing reset:

```css
*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}
```

This provides predictable sizing and removes browser-default margins and padding before component-level spacing is applied.

---

# 3. Color Palette

## 3.1 Application Surfaces

These tokens define the primary light application surfaces.

| Token          | Value     | Usage                                |
| -------------- | --------- | ------------------------------------ |
| `--bg-app`     | `#f4f6fa` | Main application background          |
| `--bg-surface` | `#ffffff` | Cards, panels, and elevated surfaces |
| `--bg-subtle`  | `#f8f9fc` | Subtle secondary surfaces            |
| `--bg-hover`   | `#f0f3f9` | Hover backgrounds                    |

These should be preferred over hard-coded background colors for application-level UI.

---

## 3.2 Navigation Colors

The navigation system uses deep navy tones.

| Token               | Value     | Usage                                 |
| ------------------- | --------- | ------------------------------------- |
| `--nav-bg`          | `#0c1830` | Primary navigation background         |
| `--nav-bg-2`        | `#0a1428` | Secondary / deeper navigation surface |
| `--nav-active`      | `#16264a` | Active navigation item                |
| `--nav-text`        | `#c8d2e6` | Normal navigation text                |
| `--nav-text-mute`   | `#6b7a99` | Muted navigation text                 |
| `--nav-text-strong` | `#ffffff` | Strong navigation text                |

The navy palette should be treated as a core part of the BMA visual identity.

---

## 3.3 Text / Ink Colors

The custom ink tokens provide a hierarchy for light-theme content.

| Token        | Value     | Usage                      |
| ------------ | --------- | -------------------------- |
| `--ink`      | `#0c1830` | Primary text               |
| `--ink-2`    | `#2a3450` | Secondary text             |
| `--ink-soft` | `#4a5673` | Subdued text               |
| `--mute`     | `#8a93a8` | Muted text                 |
| `--mute-2`   | `#b4bbcc` | Very muted / tertiary text |

For normal application text, prefer the token that matches the intended hierarchy rather than introducing a new gray.

---

## 3.4 Line / Border Colors

| Token           | Value     | Usage                       |
| --------------- | --------- | --------------------------- |
| `--line`        | `#e6e8ee` | Default borders             |
| `--line-strong` | `#d2d6de` | Stronger borders and labels |
| `--line-faint`  | `#f0f1f5` | Very subtle dividers        |

These tokens are especially useful for forms, cards, tables, separators, and input boundaries.

---

## 3.5 Brand Gold

Gold is the primary BMA accent.

| Token         | Value     | Usage                 |
| ------------- | --------- | --------------------- |
| `--gold`      | `#d49a4d` | Primary brand accent  |
| `--gold-2`    | `#e2b06b` | Lighter / hover gold  |
| `--gold-soft` | `#f5e6cc` | Soft gold backgrounds |

Typical usage:

```text
Primary gold       → --gold
Hover / highlight  → --gold-2
Soft background    → --gold-soft
```

The gold palette should be used deliberately for emphasis rather than as the default color for large surfaces.

---

## 3.6 Semantic Status Colors

| Token         | Value     | Usage                     |
| ------------- | --------- | ------------------------- |
| `--ok`        | `#1f8a5b` | Success / positive state  |
| `--ok-bg`     | `#e6f3ec` | Success background        |
| `--warn`      | `#c47a1a` | Warning                   |
| `--warn-bg`   | `#fbecd3` | Warning background        |
| `--danger`    | `#b03333` | Error / destructive state |
| `--danger-bg` | `#fbe7e7` | Error background          |
| `--info`      | `#2a6fdb` | Informational state       |
| `--info-bg`   | `#e8f0fd` | Informational background  |

Status colors should normally be paired with their corresponding background token.

---

# 4. shadcn Semantic Color Tokens

In addition to the custom BMA tokens, the stylesheet defines the standard shadcn semantic tokens using OKLCH.

## Light Mode

The root semantic tokens include:

- `--background`
- `--foreground`
- `--card`
- `--card-foreground`
- `--popover`
- `--popover-foreground`
- `--primary`
- `--primary-foreground`
- `--secondary`
- `--secondary-foreground`
- `--muted`
- `--muted-foreground`
- `--accent`
- `--accent-foreground`
- `--destructive`
- `--border`
- `--input`
- `--ring`
- `--chart-1` through `--chart-5`
- `--sidebar`
- `--sidebar-foreground`
- `--sidebar-primary`
- `--sidebar-primary-foreground`
- `--sidebar-accent`
- `--sidebar-accent-foreground`
- `--sidebar-border`
- `--sidebar-ring`

These semantic tokens are mapped into the Tailwind theme through `@theme inline`.

---

# 5. Dark Mode

The `.dark` class overrides the shadcn semantic tokens with dark values.

Important distinction:

> The current stylesheet provides dark-mode values for the **shadcn semantic system**, while the custom BMA tokens such as `--nav-bg`, `--gold`, `--ink`, and `--bg-app` are currently defined in `:root` and are not separately overridden inside `.dark`.

Therefore, when implementing a dark-mode component, prefer the semantic shadcn tokens where automatic dark-mode behavior is required.

For example:

```text
Background → --background
Foreground → --foreground
Card       → --card
Border     → --border
Input      → --input
Primary    → --primary
Destructive → --destructive
```

For BMA-specific branding, continue using the navy/gold custom tokens.

---

# 6. Typography

## 6.1 Current Font Imports

The current stylesheet imports:

- **Geist Variable**
- **Orbitron**

The active Tailwind font configuration is:

```css
@theme inline {
  --font-sans: "Orbitron", "Geist Variable", sans-serif;
  --font-display:
    "Orbitron", "DM Sans", "Plus Jakarta Sans", system-ui, sans-serif;
}
```

Therefore, the current implementation does **not** use the previously documented `EB Garamond`, `Inter`, or `JetBrains Mono` tokens as its active Tailwind font configuration.

---

## 6.2 Font Roles

### Orbitron

Orbitron is the primary application font in the current Tailwind theme.

It is particularly suitable for:

- Authentication headings
- Dashboard headings
- Navigation labels
- Financial figures
- Brand-oriented UI
- Technology / fintech visual elements

### Geist Variable

Geist is the primary fallback / supporting UI font.

It is suitable for:

- Body copy
- Form content
- Supporting descriptions
- Dense data
- General interface text

### System Fallbacks

The system retains generic fallbacks:

```text
sans-serif
system-ui
```

to maintain usable rendering if a custom font is unavailable.

---

# 7. Base Typography

The root stylesheet defines:

```css
:root {
  line-height: 1.5;
  font-weight: 400;

  font-synthesis: none;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
```

The base application font is applied through:

```css
html,
body {
  font-family: var(--font-sans);
}
```

Body rendering also uses:

```css
-webkit-font-smoothing: antialiased;
```

---

# 8. Typography Guidance

The current frontend favors compact, modern fintech typography.

Recommended hierarchy:

| Element                | Recommended approach                                                |
| ---------------------- | ------------------------------------------------------------------- |
| Page title             | Orbitron, strong weight                                             |
| Section title          | Orbitron, medium/strong weight                                      |
| Navigation             | Orbitron / Geist depending on density                               |
| Body                   | Geist Variable                                                      |
| Labels                 | Geist / Orbitron depending on component                             |
| Financial figures      | Orbitron                                                            |
| IDs / technical values | Use a monospace utility only when technical readability requires it |

The previous `--display`, `--sans`, and `--mono` custom variables are **not present in the current stylesheet** and should not be documented as active tokens.

---

# 9. Border Radius

The current stylesheet contains two related radius systems.

## Custom BMA Radius

```css
--border-radius: 6px;
```

This is the existing custom global radius token.

## shadcn Radius System

```css
--radius: 0.625rem;
```

The Tailwind theme derives component radii from this value:

| Token          | Formula                     |
| -------------- | --------------------------- |
| `--radius-sm`  | `calc(var(--radius) * 0.6)` |
| `--radius-md`  | `calc(var(--radius) * 0.8)` |
| `--radius-lg`  | `var(--radius)`             |
| `--radius-xl`  | `calc(var(--radius) * 1.4)` |
| `--radius-2xl` | `calc(var(--radius) * 1.8)` |
| `--radius-3xl` | `calc(var(--radius) * 2.2)` |
| `--radius-4xl` | `calc(var(--radius) * 2.6)` |

The shadcn radius system should be preferred for components built using shadcn/ui.

---

# 10. Layout and Spacing

The design system follows Tailwind's spacing utilities.

Common spacing values:

| Utility |  Value |
| ------- | -----: |
| `gap-2` |  `8px` |
| `gap-3` | `12px` |
| `gap-4` | `16px` |
| `gap-6` | `24px` |

The general design principle remains:

> Prefer the existing Tailwind spacing scale instead of introducing arbitrary spacing values unless a component genuinely requires a specific dimension.

The current stylesheet does not define active `--sidebar-w` or `--topbar-h` custom variables, so those values should not be treated as global design tokens.

---

# 11. Tailwind Theme Mapping

The `@theme inline` block maps semantic CSS variables into Tailwind color and radius utilities.

Examples include:

```text
bg-background
text-foreground
bg-card
text-card-foreground
bg-primary
text-primary-foreground
bg-secondary
text-secondary-foreground
bg-muted
text-muted-foreground
bg-accent
text-accent-foreground
border-border
border-input
ring-ring
text-destructive
```

This creates a consistent bridge between the CSS variable system and Tailwind utilities.

---

# 12. Custom Link Colors

The stylesheet defines:

| Token           | Value     |
| --------------- | --------- |
| `--color-link1` | `#9193f7` |
| `--color-link2` | `#383acf` |
| `--color-link3` | `#2e30a3` |

These provide a separate blue-violet link hierarchy and should be used where the interface requires a link treatment distinct from the gold brand accent.

---

# 13. Form Feedback

## Input Hint

```css
.input-hint {
  font-size: 11px;
  color: #ca8a04;
  letter-spacing: -0.01em;
  font-weight: 400;
}
```

Usage:

- Additional field guidance
- Input requirements
- Small instructional messages

The hint uses a warm amber/gold tone.

---

## Input Error

```css
.input-error {
  font-size: 11px;
  color: var(--color-destructive);
  letter-spacing: -0.01em;
  font-weight: 400;
}
```

Usage:

- Validation errors
- Invalid form values
- Destructive feedback

This intentionally connects form errors to the shadcn destructive semantic token.

---

## Authentication Input Error

```css
.auth-input-error {
  font-size: 11px;
  color: rgba(255, 69, 69, 1);
  font-weight: 400;
}
```

This is the authentication-specific error style and uses a stronger red than the general semantic destructive token.

---

# 14. Scrollbar Design

The application uses a compact custom scrollbar for Chrome, Edge, and Safari.

## Dimensions

```css
::-webkit-scrollbar {
  width: 4px;
  height: 4px;
  border-radius: 100%;
}
```

The scrollbar is intentionally narrow to preserve dashboard space.

## Track

The scrollbar track is transparent:

```css
::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-track-piece {
  background: transparent;
}
```

## Thumb

The default scrollbar thumb uses the BMA navy/gold palette:

```css
background: linear-gradient(
  to bottom,
  var(--gold),
  var(--ink-2),
  var(--ink),
  var(--ink-2),
  var(--gold)
);
```

## Hover

On hover, the gradient shifts toward the softer navy token:

```css
background: linear-gradient(
  to bottom,
  var(--ink-soft),
  var(--ink-2),
  var(--ink),
  var(--ink-2),
  var(--ink-soft)
);
```

This creates a subtle branded interaction without adding a visible scrollbar track.

---

# 15. Animation System

The current stylesheet defines reusable animations for interface feedback and decorative motion.

---

## 15.1 Float

```css
@keyframes float {
  0%,
  100% {
    transform: translateY(0) rotate(0deg);
  }

  50% {
    transform: translateY(-18px) rotate(2deg);
  }
}
```

Tailwind theme aliases:

```text
animate-float
animate-float-slow
```

Configured durations:

```text
animate-float      → 6s ease-in-out infinite
animate-float-slow → 9s ease-in-out infinite
```

Recommended for decorative fintech illustrations and background elements.

---

## 15.2 Pulse Glow

```css
@keyframes pulseGlow {
  0%,
  100% {
    opacity: 0.55;
    transform: scale(1);
  }

  50% {
    opacity: 0.9;
    transform: scale(1.08);
  }
}
```

Tailwind alias:

```text
animate-pulse-glow
```

Configured as:

```text
4s ease-in-out infinite
```

Recommended for subtle branded glow effects.

---

## 15.3 Slow Spin

Tailwind alias:

```text
animate-spin-slow
```

Configured as:

```text
spin 18s linear infinite
```

Recommended for decorative circular elements rather than primary UI controls.

---

## 15.4 Rise

```css
@keyframes rise {
  from {
    opacity: 0;
    transform: translateY(24px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

Tailwind alias:

```text
animate-rise
```

Configured as:

```text
0.8s cubic-bezier(0.22, 1, 0.36, 1) both
```

Recommended for page sections and dashboard content entering the viewport.

---

## 15.5 Shimmer

```css
@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }

  100% {
    background-position: 200% 0;
  }
}
```

Tailwind alias:

```text
animate-shimmer
```

Configured as:

```text
3s linear infinite
```

Recommended for skeletons, loading placeholders, and subtle loading states.

---

## 15.6 Shrink

```css
@keyframes shrink {
  from {
    width: 100%;
  }

  to {
    width: 0%;
  }
}
```

Utility:

```css
.animate-shrink {
  animation: shrink 6s linear forwards;
}
```

Recommended for:

- Toast timers
- Temporary banners
- Countdown progress indicators

---

## 15.7 Pulse Line

```css
@keyframes pulse-line {
  0%,
  100% {
    opacity: 0.3;
    transform: scaleX(0.8);
  }

  50% {
    opacity: 1;
    transform: scaleX(1);
  }
}
```

Utility:

```css
.animate-pulse-line {
  animation: pulse-line 2s ease-in-out infinite;
  transform-origin: center;
}
```

Recommended for:

- Loading indicators
- Animated separators
- Financial activity visualizations

---

## 15.8 Fade In

```css
@keyframes fade-in {
  from {
    opacity: 0;
    transform: scale(0.95);
  }

  to {
    opacity: 0.9;
    transform: scale(1);
  }
}
```

Utility:

```css
.animate-fade-in {
  animation: fade-in 1.5s ease-out forwards;
}
```

Recommended for subtle content reveal and decorative elements.

---

# 16. Component Patterns

## 16.1 Primary Navigation Button

Recommended pattern:

```css
background: var(--nav-bg);
color: #ffffff;
```

Use for primary actions where a strong navy treatment is more appropriate than gold.

---

## 16.2 Gold Button

Recommended pattern:

```css
background: var(--gold);
color: #1a1207;
```

Use for:

- Brand actions
- Important authentication actions
- Financial CTAs
- Highlighted user actions

Hover states should generally move toward:

```css
var(--gold-2)
```

---

## 16.3 Ghost Button

Recommended pattern:

```css
background: transparent;
border: 1px solid var(--line);
```

Use for secondary or low-emphasis actions.

---

# 17. Status Pills

Recommended semantic pattern:

```css
.pill.ok {
  background: var(--ok-bg);
  color: var(--ok);
}

.pill.warn {
  background: var(--warn-bg);
  color: var(--warn);
}

.pill.danger {
  background: var(--danger-bg);
  color: var(--danger);
}
```

The background and foreground should come from the same semantic family.

---

# 18. Cards and Surfaces

Recommended custom BMA surface pattern:

```css
.surface {
  background: var(--bg-surface);
  border: 1px solid var(--line);
  border-radius: var(--border-radius);
}
```

For shadcn-based components, prefer the semantic equivalents:

```text
background → bg-card
border     → border-border
foreground → text-card-foreground
```

This keeps components compatible with the semantic light/dark system.

---

# 19. Design Principles

## Navy

Use navy for:

- Navigation
- Primary structural elements
- Strong headings
- High-priority controls
- Financial application identity

## Gold

Use gold for:

- Brand identity
- Important actions
- Highlights
- Active states
- Authentication-page emphasis
- Financial / premium visual accents

## Neutral Surfaces

Use neutral surfaces for:

- Cards
- Forms
- Tables
- Dashboard content
- Secondary panels

## Semantic Colors

Use semantic colors consistently:

```text
Success → green
Warning → amber
Danger  → red
Info    → blue
```

Do not use brand gold as a substitute for semantic error or success colors.

---

# 20. Accessibility Guidance

The design system should preserve accessible contrast and should not communicate important state using color alone.

Recommended patterns:

- Pair status colors with text labels or icons.
- Maintain sufficient contrast between text and background.
- Keep error messages close to the affected input.
- Use clear focus states.
- Do not depend exclusively on the gold accent for actionable-state recognition.
- Avoid extremely low-contrast muted text for essential information.

The semantic shadcn tokens should be preferred when a component needs automatic light/dark adaptation.

---

# 21. Dark-Mode Implementation Guidance

The project currently supports the `.dark` class through:

```css
@custom-variant dark (&:is(.dark *));
```

The shadcn semantic variables have explicit dark-mode values.

When creating new components:

### Prefer

```text
bg-background
text-foreground
bg-card
text-card-foreground
border-border
bg-muted
text-muted-foreground
text-destructive
```

when the component should adapt automatically to dark mode.

### Use custom BMA tokens

```text
--nav-bg
--nav-bg-2
--nav-active
--nav-text
--gold
--gold-2
--gold-soft
```

when the component is specifically part of the BMA brand/navigation system.

---

# 22. Theme Architecture

The current theme can be viewed as four layers:

```text
BMA Design System
│
├── Brand Tokens
│   ├── Navy
│   └── Gold
│
├── Application Tokens
│   ├── Surfaces
│   ├── Ink
│   ├── Lines
│   └── Status
│
├── shadcn Semantic Tokens
│   ├── Background
│   ├── Card
│   ├── Primary
│   ├── Secondary
│   ├── Muted
│   ├── Accent
│   ├── Destructive
│   ├── Border
│   ├── Input
│   └── Sidebar
│
└── Motion / Interaction
    ├── Float
    ├── Pulse Glow
    ├── Spin
    ├── Rise
    ├── Shimmer
    ├── Shrink
    ├── Pulse Line
    └── Fade In
```

---

# 23. Implementation Rules

When adding or modifying frontend UI:

1. Prefer existing CSS variables before introducing new colors.
2. Prefer Tailwind spacing utilities over arbitrary spacing values.
3. Use `--gold` and `--gold-2` for brand accents.
4. Use `--nav-bg` and related tokens for navigation.
5. Use semantic status tokens for success, warning, error, and information.
6. Use shadcn semantic tokens for components that need dark-mode support.
7. Prefer Orbitron / Geist according to the established typography hierarchy.
8. Avoid introducing a second independent color palette.
9. Avoid hard-coded colors when an existing token already represents the same semantic purpose.
10. Reuse existing animation utilities instead of creating near-duplicate animations.
11. Keep authentication UI consistent with the gold + navy visual language.
12. Keep scrollbars compact and consistent with the established branded scrollbar treatment.

---

# 24. Current Active Tokens

## Brand / Application Tokens

```text
--bg-app
--bg-surface
--bg-subtle
--bg-hover

--nav-bg
--nav-bg-2
--nav-active
--nav-text
--nav-text-mute
--nav-text-strong

--ink
--ink-2
--ink-soft
--mute
--mute-2

--line
--line-strong
--line-faint

--gold
--gold-2
--gold-soft

--ok
--ok-bg
--warn
--warn-bg
--danger
--danger-bg
--info
--info-bg

--color-link1
--color-link2
--color-link3

--border-radius
```

## shadcn Tokens

```text
--background
--foreground
--card
--card-foreground
--popover
--popover-foreground
--primary
--primary-foreground
--secondary
--secondary-foreground
--muted
--muted-foreground
--accent
--accent-foreground
--destructive
--border
--input
--ring
--chart-1
--chart-2
--chart-3
--chart-4
--chart-5

--radius
--sidebar
--sidebar-foreground
--sidebar-primary
--sidebar-primary-foreground
--sidebar-accent
--sidebar-accent-foreground
--sidebar-border
--sidebar-ring
```

---

# 25. Files / Source Structure

The current frontend theme is defined through the global stylesheet rather than a separate Forest theme override.

Current source responsibilities:

```text
Global stylesheet
├── Tailwind import
├── tw-animate import
├── shadcn theme import
├── Font imports
├── Dark variant
├── Global reset
├── BMA custom tokens
├── shadcn semantic tokens
├── Tailwind @theme mappings
├── Base styles
├── Keyframes
├── Custom utility animations
├── Input feedback styles
└── Custom scrollbar
```

---

# 26. Important Documentation Corrections

The earlier BMA theme documentation described several tokens and variants that are **not present in the current frontend stylesheet**.

The current documentation therefore intentionally removes or corrects the following:

### Forest Green Theme

Not currently defined in the supplied stylesheet.

### `--display`, `--sans`, `--mono`

Not currently defined as active custom typography tokens.

### EB Garamond / Inter / JetBrains Mono

Not the current imported/active primary typography configuration.

### `--sidebar-w`

Not currently defined as a CSS variable.

### `--topbar-h`

Not currently defined as a CSS variable.

### `--radius-pill`

Not currently defined.

### `--shadow-sm`, `--shadow-md`, `--shadow-lg`, `--shadow-drawer`

Not currently defined in the supplied stylesheet.

### Explicit custom shadow system

Not currently present in the supplied stylesheet.

The documentation should describe the **actual current implementation** rather than retaining legacy tokens that are no longer present.

---

# 27. Version

**Design System:** BMA / Banking Management Frontend  
**Theme:** Midnight Navy + Gold  
**Frontend:** React + TypeScript  
**Styling:** Tailwind CSS v4  
**Component System:** shadcn/ui  
**Animation:** tw-animate-css + custom keyframes  
**Typography:** Orbitron + Geist Variable  
**Theme Modes:** Light + shadcn semantic Dark Mode  
**Documentation Version:** 2.0.0

---

**Last Updated:** 2026-09-10

**Maintained For:** Banking Management Frontend
