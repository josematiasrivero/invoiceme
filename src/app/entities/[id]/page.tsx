import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { EntityForm } from '@/components/entities/entity-form';
import type { Entity } from '@/types';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditEntityPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: entity } = await supabase
    .from('entities')
    .select('*')
    .eq('id', id)
    .single();

  if (!entity) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Edit Entity</h1>
        <p className="text-muted-foreground text-sm">
          Update details for <strong>{entity.name}</strong>.
        </p>
      </div>
      <EntityForm entity={entity as Entity} />
    </div>
  );
}
