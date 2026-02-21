import { createClient } from '@/lib/supabase/server';
import { InvoiceForm } from '@/components/invoices/invoice-form';
import type { Entity } from '@/types';

export default async function NewInvoicePage() {
  const supabase = await createClient();
  const { data: entities } = await supabase
    .from('entities')
    .select('*')
    .order('name');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">New Invoice</h1>
        <p className="text-muted-foreground text-sm">
          Create an invoice between two entities in the system.
        </p>
      </div>
      <InvoiceForm entities={(entities ?? []) as Entity[]} />
    </div>
  );
}
