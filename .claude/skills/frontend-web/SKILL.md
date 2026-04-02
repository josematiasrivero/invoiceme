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

### UI Standards

- All `<button>` elements must have `cursor: pointer` (set globally in CSS).
- Drop zones for file uploads must support drag-and-drop with visual feedback (highlight border on drag over).
- Image uploads should show a preview of the selected file.
