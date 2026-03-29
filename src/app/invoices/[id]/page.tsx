import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { InvoiceForm } from '@/components/invoices/invoice-form';
import { serializeEntity, serializeInvoice } from '@/lib/serialize';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditInvoicePage({ params }: Props) {
  const { id } = await params;

  const [rawInvoice, rawEntities] = await Promise.all([
    prisma.invoice.findUnique({ where: { id } }),
    prisma.entity.findMany({ orderBy: { name: 'asc' } }),
  ]);

  if (!rawInvoice) notFound();

  const invoice = serializeInvoice(rawInvoice);
  const entities = rawEntities.map(serializeEntity);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Edit Invoice</h1>
        <p className="text-muted-foreground text-sm">
          Editing <span className="font-mono font-semibold">{invoice.invoice_number}</span>
        </p>
      </div>
      <InvoiceForm invoice={invoice} entities={entities} />
    </div>
  );
}
