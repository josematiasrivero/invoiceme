'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createEntity, updateEntity } from '@/actions/entities';
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
import { EntityColorPicker } from './entity-color-picker';
import { InvoiceLayoutPreviewButton } from '@/components/pdf/invoice-layout-preview-button';
import type { Entity, EntityType, InvoiceLayout } from '@/types';
import { toast } from 'sonner';

interface Props {
  entity?: Entity;
}

export function EntityForm({ entity }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [entityType, setEntityType] = useState<EntityType>(entity?.type ?? 'client');
  const [invoiceLayout, setInvoiceLayout] = useState<InvoiceLayout>(entity?.invoice_layout ?? 'classic');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const input = {
      name: formData.get('name') as string,
      type: entityType,
      address: (formData.get('address') as string) || undefined,
      email: (formData.get('email') as string) || undefined,
      aba_routing: (formData.get('aba_routing') as string) || undefined,
      account_number: (formData.get('account_number') as string) || undefined,
      bank_name: (formData.get('bank_name') as string) || undefined,
      bank_address: (formData.get('bank_address') as string) || undefined,
      primary_color: formData.get('primary_color') as string,
      invoice_layout: invoiceLayout,
      invoice_prefix: formData.get('invoice_prefix') as string,
    };

    startTransition(async () => {
      const result = entity
        ? await updateEntity(entity.id, input)
        : await createEntity(input);

      if (result?.error) {
        toast.error(result.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Entity Name *</Label>
          <Input
            id="name"
            name="name"
            defaultValue={entity?.name}
            placeholder="Acme Corp"
            required
          />
        </div>
        <div className="space-y-2">
          <Label>Type *</Label>
          <Select
            value={entityType}
            onValueChange={(v) => setEntityType(v as EntityType)}
            name="type"
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="client">Client</SelectItem>
              <SelectItem value="provider">Provider</SelectItem>
              <SelectItem value="both">Both</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="invoice_prefix">Invoice Prefix *</Label>
        <Input
          id="invoice_prefix"
          name="invoice_prefix"
          defaultValue={entity?.invoice_prefix}
          placeholder="e.g. ACME"
          maxLength={10}
          required
          disabled={!!entity}
        />
        <p className="text-xs text-muted-foreground">
          {entity
            ? 'Prefix cannot be changed after creation.'
            : 'Invoices will be numbered as PREFIX-001, PREFIX-002, etc. Cannot be changed later.'}
        </p>
      </div>

      <fieldset className="space-y-4 border rounded-lg p-4">
        <legend className="text-sm font-medium px-2">Address & Contact (Bill To)</legend>
        <div className="space-y-2">
          <Label htmlFor="address">Address</Label>
          <Input
            id="address"
            name="address"
            defaultValue={entity?.address ?? ''}
            placeholder="123 Main St, City, State 12345"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            defaultValue={entity?.email ?? ''}
            placeholder="billing@company.com"
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Shown on invoices when this entity is the Bill To (client).
        </p>
      </fieldset>

      <fieldset className="space-y-4 border rounded-lg p-4">
        <legend className="text-sm font-medium px-2">Banking Information (From)</legend>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="aba_routing">ABA Routing Number</Label>
            <Input
              id="aba_routing"
              name="aba_routing"
              defaultValue={entity?.aba_routing ?? ''}
              maxLength={9}
              placeholder="021000021"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="account_number">Account Number</Label>
            <Input
              id="account_number"
              name="account_number"
              defaultValue={entity?.account_number ?? ''}
              placeholder="1234567890"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="bank_name">Bank Name</Label>
          <Input
            id="bank_name"
            name="bank_name"
            defaultValue={entity?.bank_name ?? ''}
            placeholder="Chase Bank"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="bank_address">Bank Address</Label>
          <Input
            id="bank_address"
            name="bank_address"
            defaultValue={entity?.bank_address ?? ''}
            placeholder="270 Park Ave, New York, NY 10017"
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Shown on invoices when this entity is the From (provider), for wire/ACH details.
        </p>
      </fieldset>

      <EntityColorPicker defaultValue={entity?.primary_color ?? '#1D4ED8'} />

      <div className="space-y-2">
        <Label>Invoice Layout</Label>
        <Select
          value={invoiceLayout}
          onValueChange={(v) => setInvoiceLayout(v as InvoiceLayout)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="classic">Classic — Colored header, From/Bill To side by side</SelectItem>
            <SelectItem value="minimal">Minimal — Clean lines, lots of whitespace</SelectItem>
            <SelectItem value="sidebar">Sidebar — From in left column, content on right</SelectItem>
            <SelectItem value="compact">Compact — Dense, smaller fonts</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Layout used when generating PDF invoices from this entity.
        </p>
        <InvoiceLayoutPreviewButton />
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Saving...' : entity ? 'Update Entity' : 'Create Entity'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/entities')}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
