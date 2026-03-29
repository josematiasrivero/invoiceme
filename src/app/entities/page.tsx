import Link from 'next/link';
import { prisma } from '@/lib/db';
import { EntityList } from '@/components/entities/entity-list';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { serializeEntity } from '@/lib/serialize';

export default async function EntitiesPage() {
  const rawEntities = await prisma.entity.findMany({ orderBy: { name: 'asc' } });
  const entities = rawEntities.map(serializeEntity);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Clients &amp; Providers</h1>
          <p className="text-muted-foreground text-sm">
            Manage your entities, their bank details, and invoice color themes.
          </p>
        </div>
        <Button asChild>
          <Link href="/entities/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            New Entity
          </Link>
        </Button>
      </div>

      <EntityList entities={entities} />
    </div>
  );
}
