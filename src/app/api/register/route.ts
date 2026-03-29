import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';

export async function POST(request: Request) {
  console.log('[register] POST /api/register');

  const adminToken = process.env.ADMIN_TOKEN;
  if (!adminToken) {
    console.log('[register] ADMIN_TOKEN not set, registration disabled');
    return NextResponse.json({ error: 'Registration is disabled' }, { status: 403 });
  }

  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${adminToken}`) {
    console.log('[register] Invalid admin token');
    return NextResponse.json({ error: 'Invalid admin token' }, { status: 401 });
  }

  const { email, password } = await request.json();

  if (!email || !password) {
    console.log('[register] Missing email or password');
    return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`[register] User already exists: ${email}`);
    return NextResponse.json({ error: 'User already exists' }, { status: 409 });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { email, hashedPassword },
  });

  console.log(`[register] User created: ${user.email} (${user.id})`);
  return NextResponse.json({ id: user.id, email: user.email }, { status: 201 });
}
