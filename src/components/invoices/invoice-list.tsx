'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { deleteInvoice } from '@/actions/invoices';
import { PdfDownloadButton } from '@/components/pdf/pdf-download-button';
import { Button } from '@/components/ui/button';
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
import type { Invoice, Entity } from '@/types';

interface Props {
  invoices: Invoice[];
  entities: Entity[];
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatAmount(amount: number | string): string {
  return Number(amount).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
  });
}

export function InvoiceList({ invoices, entities }: Props) {
  const [deleteTarget, setDeleteTarget] = useState<Invoice | null>(null);
  const [isPending, startTransition] = useTransition();

  const entitiesMap = Object.fromEntries(entities.map((e) => [e.id, e]));

  function handleDelete() {
    if (!deleteTarget) return;
    startTransition(async () => {
      const result = await deleteInvoice(deleteTarget.id);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success(`Invoice ${deleteTarget.invoice_number} deleted.`);
      }
      setDeleteTarget(null);
    });
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Invoice #</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>From</TableHead>
            <TableHead>To</TableHead>
            <TableHead>Service</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                No invoices found. Create your first invoice!
              </TableCell>
            </TableRow>
          )}
          {invoices.map((invoice) => {
            const origin =
              (invoice.origin as Entity) ?? entitiesMap[invoice.origin_id];
            const destination =
              (invoice.destination as Entity) ?? entitiesMap[invoice.destination_id];

            return (
              <TableRow key={invoice.id}>
                <TableCell>
                  <span className="font-mono font-semibold text-sm">
                    {invoice.invoice_number}
                  </span>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatDate(invoice.date)}
                </TableCell>
                <TableCell>
                  {origin ? (
                    <span className="flex items-center gap-2">
                      <span
                        className="inline-block h-3 w-3 rounded-full border shrink-0"
                        style={{ backgroundColor: origin.primary_color }}
                      />
                      <span className="text-sm">{origin.name}</span>
                    </span>
                  ) : (
                    <span className="text-muted-foreground text-sm">Unknown</span>
                  )}
                </TableCell>
                <TableCell className="text-sm">{destination?.name ?? '—'}</TableCell>
                <TableCell className="text-sm text-muted-foreground max-w-48 truncate">
                  {invoice.service_description}
                </TableCell>
                <TableCell className="text-right font-semibold text-sm">
                  {formatAmount(invoice.amount)}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    {origin && destination && (
                      <PdfDownloadButton
                        invoice={invoice}
                        origin={origin}
                        destination={destination}
                      />
                    )}
                    <Button variant="ghost" size="icon" asChild>
                      <Link href={`/invoices/${invoice.id}`}>
                        <Pencil className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setDeleteTarget(invoice)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete invoice</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete invoice{' '}
              <strong>{deleteTarget?.invoice_number}</strong>? This action cannot be undone.
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
