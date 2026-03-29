import { prisma } from '@/lib/db';
import { InvoiceForm } from '@/components/invoices/invoice-form';
import { serializeEntity } from '@/lib/serialize';

export default async function NewInvoicePage() {
  const rawEntities = await prisma.entity.findMany({ orderBy: { name: 'asc' } });
  const entities = rawEntities.map(serializeEntity);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">New Invoice</h1>
        <p className="text-muted-foreground text-sm">
          Create an invoice between two entities in the system.
        </p>
      </div>
      <InvoiceForm entities={entities} />
    </div>
  );
}
