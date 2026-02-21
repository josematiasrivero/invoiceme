'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { toast } from 'sonner';
import type { Invoice, Entity } from '@/types';

interface Props {
  invoice: Invoice;
  origin: Entity;
  destination: Entity;
}

export function PdfDownloadButton({ invoice, origin, destination }: Props) {
  const [loading, setLoading] = useState(false);

  async function handleDownload() {
    setLoading(true);
    try {
      const { pdf } = await import('@react-pdf/renderer');
      const { InvoiceDocument } = await import('./invoice-document');

      const blob = await pdf(
        <InvoiceDocument
          invoice={invoice}
          origin={origin}
          destination={destination}
        />
      ).toBlob();

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${invoice.invoice_number}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error('Failed to generate PDF.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={handleDownload} disabled={loading}>
      <Download className="mr-2 h-4 w-4" />
      {loading ? '...' : 'PDF'}
    </Button>
  );
}
