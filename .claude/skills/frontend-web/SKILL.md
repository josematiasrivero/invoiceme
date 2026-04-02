---
name: frontend-web
description: >
  Next.js App Router frontend conventions: components, hooks, API layer,
  forms, styling with Tailwind + shadcn/ui, state management, and UI standards.
  Use when creating or modifying React components, pages, hooks, or API services.
allowed-tools: Read, Edit, Write, Glob, Grep, Bash(pnpm *)
argument-hint: [feature or component to implement]
---

# Frontend Web — Feature Implementation

Implement the frontend feature described in `$ARGUMENTS` following the conventions below.

## Stack

- **Next.js 15** (App Router, file-based routing)
- **React 18** — hooks-based, no class components
- **TypeScript 5** — strict mode; all props and return types must be typed
- **Tailwind CSS 4** — CSS-first approach
- **Radix UI** — accessible primitives (accordion, dialog, dropdown-menu, form, etc.)
- **shadcn/ui**-style component library built on Radix UI primitives
- **class-variance-authority (CVA)** — variant management for UI components
- **react-hook-form 7** — form state and validation
- **motion (Framer Motion)** — animations
- **sonner** — toast notifications
- **lucide-react** — icon library
- **pnpm** — package manager

## Project Layout

```
src/
├── app/
│   ├── components/
│   │   ├── ui/              # shadcn/ui primitives (button, card, dialog, etc.)
│   │   └── *.tsx            # Feature components
│   ├── hooks/               # Custom React hooks
│   ├── api/                 # API client and service modules
│   │   ├── apiClient.ts     # Base apiFetch<T>() wrapper
│   │   ├── types.ts         # API types + adapter functions
│   │   └── *Api.ts          # Domain-specific API services
│   ├── data/                # Types and mock/seed data
│   ├── <route>/page.tsx     # Route pages
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Home page
└── styles/
    ├── tailwind.css
    └── theme.css            # CSS variables + dark mode
```

## Step-by-step

1. **Identify the layer(s)** the feature touches (API type -> service -> hook -> component -> page).
2. **Read existing code** in affected files before writing anything new.
3. **Implement bottom-up**: API type/adapter -> service function -> custom hook -> component -> page.
4. **Run `pnpm build`** to verify no TypeScript errors before finishing.

---

## Conventions

### Components

- **PascalCase** file and component names (e.g., `ProductCard.tsx`).
- **Default export** for every component file.
- **Props interface** defined directly above the component.
- **One component per file** (UI primitives may export multiple related sub-components).
- Add `"use client"` directive at the top for any component using hooks, browser APIs, or event handlers.
- Destructure props in the function signature.
- Prefix event handler props with `on` (e.g., `onNavigate`, `onSelect`).

```typescript
interface ProductCardProps {
  product: Product;
  isFavorite: boolean;
  onToggleFavorite: () => void;
}

export default function ProductCard({ product, isFavorite, onToggleFavorite }: ProductCardProps) {
  return (
    <div className="group relative bg-white ...">
      {/* JSX */}
    </div>
  );
}
```

### UI Primitives (ui/ directory)

- Use **CVA** (`cva`) for variant management.
- Use Radix UI `Slot` (`asChild` prop) for polymorphism.
- Use `cn()` for className merging.
- Include `data-slot` attributes for styling hooks.

```typescript
const buttonVariants = cva(
  "inline-flex items-center justify-center ...",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        outline: "border bg-background hover:bg-accent",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 px-3",
        lg: "h-10 px-6",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);
```

### Styling

- **Tailwind CSS** for all styling — no CSS Modules, no inline `style={{}}` unless truly dynamic.
- **CSS variables** defined in `theme.css`; reference via Tailwind's `bg-primary`, `text-foreground`, etc.
- **Dark mode** via `.dark` class on root (next-themes).
- Use `cn()` utility for conditional / merged classes.
- Mobile-first responsive design using Tailwind breakpoints (`md:`, `lg:`).

### State Management

No global state library — use React hooks + localStorage:

- **Component state**: `useState` / `useReducer` for local UI state.
- **Shared state**: extract to a custom hook in `hooks/` and use wherever needed.
- **Persistence**: localStorage keyed with a domain prefix (e.g., `app_user`, `app_favorites_${userId}`).
- **No Context API or Redux** unless clearly necessary.

### Custom Hooks

- Place in `hooks/`, named `use<Feature>.ts`.
- Return an object with state and actions.
- Handle loading and error states.

```typescript
export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchProducts();
      setProducts(data);
    } catch (e) {
      setError('Failed to load');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { reload(); }, [reload]);

  return { products, isLoading, error, setProducts, reload };
}
```

### API / Service Layer

**Base client** (`api/apiClient.ts`):
- `apiFetch<T>(path, options)` — generic typed fetch wrapper.
- Automatically injects `Authorization: Bearer <token>` from localStorage.
- **401 auto-redirect**: When any API call returns HTTP 401, the client must clear the stored user data from localStorage and redirect to `/login` using `window.location.href` (hard navigation, not `router.push`). This ensures expired or invalid tokens never leave the user on a broken page.
- API base configurable via `NEXT_PUBLIC_BACKEND_URL` or Next.js rewrites.

**Service modules** (`api/*Api.ts`):
- Named exports: `fetchXxx`, `createXxx`, `updateXxx`, `deleteXxx`.
- Accept and return **domain types** (not raw API types); use adapter functions from `types.ts`.

```typescript
export async function fetchProducts(): Promise<Product[]> {
  const data = await apiFetch<ApiProduct[]>('/products');
  return data.map(adaptProduct);
}
```

**Types & adapters** (`api/types.ts`):
- Define `Api*` interfaces matching backend JSON shape.
- Define `*Request` interfaces for POST/PUT bodies.
- Export `adapt*()` functions to convert `Api*` -> domain type.

### Routing

Next.js App Router conventions:
- File-based routing under `src/app/`.
- Use `useRouter()` from `next/navigation` for programmatic navigation.
- Use `redirect()` from `next/navigation` in server components for redirects.

### Forms

Use **react-hook-form** with shadcn/ui `Form` wrapper components:

```typescript
const form = useForm<ProductRequest>({ defaultValues: { name: '' } });

<Form {...form}>
  <form onSubmit={form.handleSubmit(onSubmit)}>
    <FormField control={form.control} name="name" render={({ field }) => (
      <FormItem>
        <FormLabel>Name</FormLabel>
        <FormControl><Input {...field} /></FormControl>
        <FormMessage />
      </FormItem>
    )} />
  </form>
</Form>
```

### Form Validation

1. **Field-level error marking**: On submit, visually mark invalid fields with `border-destructive` on the input and `text-destructive` on the label.
2. **Scroll to first error**: Smoothly scroll to the first invalid field using `scrollIntoView({ behavior: "smooth", block: "center" })`. Use `id="field-<name>"` on wrapper divs to target them.
3. **Error toasts**: Use `toast.error(message)` for validation errors.
4. **Clear errors on input**: When the user fills in a previously invalid field, immediately clear its error state.

### Notifications

Use **sonner** (`toast`) for user feedback:

```typescript
import { toast } from 'sonner';
toast.success('Item created');
toast.error('Failed to delete');
```

### Icons

Use **lucide-react** exclusively:

```typescript
import { Plus, Heart, Settings } from 'lucide-react';
<Plus className="w-4 h-4" />
```

### Animations & Transitions

Use **motion (Framer Motion)** for all UI animations. Every interactive element should feel responsive and polished:

- **Buttons**: Apply subtle scale/opacity transitions on press (`whileTap={{ scale: 0.97 }}`). Use smooth gradient backgrounds within the app's accent color palette for primary buttons.
- **Error states**: Animate error messages and invalid field highlights in/out smoothly using `motion.div` with `initial={{ opacity: 0, y: -4 }}`, `animate={{ opacity: 1, y: 0 }}`, `exit={{ opacity: 0, y: -4 }}`. Wrap in `AnimatePresence` so removal is also animated.
- **Page/route transitions**: Wrap page content in `motion.div` with fade or slide animations for smooth navigation.
- **List items**: Use `motion.div` with `layout` prop for smooth reordering, and `AnimatePresence` for enter/exit animations.
- **Loading states**: Use skeleton placeholders or subtle pulse/fade animations instead of raw spinners.

### Button Gradients

Primary and accent buttons should use **smooth linear gradients** derived from the app's accent color:

```typescript
// Example: gradient button using Tailwind + inline gradient
<button className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground transition-all duration-200">
  Submit
</button>
```

- Gradients should flow between two close shades of the accent color (e.g., `from-primary to-primary/80`).
- Hover states should shift the gradient subtly (lighter or darker) for visual feedback.
- Keep gradients subtle — avoid jarring color jumps.

### UI Standards

- All `<button>` elements must have `cursor: pointer` (set globally in CSS).
- Drop zones for file uploads must support drag-and-drop with visual feedback (highlight border on drag over).
- Image uploads should show a preview of the selected file.

### Responsive Design

All UIs **must** be fully usable on mobile viewports (320px+). Apply these rules:

- **Mobile-first**: Write base styles for mobile, then add `md:` / `lg:` breakpoints for larger screens.
- **Tables with many columns**: On mobile, replace wide tables with a **tab-based layout** or **stacked cards**. Use Radix `Tabs` to let the user switch between column groups, or render each row as a card with key-value pairs stacked vertically.
- **Horizontal overflow**: Never allow horizontal scroll on the page body. If a table must remain tabular on mobile, wrap it in a scrollable container with `overflow-x-auto` and a visible scroll hint (fade or shadow on the right edge).
- **Touch targets**: Interactive elements must be at least 44px tall on mobile. Add extra padding to small buttons/links inside responsive layouts.
- **Navigation**: Collapse desktop nav into a hamburger menu or bottom tab bar on mobile. Use `Sheet` (slide-in drawer) from shadcn/ui for mobile menus.
- **Spacing**: Use tighter padding on mobile (`p-3` / `gap-3`) and wider on desktop (`md:p-6` / `md:gap-6`).
- **Font sizes**: Base text `text-sm` on mobile, `md:text-base` on desktop. Headings scale similarly.
- **Modals/Dialogs**: On mobile, prefer full-screen sheets (`Sheet` with `side="bottom"`) over centered dialogs to maximize usable space.
- **Test mentally**: Before finishing any component, consider how it renders at 375px wide. If any content overflows or becomes unreadable, fix it.

```typescript
// Example: table -> tabs on mobile
<div className="hidden md:block">
  <Table>{/* full table with all columns */}</Table>
</div>
<div className="md:hidden">
  <Tabs defaultValue="general">
    <TabsList>
      <TabsTrigger value="general">General</TabsTrigger>
      <TabsTrigger value="details">Details</TabsTrigger>
    </TabsList>
    <TabsContent value="general">{/* card list with key columns */}</TabsContent>
    <TabsContent value="details">{/* card list with detail columns */}</TabsContent>
  </Tabs>
</div>
```

### Visual Design — Modern & Intentional

The UI must look **designed by a human**, not generated by AI. Follow these principles to avoid the "AI template" look:

- **Asymmetry & hierarchy**: Not everything needs to be perfectly centered or evenly spaced. Use visual weight to guide the eye — larger type for key info, muted secondary text, deliberate whitespace.
- **Restrained color palette**: Use 1 accent color + neutrals. Avoid rainbow dashboards. Let the accent color appear sparingly — in CTAs, active states, and key highlights — not on every element.
- **Typography contrast**: Mix font weights aggressively (`font-medium` for labels, `font-semibold` for headings, `font-normal` for body). Vary sizes meaningfully — don't make everything `text-sm`.
- **Subtle depth**: Use `shadow-sm` or `shadow-md` selectively, not on every card. Prefer border + background tint (`bg-muted/50`) over heavy drop shadows.
- **Micro-interactions that matter**: Animate only what improves UX (button feedback, content transitions, loading states). Skip gratuitous motion — no bouncing icons or spinning logos.
- **Intentional whitespace**: Leave breathing room. Dense UIs feel cheap. Use `py-8 md:py-12` for sections, `gap-4 md:gap-6` for grids. If a section feels cluttered, add space before adding more design.
- **Natural grouping**: Group related info with shared backgrounds or subtle borders, not with heavy cards around everything. A thin `border-b` or `bg-muted/30` section is often better than a bordered card.
- **No decoration for decoration's sake**: Skip decorative gradients on backgrounds, unnecessary icons next to every label, or colored badges on everything. Every visual element must earn its place.
- **Real-world references**: When in doubt, reference the design language of tools like Linear, Vercel, Raycast, or Notion — clean, functional, opinionated.
