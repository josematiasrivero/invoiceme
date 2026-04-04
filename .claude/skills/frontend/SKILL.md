---
name: frontend
description: >
  Implement Next.js frontend features for the Archetype project.
  Use when creating or modifying components, hooks, API services,
  pages, or styling. Covers React patterns, state management,
  API integration, and CMS development.
allowed-tools: Read, Edit, Write, Glob, Grep, Bash(cd frontend && pnpm *)
argument-hint: [feature or component to implement]
---

# Frontend Feature Implementation

Implement the frontend feature described in `$ARGUMENTS` following the conventions below.

## Stack

- **Next.js 15** (App Router, file-based routing)
- **React 18** — hooks-based, no class components
- **TypeScript 5** — strict mode; all props and return types must be typed
- **Tailwind CSS 4** — CSS-first approach, no `tailwind.config.js`
- **Radix UI** — 46 accessible primitives (accordion, dialog, dropdown-menu, form, etc.)
- **shadcn/ui**-style component library built on Radix UI primitives
- **class-variance-authority (CVA)** — variant management for UI components
- **react-hook-form 7** — form state and validation
- **motion (Framer Motion)** — animations
- **sonner** — toast notifications
- **lucide-react** — icon library
- **pnpm** — package manager
- Root source: `frontend/src/`

## Project Layout

```
src/
├── app/
│   ├── components/
│   │   ├── ui/              # shadcn/ui primitives (button, card, dialog, etc.)
│   │   ├── figma/           # Figma-exported components
│   │   ├── MainApp.tsx      # Main app container (browse/favorites/detail/settings)
│   │   ├── CMSApp.tsx       # CMS management interface
│   │   ├── HomeScreen.tsx   # Landing page
│   │   └── *.tsx            # Feature components (StationCard, AudioPlayer, etc.)
│   ├── hooks/               # Custom React hooks
│   │   ├── useAuth.ts
│   │   ├── useStations.ts
│   │   ├── useCarousels.ts
│   │   ├── useShorts.ts
│   │   └── useFavorites.ts
│   ├── api/                 # API client and service modules
│   │   ├── apiClient.ts     # Base apiFetch<T>() wrapper
│   │   ├── types.ts         # API types + adapter functions
│   │   ├── stationsApi.ts
│   │   ├── carouselsApi.ts
│   │   └── shortsApi.ts
│   ├── data/
│   │   └── mockData.ts      # Domain types + mock data
│   ├── cms/                 # CMS route pages
│   │   ├── page.tsx         # /cms → redirects to /cms/stations
│   │   ├── stations/page.tsx
│   │   ├── carousels/page.tsx
│   │   └── shorts/page.tsx
│   ├── app/
│   │   └── page.tsx         # /app route
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # / home
└── styles/
    ├── index.css
    ├── tailwind.css
    ├── theme.css            # CSS variables + dark mode
    └── fonts.css
```

## Step-by-step

1. **Identify the layer(s)** the feature touches (API type → service → hook → component → page).
2. **Read existing code** in affected files before writing anything new.
3. **Implement bottom-up**: API type/adapter → service function → custom hook → component → page.
4. **Run `pnpm build`** from the `frontend/` directory to verify no TypeScript errors before finishing.

---

## Conventions

### Components

- **PascalCase** file and component names (e.g., `StationCard.tsx`).
- **Default export** for every component file.
- **Props interface** defined directly above the component.
- **One component per file** (UI primitives may export multiple related sub-components).
- Add `"use client"` directive at the top for any component using hooks, browser APIs, or event handlers.
- Destructure props in the function signature.
- Prefix event handler props with `on` (e.g., `onNavigate`, `onToggleFavorite`).

```typescript
interface StationCardProps {
  station: RadioStation;
  isFavorite: boolean;
  onToggleFavorite: () => void;
}

export default function StationCard({ station, isFavorite, onToggleFavorite }: StationCardProps) {
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
- Use `cn()` utility (from `ui/utils.ts`) for conditional / merged classes.
- Mobile-first responsive design using Tailwind breakpoints (`md:`, `lg:`).

### State Management

No global state library — use React hooks + localStorage:

- **Component state**: `useState` / `useReducer` for local UI state.
- **Shared state**: extract to a custom hook in `hooks/` and use wherever needed.
- **Persistence**: localStorage keyed with a domain prefix (e.g., `audiostream_user`, `audiostream_favorites_${userId}`).
- **No Context API or Redux** unless clearly necessary.

### Custom Hooks

- Place in `src/app/hooks/`, named `use<Feature>.ts`.
- Return an object with state and actions.
- Handle loading and error states.
- Use `useEffect` for data fetching and side effects.

```typescript
export function useStations() {
  const [stations, setStations] = useState<RadioStation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchStations();
      setStations(data);
    } catch (e) {
      setError('Failed to load stations');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { reload(); }, [reload]);

  return { stations, isLoading, error, setStations, reload };
}
```

### API / Service Layer

**Base client** (`api/apiClient.ts`):
- `apiFetch<T>(path, options)` — generic typed fetch.
- Automatically injects `Authorization: Bearer <token>` from localStorage.
- API base: `/api/v1` (proxied to `http://localhost:8080/api/v1` via next.config.ts rewrites).
- Production URL resolved from `NEXT_PUBLIC_BACKEND_URL` env var.

**Service modules** (`api/*Api.ts`):
- Named exports: `fetchXxx`, `createXxx`, `updateXxx`, `deleteXxx`.
- Accept and return **domain types** (not raw API types); use adapter functions from `types.ts`.

```typescript
// api/stationsApi.ts
export async function fetchStations(): Promise<RadioStation[]> {
  const data = await apiFetch<ApiStation[]>('/stations');
  return data.map(adaptStation);
}

export async function createStation(req: StationRequest): Promise<RadioStation> {
  const data = await apiFetch<ApiStation>('/stations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  });
  return adaptStation(data);
}
```

**Types & adapters** (`api/types.ts`):
- Define `Api*` interfaces matching backend JSON shape.
- Define `*Request` interfaces for POST/PUT bodies.
- Export `adapt*()` functions to convert `Api*` → domain type.

```typescript
export interface ApiStation {
  uuid: string;
  artworkUrl: string;
  name: string;
  // ...
}

export interface StationRequest {
  name: string;
  artworkUrl: string;
  streamUrl: string;
  // ...
}

export function adaptStation(s: ApiStation): RadioStation {
  return { id: s.uuid, artwork: s.artworkUrl, name: s.name };
}
```

### Routing

Next.js App Router conventions:
- `src/app/page.tsx` → `/`
- `src/app/app/page.tsx` → `/app`
- `src/app/cms/[resource]/page.tsx` → `/cms/[resource]`
- Use `useRouter()` from `next/navigation` for programmatic navigation.
- Use `redirect()` from `next/navigation` in server components/pages for redirects.

### Forms

Use **react-hook-form** with the `Form` wrapper components from `ui/form.tsx`:

```typescript
const form = useForm<StationRequest>({ defaultValues: { name: '', streamUrl: '' } });

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

### Notifications

Use **sonner** (`toast`) for user feedback:

```typescript
import { toast } from 'sonner';
toast.success('Station created');
toast.error('Failed to delete station');
```

### Icons

Use **lucide-react** exclusively:

```typescript
import { Play, Heart, Settings } from 'lucide-react';
<Play className="w-4 h-4" />
```

---

## Running locally

```bash
cd frontend
pnpm dev
```

App runs at `http://localhost:3000`. API calls are proxied to `http://localhost:8080`.

## Building

```bash
cd frontend
pnpm build
```

TypeScript errors will surface here — fix all before finishing.
