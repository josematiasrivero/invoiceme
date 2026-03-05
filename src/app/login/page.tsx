import { headers } from 'next/headers';
import { LoginForm } from './login-form';

export default async function LoginPage() {
  const headersList = await headers();
  const host = headersList.get('host') ?? '';
  const isLocalhost =
    host.startsWith('localhost') || host.startsWith('127.0.0.1');

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40">
      <LoginForm prefillDev={isLocalhost} />
    </div>
  );
}
