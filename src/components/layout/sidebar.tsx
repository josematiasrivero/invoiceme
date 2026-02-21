'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FileText, Users, PlusCircle, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { signOut } from '@/actions/auth';
import { Button } from '@/components/ui/button';

const navItems = [
  { href: '/', label: 'Invoices', icon: FileText },
  { href: '/invoices/new', label: 'New Invoice', icon: PlusCircle },
  { href: '/entities', label: 'Clients & Providers', icon: Users },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex flex-col w-56 min-h-screen border-r bg-card px-3 py-4 shrink-0">
      <div className="flex items-center gap-2 px-2 mb-8">
        <FileText className="h-6 w-6 text-primary" />
        <span className="font-bold text-lg">InvoiceMe</span>
      </div>

      <nav className="flex-1 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
              pathname === href
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        ))}
      </nav>

      <form action={signOut}>
        <Button
          type="submit"
          variant="ghost"
          className="w-full justify-start gap-3 text-muted-foreground"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </Button>
      </form>
    </aside>
  );
}
