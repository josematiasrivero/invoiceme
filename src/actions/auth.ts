'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { authenticate, createSession, destroySession } from '@/lib/auth';

export async function signIn(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  const user = await authenticate(email, password);

  if (!user) {
    return { error: 'Invalid email or password' };
  }

  await createSession(user.id);
  revalidatePath('/', 'layout');
  redirect('/');
}

export async function signOut() {
  await destroySession();
  revalidatePath('/', 'layout');
  redirect('/login');
}
