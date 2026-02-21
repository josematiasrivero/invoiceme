import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { InvoiceForm } from '@/components/invoices/invoice-form';
import type { Entity, Invoice } from '@/types';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditInvoicePage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: invoice }, { data: entities }] = await Promise.all([
    supabase
      .from('invoices')
      .select('*')
      .eq('id', id)
      .single(),
    supabase
      .from('entities')
      .select('*')
      .order('name'),
  ]);

  if (!invoice) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Edit Invoice</h1>
        <p className="text-muted-foreground text-sm">
          Editing <span className="font-mono font-semibold">{invoice.invoice_number}</span>
        </p>
      </div>
      <InvoiceForm
        invoice={invoice as Invoice}
        entities={(entities ?? []) as Entity[]}
      />
    </div>
  );
}
