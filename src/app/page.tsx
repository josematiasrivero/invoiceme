import Link from 'next/link';
import { Suspense } from 'react';
import { prisma } from '@/lib/db';
import { InvoiceList } from '@/components/invoices/invoice-list';
import { InvoiceFilters } from '@/components/invoices/invoice-filters';
import { BatchDownloadButton } from '@/components/invoices/invoice-actions';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { serializeEntity } from '@/lib/serialize';
import type { Entity, Invoice } from '@/types';

interface Props {
  searchParams: Promise<{ origin_id?: string; destination_id?: string }>;
}

export default async function DashboardPage({ searchParams }: Props) {
  const { origin_id, destination_id } = await searchParams;

  const [rawInvoices, rawEntities] = await Promise.all([
    prisma.invoice.findMany({
      where: {
        ...(origin_id && { originId: origin_id }),
        ...(destination_id && { destinationId: destination_id }),
      },
      include: {
        origin: true,
        destination: true,
      },
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    }),
    prisma.entity.findMany({ orderBy: { name: 'asc' } }),
  ]);

  const entities: Entity[] = rawEntities.map(serializeEntity);

  const invoices: Invoice[] = rawInvoices.map((inv) => ({
    id: inv.id,
    invoice_number: inv.invoiceNumber,
    origin_id: inv.originId,
    destination_id: inv.destinationId,
    date: inv.date.toISOString().split('T')[0],
    quantity: Number(inv.quantity),
    unit_price: Number(inv.unitPrice),
    amount: Number(inv.amount),
    service_description: inv.serviceDescription,
    created_at: inv.createdAt.toISOString(),
    origin: serializeEntity(inv.origin),
    destination: serializeEntity(inv.destination),
  }));

  const entitiesMap = Object.fromEntries(entities.map((e) => [e.id, e]));

  const totalAmount = invoices.reduce((sum, inv) => sum + Number(inv.amount), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Invoices</h1>
          <p className="text-muted-foreground text-sm">
            {invoices.length} invoice{invoices.length !== 1 ? 's' : ''}
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
            invoices={invoices}
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
          entities={entities}
          originId={origin_id}
          destinationId={destination_id}
        />
      </Suspense>

      <InvoiceList invoices={invoices} entities={entities} />
    </div>
  );
}
