'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { CreateEntityInput } from '@/types';

export async function createEntity(input: CreateEntityInput) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('entities')
    .insert({
      ...input,
      invoice_prefix: input.invoice_prefix.toUpperCase(),
    });

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/entities');
  redirect('/entities');
}

export async function updateEntity(id: string, input: Partial<CreateEntityInput>) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('entities')
    .update({
      ...input,
      invoice_prefix: input.invoice_prefix?.toUpperCase(),
    })
    .eq('id', id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/entities');
  revalidatePath(`/entities/${id}`);
  redirect('/entities');
}

export async function deleteEntity(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('entities').delete().eq('id', id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/entities');
  return { success: true };
}
