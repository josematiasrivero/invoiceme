import type { Entity, Invoice } from '@/types';

export function serializeEntity(e: {
  id: string;
  name: string;
  type: string;
  address: string | null;
  email: string | null;
  abaRouting: string | null;
  accountNumber: string | null;
  bankName: string | null;
  bankAddress: string | null;
  primaryColor: string;
  invoiceLayout: string;
  invoicePrefix: string;
  invoiceCounter: number;
  createdAt: Date;
}): Entity {
  return {
    id: e.id,
    name: e.name,
    type: e.type as Entity['type'],
    address: e.address,
    email: e.email,
    aba_routing: e.abaRouting,
    account_number: e.accountNumber,
    bank_name: e.bankName,
    bank_address: e.bankAddress,
    primary_color: e.primaryColor,
    invoice_layout: e.invoiceLayout as Entity['invoice_layout'],
    invoice_prefix: e.invoicePrefix,
    invoice_counter: e.invoiceCounter,
    created_at: e.createdAt.toISOString(),
  };
}

export function serializeInvoice(inv: {
  id: string;
  invoiceNumber: string;
  originId: string;
  destinationId: string;
  date: Date;
  quantity: unknown;
  unitPrice: unknown;
  amount: unknown;
  serviceDescription: string;
  createdAt: Date;
}): Invoice {
  return {
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
  };
}
