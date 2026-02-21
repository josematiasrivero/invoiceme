'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Archive } from 'lucide-react';
import { toast } from 'sonner';
import type { Invoice, Entity } from '@/types';

interface Props {
  invoices: Invoice[];
  entities: Record<string, Entity>;
}

export function BatchDownloadButton({ invoices, entities }: Props) {
  const [loading, setLoading] = useState(false);

  async function handleBatchDownload() {
    if (invoices.length === 0) return;
    setLoading(true);

    try {
      const { pdf } = await import('@react-pdf/renderer');
      const { InvoiceDocument } = await import('@/components/pdf/invoice-document');
      const JSZip = (await import('jszip')).default;

      const zip = new JSZip();

      const BATCH_SIZE = 5;
      for (let i = 0; i < invoices.length; i += BATCH_SIZE) {
        const batch = invoices.slice(i, i + BATCH_SIZE);
        await Promise.all(
          batch.map(async (invoice) => {
            const origin =
              (invoice.origin as Entity) ?? entities[invoice.origin_id];
            const destination =
              (invoice.destination as Entity) ?? entities[invoice.destination_id];
            if (!origin || !destination) return;

            const blob = await pdf(
              <InvoiceDocument
                invoice={invoice}
                origin={origin}
                destination={destination}
              />
            ).toBlob();

            zip.file(`${invoice.invoice_number}.pdf`, blob);
          })
        );
      }

      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoices-${Date.now()}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success(`Downloaded ${invoices.length} invoice${invoices.length > 1 ? 's' : ''}`);
    } catch (err) {
      toast.error('Failed to generate PDFs. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      onClick={handleBatchDownload}
      disabled={loading || invoices.length === 0}
      variant="outline"
    >
      <Archive className="mr-2 h-4 w-4" />
      {loading
        ? `Generating ${invoices.length} PDFs...`
        : `Download All (${invoices.length})`}
    </Button>
  );
}
