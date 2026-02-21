import Link from 'next/link';
import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { InvoiceList } from '@/components/invoices/invoice-list';
import { InvoiceFilters } from '@/components/invoices/invoice-filters';
import { BatchDownloadButton } from '@/components/invoices/invoice-actions';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import type { Entity, Invoice } from '@/types';

interface Props {
  searchParams: Promise<{ origin_id?: string; destination_id?: string }>;
}

export default async function DashboardPage({ searchParams }: Props) {
  const { origin_id, destination_id } = await searchParams;

  const supabase = await createClient();

  let query = supabase
    .from('invoices')
    .select(
      `
      *,
      origin:entities!invoices_origin_id_fkey(*),
      destination:entities!invoices_destination_id_fkey(*)
    `
    )
    .order('date', { ascending: false })
    .order('created_at', { ascending: false });

  if (origin_id) {
    query = query.eq('origin_id', origin_id);
  }
  if (destination_id) {
    query = query.eq('destination_id', destination_id);
  }

  const [{ data: invoices }, { data: entities }] = await Promise.all([
    query,
    supabase.from('entities').select('*').order('name'),
  ]);

  const entitiesMap = Object.fromEntries(
    ((entities ?? []) as Entity[]).map((e) => [e.id, e])
  );

  const totalAmount = (invoices ?? []).reduce(
    (sum, inv) => sum + Number(inv.amount),
    0
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Invoices</h1>
          <p className="text-muted-foreground text-sm">
            {invoices?.length ?? 0} invoice{(invoices?.length ?? 0) !== 1 ? 's' : ''}
            {totalAmount > 0 && (
              <> · Total:{' '}
                <strong>
                  {totalAmount.toLocaleString('en-US', {
                    style: 'currency',
                    currency: 'USD',
                  })}
                </strong>
              </>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <BatchDownloadButton
            invoices={(invoices ?? []) as Invoice[]}
            entities={entitiesMap}
          />
          <Button asChild>
            <Link href="/invoices/new">
              <PlusCircle className="mr-2 h-4 w-4" />
              New Invoice
            </Link>
          </Button>
        </div>
      </div>

      <Suspense>
        <InvoiceFilters
          entities={(entities ?? []) as Entity[]}
          originId={origin_id}
          destinationId={destination_id}
        />
      </Suspense>

      <InvoiceList
        invoices={(invoices ?? []) as Invoice[]}
        entities={(entities ?? []) as Entity[]}
      />
    </div>
  );
}
