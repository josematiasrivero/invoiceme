'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createInvoice, updateInvoice } from '@/actions/invoices';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import type { Entity, Invoice } from '@/types';

interface Props {
  entities: Entity[];
  invoice?: Invoice;
}

export function InvoiceForm({ entities, invoice }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [originId, setOriginId] = useState(invoice?.origin_id ?? '');
  const [destinationId, setDestinationId] = useState(invoice?.destination_id ?? '');
  const [quantity, setQuantity] = useState<string>(invoice?.quantity?.toString() ?? '1');
  const [unitPrice, setUnitPrice] = useState<string>(invoice?.unit_price?.toString() ?? '');

  const isEdit = !!invoice;
  const today = new Date().toISOString().split('T')[0];

  const originEntity = entities.find((e) => e.id === originId);
  const destinationEntity = entities.find((e) => e.id === destinationId);

  const qty = parseFloat(quantity) || 0;
  const price = parseFloat(unitPrice) || 0;
  const total = qty * price;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    if (!originId || !destinationId) {
      toast.error('Please select both origin and destination.');
      return;
    }
    if (originId === destinationId) {
      toast.error('Origin and destination must be different.');
      return;
    }
    if (qty <= 0) {
      toast.error('Quantity must be greater than zero.');
      return;
    }
    if (price < 0) {
      toast.error('Unit price must be zero or greater.');
      return;
    }

    const payload = {
      date: formData.get('date') as string,
      quantity: qty,
      unit_price: price,
      amount: total,
      service_description: formData.get('service_description') as string,
    };

    startTransition(async () => {
      if (isEdit) {
        const result = await updateInvoice(invoice.id, payload);
        if (result?.error) {
          toast.error(result.error);
        } else {
          toast.success(`Invoice ${invoice.invoice_number} updated.`);
          router.push('/');
        }
      } else {
        const result = await createInvoice({ origin_id: originId, destination_id: destinationId, ...payload });
        if (result?.error) {
          toast.error(result.error);
        } else {
          toast.success(`Invoice ${result.data?.invoice_number} created!`);
          router.push('/');
        }
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {/* Origin / Destination */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>From (Origin){!isEdit && ' *'}</Label>
          {isEdit ? (
            <div className="flex items-center gap-2 h-10 px-3 border rounded-md bg-muted/50 text-sm">
              {originEntity && (
                <span
                  className="inline-block h-3 w-3 rounded-full border shrink-0"
                  style={{ backgroundColor: originEntity.primary_color }}
                />
              )}
              <span>{originEntity?.name ?? '—'}</span>
              <span className="text-muted-foreground text-xs ml-auto font-mono">
                {invoice.invoice_number}
              </span>
            </div>
          ) : (
            <>
              <Select value={originId} onValueChange={setOriginId} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select origin..." />
                </SelectTrigger>
                <SelectContent>
                  {entities.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      <span className="flex items-center gap-2">
                        <span
                          className="inline-block h-3 w-3 rounded-full border"
                          style={{ backgroundColor: e.primary_color }}
                        />
                        {e.name}
                        <span className="text-muted-foreground text-xs">({e.invoice_prefix})</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {originEntity && (
                <p className="text-xs text-muted-foreground">
                  Next invoice:{' '}
                  <span className="font-mono font-semibold">
                    {originEntity.invoice_prefix}-{String(originEntity.invoice_counter + 1).padStart(3, '0')}
                  </span>
                </p>
              )}
            </>
          )}
        </div>

        <div className="space-y-2">
          <Label>To (Destination){!isEdit && ' *'}</Label>
          {isEdit ? (
            <div className="flex items-center gap-2 h-10 px-3 border rounded-md bg-muted/50 text-sm">
              {destinationEntity && (
                <span
                  className="inline-block h-3 w-3 rounded-full border shrink-0"
                  style={{ backgroundColor: destinationEntity.primary_color }}
                />
              )}
              <span>{destinationEntity?.name ?? '—'}</span>
            </div>
          ) : (
            <Select value={destinationId} onValueChange={setDestinationId} required>
              <SelectTrigger>
                <SelectValue placeholder="Select destination..." />
              </SelectTrigger>
              <SelectContent>
                {entities
                  .filter((e) => e.id !== originId)
                  .map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      <span className="flex items-center gap-2">
                        <span
                          className="inline-block h-3 w-3 rounded-full border"
                          style={{ backgroundColor: e.primary_color }}
                        />
                        {e.name}
                      </span>
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {isEdit && (
        <p className="text-xs text-muted-foreground -mt-2">
          Origin and destination cannot be changed when editing — invoice number is preserved.
        </p>
      )}

      {/* Date */}
      <div className="space-y-2 max-w-xs">
        <Label htmlFor="date">Date *</Label>
        <Input
          id="date"
          name="date"
          type="date"
          defaultValue={invoice?.date ?? today}
          required
        />
      </div>

      {/* Service Description */}
      <div className="space-y-2">
        <Label htmlFor="service_description">Service Description *</Label>
        <Input
          id="service_description"
          name="service_description"
          placeholder="e.g. Web development services for Q1 2025"
          defaultValue={invoice?.service_description}
          required
        />
      </div>

      {/* Line item: Qty × Unit Price = Total */}
      <fieldset className="border rounded-lg p-4 space-y-3">
        <legend className="text-sm font-medium px-2">Line Item</legend>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="quantity">Qty *</Label>
            <Input
              id="quantity"
              name="quantity"
              type="number"
              step="0.0001"
              min="0.0001"
              placeholder="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="unit_price">Unit Price (USD) *</Label>
            <Input
              id="unit_price"
              name="unit_price"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={unitPrice}
              onChange={(e) => setUnitPrice(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Total</Label>
            <div className="flex items-center h-10 px-3 border rounded-md bg-muted/50 font-semibold text-sm">
              {total > 0
                ? total.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
                : '—'}
            </div>
          </div>
        </div>
      </fieldset>

      {/* Preview */}
      {originEntity && destinationEntity && (
        <div className="rounded-lg border p-4 bg-muted/30 space-y-1 text-sm">
          <p className="font-medium">Invoice preview</p>
          <p className="text-muted-foreground">
            From: <strong>{originEntity.name}</strong> → To: <strong>{destinationEntity.name}</strong>
          </p>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Theme color:</span>
            <span
              className="inline-block h-4 w-4 rounded border"
              style={{ backgroundColor: originEntity.primary_color }}
            />
            <span className="font-mono text-xs">{originEntity.primary_color}</span>
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <Button type="submit" disabled={isPending}>
          {isPending
            ? (isEdit ? 'Saving...' : 'Creating...')
            : (isEdit ? 'Save Changes' : 'Create Invoice')}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push('/')}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
