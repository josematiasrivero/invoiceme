'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileText } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  /** Optional: CSS selector for the primary_color input (e.g. in entity form). Falls back to #1D4ED8 if not found. */
  primaryColorSelector?: string;
}

export function InvoiceLayoutPreviewButton({ primaryColorSelector = 'input[name="primary_color"]' }: Props) {
  const [loading, setLoading] = useState(false);

  async function handlePreview() {
    setLoading(true);
    try {
      const colorEl = document.querySelector<HTMLInputElement>(primaryColorSelector);
      const primaryColor = colorEl?.value && /^#[0-9A-Fa-f]{6}$/.test(colorEl.value) ? colorEl.value : '#1D4ED8';

      const { pdf } = await import('@react-pdf/renderer');
      const { InvoiceLayoutPreviewDocument } = await import('./invoice-layout-preview');

      const blob = await pdf(<InvoiceLayoutPreviewDocument primaryColor={primaryColor} />).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'invoice-layouts-preview.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error('Failed to generate preview.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button type="button" variant="outline" size="sm" onClick={handlePreview} disabled={loading}>
      <FileText className="mr-2 h-4 w-4" />
      {loading ? '...' : 'Preview layouts'}
    </Button>
  );
}
