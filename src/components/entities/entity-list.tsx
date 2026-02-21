'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { deleteEntity } from '@/actions/entities';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { Entity } from '@/types';

interface Props {
  entities: Entity[];
}

const typeBadgeVariant: Record<string, 'default' | 'secondary' | 'outline'> = {
  client: 'default',
  provider: 'secondary',
  both: 'outline',
};

export function EntityList({ entities }: Props) {
  const [deleteTarget, setDeleteTarget] = useState<Entity | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!deleteTarget) return;
    startTransition(async () => {
      const result = await deleteEntity(deleteTarget.id);
      if (result?.error) {
        toast.error(
          result.error.includes('foreign key')
            ? 'Cannot delete: this entity has associated invoices.'
            : result.error
        );
      } else {
        toast.success(`"${deleteTarget.name}" deleted.`);
      }
      setDeleteTarget(null);
    });
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Prefix</TableHead>
            <TableHead>Bank</TableHead>
            <TableHead>Color</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entities.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                No entities yet. Create your first client or provider.
              </TableCell>
            </TableRow>
          )}
          {entities.map((entity) => (
            <TableRow key={entity.id}>
              <TableCell className="font-medium">{entity.name}</TableCell>
              <TableCell>
                <Badge variant={typeBadgeVariant[entity.type]}>
                  {entity.type}
                </Badge>
              </TableCell>
              <TableCell className="font-mono text-sm">{entity.invoice_prefix}</TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {entity.bank_name || '—'}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <div
                    className="h-5 w-5 rounded border"
                    style={{ backgroundColor: entity.primary_color }}
                  />
                  <span className="font-mono text-xs text-muted-foreground">
                    {entity.primary_color}
                  </span>
                </div>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  <Button variant="ghost" size="icon" asChild>
                    <Link href={`/entities/${entity.id}`}>
                      <Pencil className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setDeleteTarget(entity)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete entity</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{deleteTarget?.name}</strong>? This action
              cannot be undone. Entities with existing invoices cannot be deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isPending}>
              {isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
