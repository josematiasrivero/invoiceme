'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import type { CreateInvoiceInput } from '@/types';

async function generateInvoiceNumber(entityId: string): Promise<string> {
  // Use a transaction with row-level locking to atomically generate invoice numbers
  return await prisma.$transaction(async (tx) => {
    const entity = await tx.$queryRaw<{ invoice_prefix: string; invoice_counter: number }[]>`
      SELECT invoice_prefix, invoice_counter + 1 as invoice_counter
      FROM entities
      WHERE id = ${entityId}::uuid
      FOR UPDATE
    `;

    if (!entity.length) throw new Error('Entity not found');

    const { invoice_prefix, invoice_counter } = entity[0];

    await tx.$executeRaw`
      UPDATE entities SET invoice_counter = ${invoice_counter} WHERE id = ${entityId}::uuid
    `;

    return `${invoice_prefix}-${String(invoice_counter).padStart(3, '0')}`;
  });
}

export async function createInvoice(input: CreateInvoiceInput) {
  try {
    const invoiceNumber = await generateInvoiceNumber(input.origin_id);

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        originId: input.origin_id,
        destinationId: input.destination_id,
        date: new Date(input.date),
        quantity: input.quantity,
        unitPrice: input.unit_price,
        amount: input.amount,
        serviceDescription: input.service_description,
      },
    });

    revalidatePath('/');
    return { data: serializeInvoice(invoice) };
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Failed to create invoice';
    return { error: message };
  }
}

export async function updateInvoice(
  id: string,
  input: Omit<CreateInvoiceInput, 'origin_id' | 'destination_id'>
) {
  try {
    const invoice = await prisma.invoice.update({
      where: { id },
      data: {
        date: new Date(input.date),
        quantity: input.quantity,
        unitPrice: input.unit_price,
        amount: input.amount,
        serviceDescription: input.service_description,
      },
    });

    revalidatePath('/');
    revalidatePath(`/invoices/${id}`);
    return { data: serializeInvoice(invoice) };
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Failed to update invoice';
    return { error: message };
  }
}

export async function deleteInvoice(id: string) {
  try {
    await prisma.invoice.delete({ where: { id } });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Failed to delete invoice';
    return { error: message };
  }

  revalidatePath('/');
  return { success: true };
}

// Serialize Prisma Decimal fields to numbers for the frontend
function serializeInvoice(invoice: {
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
}) {
  return {
    id: invoice.id,
    invoice_number: invoice.invoiceNumber,
    origin_id: invoice.originId,
    destination_id: invoice.destinationId,
    date: invoice.date.toISOString().split('T')[0],
    quantity: Number(invoice.quantity),
    unit_price: Number(invoice.unitPrice),
    amount: Number(invoice.amount),
    service_description: invoice.serviceDescription,
    created_at: invoice.createdAt.toISOString(),
  };
}
