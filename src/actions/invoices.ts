'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { CreateInvoiceInput } from '@/types';

export async function createInvoice(input: CreateInvoiceInput) {
  const supabase = await createClient();

  const { data: invoiceNumber, error: fnError } = await supabase.rpc(
    'generate_invoice_number',
    { entity_id: input.origin_id }
  );

  if (fnError) {
    return { error: fnError.message };
  }

  const { data, error } = await supabase
    .from('invoices')
    .insert({
      invoice_number: invoiceNumber as string,
      origin_id: input.origin_id,
      destination_id: input.destination_id,
      date: input.date,
      quantity: input.quantity,
      unit_price: input.unit_price,
      amount: input.amount,
      service_description: input.service_description,
    })
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/');
  return { data };
}

export async function updateInvoice(
  id: string,
  input: Omit<CreateInvoiceInput, 'origin_id' | 'destination_id'>
) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('invoices')
    .update({
      date: input.date,
      quantity: input.quantity,
      unit_price: input.unit_price,
      amount: input.amount,
      service_description: input.service_description,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/');
  revalidatePath(`/invoices/${id}`);
  return { data };
}

export async function deleteInvoice(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('invoices').delete().eq('id', id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/');
  return { success: true };
}
