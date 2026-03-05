'use client';

import { Document } from '@react-pdf/renderer';
import { InvoicePageContent } from './invoice-document';
import type { Invoice, Entity } from '@/types';
import type { InvoiceLayout } from '@/types';

const LAYOUTS: InvoiceLayout[] = ['classic', 'minimal', 'sidebar', 'compact'];

const MOCK_INVOICE: Invoice = {
  id: 'preview',
  invoice_number: 'DEMO-001',
  origin_id: 'preview-origin',
  destination_id: 'preview-dest',
  date: '2025-03-05',
  quantity: 2,
  unit_price: 2500,
  amount: 5000,
  service_description: 'Professional consulting services — Strategy review, implementation support, and recommendations',
  created_at: new Date().toISOString(),
};

function createMockOrigin(primaryColor: string, layout: InvoiceLayout): Entity {
  return {
    id: 'preview-origin',
    name: 'Acme Consulting LLC',
    type: 'provider',
    address: '270 Park Ave, New York, NY 10017',
    email: 'info@acmeconsulting.com',
    aba_routing: '021000021',
    account_number: '1234567890',
    bank_name: 'Chase Bank',
    bank_address: '270 Park Ave, New York, NY 10017',
    primary_color: primaryColor,
    invoice_layout: layout,
    invoice_prefix: 'ACME',
    invoice_counter: 1,
    created_at: new Date().toISOString(),
  };
}

const MOCK_DESTINATION: Entity = {
  id: 'preview-dest',
  name: 'Global Services Inc',
  type: 'client',
  address: '420 Montgomery St, San Francisco, CA 94104',
  email: 'billing@globalservices.com',
  aba_routing: null,
  account_number: null,
  bank_name: null,
  bank_address: null,
  primary_color: '#1D4ED8',
  invoice_layout: 'classic',
  invoice_prefix: 'GLOB',
  invoice_counter: 1,
  created_at: new Date().toISOString(),
};

interface Props {
  primaryColor?: string;
}

export function InvoiceLayoutPreviewDocument({ primaryColor = '#1D4ED8' }: Props) {
  return (
    <Document>
      {LAYOUTS.map((layout) => (
        <InvoicePageContent
          key={layout}
          invoice={MOCK_INVOICE}
          origin={createMockOrigin(primaryColor, layout)}
          destination={MOCK_DESTINATION}
        />
      ))}
    </Document>
  );
}
