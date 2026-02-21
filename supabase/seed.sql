-- ============================================================
-- Seed: Dev user + sample entities
-- ============================================================

-- Create dev user in auth.users
-- Password: dev123456
-- Note: token fields must be '' (empty string), NOT NULL — required by newer GoTrue versions
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role,
  aud
) VALUES (
  'a0000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'dev@local.com',
  crypt('dev123456', gen_salt('bf')),
  NOW(),
  '',
  '',
  '',
  '',
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  false,
  'authenticated',
  'authenticated'
) ON CONFLICT (id) DO NOTHING;

-- Identity record required for email login
INSERT INTO auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  last_sign_in_at,
  created_at,
  updated_at
) VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000001',
  '{"sub":"a0000000-0000-0000-0000-000000000001","email":"dev@local.com"}',
  'email',
  'dev@local.com',
  NOW(),
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Sample entities
INSERT INTO entities (name, type, aba_routing, account_number, bank_name, bank_address, primary_color, invoice_prefix)
VALUES
  (
    'Acme Corp',
    'client',
    '021000021',
    '1234567890',
    'Chase Bank',
    '270 Park Ave, New York, NY 10017',
    '#1D4ED8',
    'ACME'
  ),
  (
    'My Consulting LLC',
    'provider',
    '021000089',
    '9876543210',
    'Bank of America',
    '100 N Tryon St, Charlotte, NC 28255',
    '#059669',
    'MYCO'
  ),
  (
    'Global Services Inc',
    'both',
    '026009593',
    '5555444433',
    'Wells Fargo',
    '420 Montgomery St, San Francisco, CA 94104',
    '#7C3AED',
    'GLOB'
  )
ON CONFLICT DO NOTHING;
