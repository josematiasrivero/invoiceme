---
name: frontend-mobile
description: Tap animations, toast guidelines, and mobile UI conventions for mobile-facing UIs
---

# Frontend Mobile

Guidelines for mobile-facing UIs. Apply these **in addition to frontend-web** when building or modifying components rendered on mobile viewports.

## Tap Animations

Every interactive element (buttons, cards, toggles, icons that act as buttons) **must** have tactile tap feedback using `motion/react`:

```tsx
import { motion } from 'motion/react';

// For buttons and small interactive elements
<motion.button whileTap={{ scale: 0.92 }} transition={{ duration: 0.1 }}>
  ...
</motion.button>

// For cards and larger tappable areas
<motion.div whileTap={{ scale: 0.97 }} transition={{ duration: 0.1 }}>
  ...
</motion.div>
```

### Rules

1. **Use `motion.button`** instead of `<button>` for all mobile-facing buttons. If the element is a `<div>` acting as a button, use `motion.div`.
2. **Scale values**: `0.92` for small elements (icon buttons, nav items), `0.97` for cards/large areas.
3. **Transition**: Always `{ duration: 0.1 }` for snappy feel — no bounce or spring on tap.
4. **Don't duplicate with CSS `active:scale-*`**: If adding `whileTap`, remove any Tailwind `active:scale-*` classes to avoid double animation.
5. **Favorite/like buttons** get an extra pop animation on toggle:
   ```tsx
   <motion.button
     whileTap={{ scale: 0.85 }}
     animate={isActive ? { scale: [1, 1.3, 1] } : { scale: 1 }}
     transition={{ duration: 0.25 }}
   >
     <Heart className={isActive ? 'fill-red-500 text-red-500' : 'text-white'} />
   </motion.button>
   ```
6. **Bottom navigation buttons**: Each nav item should be a `motion.button` with `whileTap={{ scale: 0.92 }}`.
7. **Disabled buttons**: Skip tap animation for disabled state — `whileTap={disabled ? undefined : { scale: 0.92 }}`.

## Toast Notifications

All user-triggered actions **must** show a toast via `sonner`:

```tsx
import { toast } from 'sonner';
```

### When to show toasts

| Action                  | Toast type      | Example message                    |
|-------------------------|-----------------|------------------------------------|
| Add to favorites        | `toast.success` | "Added to favorites"               |
| Remove from favorites   | `toast.error`   | "Removed from favorites"           |
| Action failed (network) | `toast.error`   | "Connection error. Try again."     |
| Content saved           | `toast.success` | "Changes saved"                    |
| Content deleted         | `toast.error`   | "Item deleted"                     |

> Localize toast messages to the project's language.

### Rules

1. **Always show feedback** for destructive or state-changing actions (favorite, delete, save, submit).
2. **Position**: `top-center` for mobile, configured once in the root `<Toaster>`.
3. **Keep messages short** — max ~40 characters.
4. **Don't toast on navigation** or read-only actions (viewing details, scrolling, etc.).
5. **Error toasts on API failure**: Wrap API calls in try/catch and toast the error.

## General Mobile UX

- **No hover-only interactions**: Every `:hover` effect must have a tap/active equivalent. Mobile users can't hover.
- **Touch targets**: Minimum `44x44px` for all tappable elements (use `p-2` or `min-w-[44px] min-h-[44px]`).
- **Feedback is mandatory**: Users must see/feel something on every tap. Silent taps feel broken.
