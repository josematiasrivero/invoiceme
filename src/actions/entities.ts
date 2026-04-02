'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import type { CreateEntityInput } from '@/types';

export async function createEntity(input: CreateEntityInput) {
  try {
    await prisma.entity.create({
      data: {
        ...input,
        invoicePrefix: input.invoice_prefix.toUpperCase(),
        primaryColor: input.primary_color,
        invoiceLayout: input.invoice_layout ?? 'classic',
        abaRouting: input.aba_routing,
        accountNumber: input.account_number,
        bankName: input.bank_name,
        bankAddress: input.bank_address,
        defaultServiceDescription: input.default_service_description,
      },
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Failed to create entity';
    return { error: message };
  }

  revalidatePath('/entities');
  redirect('/entities');
}

export async function updateEntity(id: string, input: Partial<CreateEntityInput>) {
  try {
    await prisma.entity.update({
      where: { id },
      data: {
        ...(input.name !== undefined && { name: input.name }),
        ...(input.type !== undefined && { type: input.type }),
        ...(input.address !== undefined && { address: input.address }),
        ...(input.email !== undefined && { email: input.email }),
        ...(input.aba_routing !== undefined && { abaRouting: input.aba_routing }),
        ...(input.account_number !== undefined && { accountNumber: input.account_number }),
        ...(input.bank_name !== undefined && { bankName: input.bank_name }),
        ...(input.bank_address !== undefined && { bankAddress: input.bank_address }),
        ...(input.default_service_description !== undefined && { defaultServiceDescription: input.default_service_description }),
        ...(input.primary_color !== undefined && { primaryColor: input.primary_color }),
        ...(input.invoice_layout !== undefined && { invoiceLayout: input.invoice_layout }),
        ...(input.invoice_prefix != null && { invoicePrefix: input.invoice_prefix.toUpperCase() }),
      },
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Failed to update entity';
    return { error: message };
  }

  revalidatePath('/entities');
  revalidatePath(`/entities/${id}`);
  redirect('/entities');
}

export async function deleteEntity(id: string) {
  try {
    await prisma.entity.delete({ where: { id } });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Failed to delete entity';
    return { error: message };
  }

  revalidatePath('/entities');
  return { success: true };
}
