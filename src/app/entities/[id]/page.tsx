import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { EntityForm } from '@/components/entities/entity-form';
import { serializeEntity } from '@/lib/serialize';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditEntityPage({ params }: Props) {
  const { id } = await params;
  const rawEntity = await prisma.entity.findUnique({ where: { id } });

  if (!rawEntity) notFound();

  const entity = serializeEntity(rawEntity);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Edit Entity</h1>
        <p className="text-muted-foreground text-sm">
          Update details for <strong>{entity.name}</strong>.
        </p>
      </div>
      <EntityForm entity={entity} />
    </div>
  );
}
