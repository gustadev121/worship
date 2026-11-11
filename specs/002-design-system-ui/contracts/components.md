# Design System Contract: UI Component Primitives & React Bits Micro-Interactions

**Feature**: `002-design-system-ui` | **Document**: `contracts/components.md`  
**Status**: Approved Specification  
**Architecture Layer**: Presentation (`src/presentation/components/ui/`, `src/presentation/components/reactbits/`)

---

## 1. Architectural Strategy & Design System Standards

The WorshipFlow component architecture implements a modular, accessible, and high-performance component catalog inspired by Shadcn UI and enriched with React Bits micro-interactions.

### 1.1 Implementation Tenets

1. **Zero Runtime CSS-in-JS**: All primitives utilize standard CSS custom properties defined in `globals.css` and scoped class names (`wf-*`).
2. **Server & Client Boundary Discipline**:
   - Pure presentational primitives (`Card`, `Badge`, `Table`, `Input`) render as React Server Components (RSC) by default.
   - Interactive components requiring client state, DOM measurement, or event listeners (`Modal`, `SpotlightCard`, `AuroraBackground`, `PracticeStatusToggle`) are strictly marked with `"use client"`.
3. **Strict Accessibility (WCAG 2.1 AA)**:
   - All interactive controls provide minimum `44x44px` touch targets on mobile viewports.
   - Full keyboard navigation (Tab, Enter, Space, Escape, Arrow keys) and screen-reader semantics (WAI-ARIA).
4. **Adaptive Motion**: All micro-interactions honor `prefers-reduced-motion` and touchscreen devices (`pointer: coarse`).

---

## 2. Component Primitives Specification

### 2.1 Button (`src/presentation/components/ui/button.tsx`)

A polymorphic, accessible action trigger supporting 6 visual variants, 4 sizes, loading states, and keyboard focus outlines.

#### 2.1.1 Type Contract

```typescript
import type { ButtonHTMLAttributes, ReactNode } from "react";

export type ButtonVariant =
  | "primary" // Solid Indigo brand fill
  | "secondary" // Slate surface fill with high-contrast text
  | "outline" // Transparent fill with structural border
  | "ghost" // Borderless hover-fill trigger
  | "destructive" // High-visibility crimson delete/critical action
  | "icon"; // Equilateral square/circle container for standalone icons

export type ButtonSize = "sm" | "md" | "lg" | "icon";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  children?: ReactNode;
}
```

#### 2.1.2 Visual Variant Matrix

| Variant       | Resting State                                               | Hover State                                        | Active / Pressed         | Focus-Visible                                     |
| ------------- | ----------------------------------------------------------- | -------------------------------------------------- | ------------------------ | ------------------------------------------------- |
| `primary`     | `bg: var(--primary)`, `text: #fff`                          | `bg: var(--primary-hover)`                         | `transform: scale(0.98)` | `ring: 2px solid var(--ring)`, `ring-offset: 2px` |
| `secondary`   | `bg: var(--secondary)`, `text: var(--secondary-foreground)` | `bg: var(--secondary-hover)`                       | `transform: scale(0.98)` | `ring: 2px solid var(--ring)`                     |
| `outline`     | `bg: transparent`, `border: 1px solid var(--border)`        | `bg: var(--muted)`, `border: var(--border-subtle)` | `transform: scale(0.98)` | `ring: 2px solid var(--ring)`                     |
| `ghost`       | `bg: transparent`, `text: var(--foreground)`                | `bg: var(--muted)`                                 | `transform: scale(0.98)` | `ring: 2px solid var(--ring)`                     |
| `destructive` | `bg: var(--destructive)`, `text: #fff`                      | `bg: var(--destructive-hover)`                     | `transform: scale(0.98)` | `ring: 2px solid var(--destructive)`              |
| `icon`        | `w: 44px`, `h: 44px`, `p: 0`, `bg: transparent`             | `bg: var(--muted)`                                 | `transform: scale(0.94)` | `ring: 2px solid var(--ring)`                     |

#### 2.1.3 Accessibility & Touch Target Rules

- **Touch Target**: All buttons enforce `min-height: 44px` and `min-width: 44px` on mobile viewports (`@media (max-width: 768px)`).
- **ARIA Semantics**:
  - Disabled state: `aria-disabled="true"` and `disabled` attribute.
  - Loading state: `aria-busy="true"` with embedded accessible spinner and visually hidden `"Cargando..."` announcement.
  - Icon-only buttons: `aria-label` or `aria-labelledby` is **strictly required**.

---

### 2.2 Card (`src/presentation/components/ui/card.tsx`)

A composable container system for grouping song metadata, roadmap milestones, and admin console sections.

#### 2.2.1 Type Contract

```typescript
import type { HTMLAttributes, ReactNode } from "react";

export type CardVariant = "default" | "elevated" | "bordered" | "interactive";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  children: ReactNode;
}

export interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
  children: ReactNode;
}

export interface CardDescriptionProps
  extends HTMLAttributes<HTMLParagraphElement> {
  children: ReactNode;
}

export interface CardContentProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}
```

#### 2.2.2 Subcomponents & Composition

```tsx
<Card variant="interactive">
  <CardHeader>
    <CardTitle as="h3">Amazing Grace</CardTitle>
    <CardDescription>John Newton · 4/4 · 72 BPM</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Role assignments and practice key details...</p>
  </CardContent>
  <CardFooter>
    <Button variant="primary" size="sm">
      Ensayar
    </Button>
  </CardFooter>
</Card>;
```

#### 2.2.3 Interaction Styling

- `default`: `background: var(--card)`, `border: 1px solid var(--border)`, `border-radius: var(--radius-lg)`, `box-shadow: var(--shadow-sm)`.
- `interactive`: Transitions `border-color` and `box-shadow` on hover (`transform: translateY(-2px)`, `box-shadow: var(--shadow-md)`).

---

### 2.3 Badge (`src/presentation/components/ui/badge.tsx`)

High-contrast contextual pill indicators for musical keys, user roles, practice statuses, and roadmap tiers.

#### 2.3.1 Type Contract

```typescript
import type { HTMLAttributes, ReactNode } from "react";

export type BadgeVariant =
  | "key-original" // Slate neutral badge with original song key
  | "key-practice" // Amber luminous pill with transposed practice key
  | "role-admin" // Purple high-contrast admin indicator
  | "role-member" // Sky blue member indicator
  | "status-ready" // Emerald rehearsal ready indicator
  | "status-practicing" // Amber rehearsal in-progress indicator
  | "status-pending" // Slate rehearsal pending indicator
  | "tier-p1" // Critical roadmap milestone
  | "tier-p2" // High value milestone
  | "tier-p3" // Scheduling milestone
  | "tier-p4" // Live stage utility milestone
  | "custom"; // Dynamic repertoire label with custom hex color

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  customColorHex?: string; // Used when variant="custom"
  size?: "sm" | "md";
  dot?: boolean; // Renders a status dot preceding text
  children: ReactNode;
}
```

#### 2.3.2 Variant Specifications

| Variant             | Background Fill               | Border                                      | Text Color                 | Contrast Ratio                  |
| ------------------- | ----------------------------- | ------------------------------------------- | -------------------------- | ------------------------------- |
| `key-original`      | `var(--secondary)`            | `1px solid var(--border)`                   | `var(--foreground)`        | > 15:1                          |
| `key-practice`      | `var(--chord-accent-bg)`      | `1px solid var(--chord-accent-border)`      | `var(--chord-accent)`      | 11.23:1 (dark) / 7.34:1 (light) |
| `role-admin`        | `var(--role-admin-bg)`        | `1px solid var(--role-admin-border)`        | `var(--role-admin)`        | > 7:1                           |
| `role-member`       | `var(--role-member-bg)`       | `1px solid var(--role-member-border)`       | `var(--role-member)`       | > 7:1                           |
| `status-ready`      | `var(--status-ready-bg)`      | `1px solid var(--status-ready-border)`      | `var(--status-ready)`      | > 7:1                           |
| `status-practicing` | `var(--status-practicing-bg)` | `1px solid var(--status-practicing-border)` | `var(--status-practicing)` | > 7:1                           |
| `status-pending`    | `var(--status-pending-bg)`    | `1px solid var(--status-pending-border)`    | `var(--status-pending)`    | > 6:1                           |

---

### 2.4 Modal Dialog (`src/presentation/components/ui/modal.tsx`)

An accessible, focus-trapped dialog overlay featuring glassmorphism backdrop blur and escape dismissal.

#### 2.4.1 Type Contract

```typescript
import type { ReactNode } from "react";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg" | "fullscreen";
  closeOnOutsideClick?: boolean;
}
```

#### 2.4.2 Accessibility & Lifecycle Specifications

1. **Focus Trapping**: Automatically captures tab navigation within the active modal container (`useFocusTrap` hook). Focus is restored to the initiating element upon dismissal.
2. **Keyboard Listener**: Listens globally for the `Escape` key to trigger `onClose()`.
3. **Scroll Lock**: Body scroll is locked via `document.body.style.overflow = "hidden"` while mounted.
4. **WAI-ARIA Attributes**:
   - Container has `role="dialog"` and `aria-modal="true"`.
   - Title has `id="modal-title"`; container linked via `aria-labelledby="modal-title"`.
   - Description has `id="modal-desc"`; container linked via `aria-describedby="modal-desc"`.
5. **Backdrop Blur**: Backdrop element applies `backdrop-filter: blur(8px); background: rgba(9, 13, 22, 0.75)`.

---

### 2.5 Input (`src/presentation/components/ui/input.tsx`)

Standardized text inputs, search pickers, and textareas with floating validation hints.

#### 2.5.1 Type Contract

```typescript
import type {
  InputHTMLAttributes,
  ReactNode,
  TextareaHTMLAttributes,
} from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  errorMessage?: string;
  leftIcon?: ReactNode;
  rightAction?: ReactNode;
}

export interface TextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  helperText?: string;
  errorMessage?: string;
}
```

#### 2.5.2 State Specifications

- **Resting**: `background: var(--input)`, `border: 1px solid var(--input-border)`, `border-radius: var(--radius-md)`.
- **Focus**: `outline: none`, `border-color: var(--primary)`, `box-shadow: 0 0 0 2px var(--ring)`.
- **Invalid / Error**: `border-color: var(--destructive)`, `box-shadow: 0 0 0 2px var(--destructive)`, `aria-invalid="true"`.
- **Accessibility**: Links input to error message via `aria-errormessage="input-err-[id]"` and helper text via `aria-describedby="input-desc-[id]"`.

---

### 2.6 Table (`src/presentation/components/ui/table.tsx`)

A responsive tabular data grid for user role administration and label rosters.

#### 2.6.1 Type Contract

```typescript
import type { HTMLAttributes, ReactNode, TableHTMLAttributes } from "react";

export interface TableProps extends TableHTMLAttributes<HTMLTableElement> {
  children: ReactNode;
  stickyHeader?: boolean;
}

export interface TableHeaderProps
  extends HTMLAttributes<HTMLTableSectionElement> {
  children: ReactNode;
}

export interface TableBodyProps
  extends HTMLAttributes<HTMLTableSectionElement> {
  children: ReactNode;
}

export interface TableRowProps extends HTMLAttributes<HTMLTableRowElement> {
  children: ReactNode;
  isClickable?: boolean;
}

export interface TableHeadProps extends HTMLAttributes<HTMLTableCellElement> {
  children: ReactNode;
  sortable?: boolean;
  sortDirection?: "asc" | "desc" | null;
}

export interface TableCellProps extends HTMLAttributes<HTMLTableCellElement> {
  children: ReactNode;
}
```

#### 2.6.2 Responsive Mobile Adaptation

- The `Table` component is automatically wrapped in a container with `overflow-x: auto; -webkit-overflow-scrolling: touch;`.
- On narrow viewports (`<768px`), table cells retain minimum readable widths and horizontal panning is enabled with subtle scroll indicator shadows.

---

## 3. React Bits Micro-Interactions Specification

### 3.1 SpotlightCard (`src/presentation/components/reactbits/spotlight-card.tsx`)

An interactive card primitive featuring a dynamic radial gradient cursor spotlight that follows the user's pointer across the card boundary, creating depth and tactile polish.

#### 3.1.1 Type Contract

```typescript
import type { HTMLAttributes, ReactNode } from "react";

export interface SpotlightCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  spotlightColor?: string; // Default: "var(--glow-spotlight)"
  spotlightSize?: number; // Default: 350 (radius in pixels)
  borderColor?: string; // Default: "var(--spotlight-border)"
  borderGlow?: boolean; // Default: true (illuminates card border gradient)
  as?: "div" | "article" | "section";
}
```

#### 3.1.2 Interactive Implementation & Math

The component tracks the mouse coordinate relative to its bounding box:
```typescript
// Coordinate calculation
const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
  if (isReducedMotion || isCoarsePointer) return;
  const rect = e.currentTarget.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  e.currentTarget.style.setProperty("--mouse-x", `${x}px`);
  e.currentTarget.style.setProperty("--mouse-y", `${y}px`);
};
```

#### 3.1.3 CSS Shader Layering

```css
.spotlight-card {
  position: relative;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  transition:
    transform var(--transition-fast),
    border-color var(--transition-fast);
}

.spotlight-card::before {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: radial-gradient(
    circle var(--spotlight-size, 350px) at var(--mouse-x, 0) var(--mouse-y, 0),
    var(--spotlight-color, var(--glow-spotlight)),
    transparent 80%
  );
  opacity: 0;
  transition: opacity var(--transition-fast);
}

.spotlight-card:hover::before {
  opacity: 1;
}
```

#### 3.1.4 Touch & Reduced Motion Fallback

- **Media Query**: When `@media (pointer: coarse)` (touchscreens/tablets) is detected, mouse tracking is bypassed completely. The card displays a static subtle border without spotlight overhead.
- **Accessibility**: When `prefers-reduced-motion: reduce` is active, the radial gradient pseudo-element is disabled (`display: none;`) and cards utilize static hover elevations.

---

### 3.2 AuroraBackground (`src/presentation/components/reactbits/aurora-bg.tsx`)

An ambient, organic aurora background gradient designed for high-impact entry points (such as `/login` and hero arrangement headers), projecting a calm, worship-aligned visual atmosphere.

#### 3.2.1 Type Contract

```typescript
import type { HTMLAttributes, ReactNode } from "react";

export interface AuroraBackgroundProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
  showRadialGradient?: boolean; // Default: true (subtle vignette mask)
  intensity?: "subtle" | "vibrant"; // Default: "subtle"
  speed?: "slow" | "normal"; // Default: "slow" (60s loop)
}
```

#### 3.2.2 CSS Animation Specification

```css
@keyframes aurora-drift {
  0% {
    background-position:
      0% 50%,
      50% 50%,
      100% 50%;
  }
  50% {
    background-position:
      100% 50%,
      0% 50%,
      50% 100%;
  }
  100% {
    background-position:
      0% 50%,
      50% 50%,
      100% 50%;
  }
}

.aurora-bg-container {
  position: relative;
  overflow: hidden;
  background-color: var(--background);
}

.aurora-blob-layer {
  position: absolute;
  inset: -50%;
  filter: blur(60px);
  opacity: 0.45;
  background-image:
    radial-gradient(
      ellipse at 20% 30%,
      rgba(99, 102, 241, 0.4) 0%,
      transparent 50%
    ),
    radial-gradient(
      ellipse at 80% 40%,
      rgba(168, 85, 247, 0.35) 0%,
      transparent 50%
    ),
    radial-gradient(
      ellipse at 50% 80%,
      rgba(56, 189, 248, 0.3) 0%,
      transparent 50%
    );
  background-size: 200% 200%;
  animation: aurora-drift 60s ease-in-out infinite alternate;
  pointer-events: none;
}
```

#### 3.2.3 Reduced Motion Fallback

```css
@media (prefers-reduced-motion: reduce) {
  .aurora-blob-layer {
    animation: none !important;
    background-position: 50% 50% !important;
    opacity: 0.25 !important;
  }
}
```

---

### 3.3 AnimatedGlow (`src/presentation/components/reactbits/animated-glow.tsx`)

A micro-interaction wrapper delivering a subtle pulsing aura around active elements (e.g. active song rehearsal player, live section markers, or current roadmap milestone).

#### 3.3.1 Type Contract

```typescript
import type { HTMLAttributes, ReactNode } from "react";

export type GlowColor = "indigo" | "amber" | "emerald" | "cyan";

export interface AnimatedGlowProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  glowColor?: GlowColor; // Default: "indigo"
  intensity?: "subtle" | "vibrant"; // Default: "subtle"
  isActive?: boolean; // Default: true
  pulse?: boolean; // Default: false
}
```

#### 3.3.2 Visual Specifications

- **Conic Perimeter Trace**: Renders a delicate 1px rotating perimeter line using CSS `conic-gradient` overlaid with a border mask.
- **Pulsing Box Shadow**: When `pulse={true}`, transitions `box-shadow` between `0 0 15px -3px var(--glow-color)` and `0 0 25px 0px var(--glow-color)` over a 3-second sinusoidal cycle.
- **Reduced Motion Fallback**: Disables the continuous `@keyframes pulse` and conic spin; locks into a static 1px border with a soft, non-animating glow.

---

## 4. Accessibility & Responsive Verification Matrix

| Component            | Keyboard Navigable        | Screen Reader Semantics                                 | Reduced Motion Fallback                  | Minimum Mobile Touch Target   |
| -------------------- | ------------------------- | ------------------------------------------------------- | ---------------------------------------- | ----------------------------- |
| **Button**           | Tab / Enter / Space       | `role="button"`, `aria-busy`, `aria-disabled`           | Removes press scale transition           | 44x44px minimum bounding box  |
| **Card**             | Tab (when interactive)    | `role="article"` or `<section>`                         | Disables hover translateY translation    | Full container tap surface    |
| **Badge**            | Static indicator          | `role="status"` on dynamic updates                      | Instant color state swap                 | N/A (non-interactive label)   |
| **Modal Dialog**     | Tab trap / Escape dismiss | `role="dialog"`, `aria-modal="true"`, `aria-labelledby` | Instant opacity, no scale pop            | Close button >= 44x44px       |
| **Input**            | Tab / Shift+Tab           | `aria-invalid`, `aria-errormessage`, `aria-describedby` | Instant border focus                     | 44px input height             |
| **Table**            | Arrow key scroll          | `role="table"`, `scope="col"`, `scope="row"`            | Instant hover row highlight              | 44px clickable rows / actions |
| **SpotlightCard**    | Native to wrapped element | Preserves child semantics                               | Disables cursor tracking & radial shader | Follows child touch targets   |
| **AuroraBackground** | Non-focusable background  | `aria-hidden="true"` on atmospheric canvas              | Disables 60s drift keyframes             | Background container          |
| **AnimatedGlow**     | Non-focusable decorator   | `aria-hidden="true"` on glow wrapper                    | Disables pulse / conic spin              | Follows child touch targets   |
