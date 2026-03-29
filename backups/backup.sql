SET session_replication_role = replica;

--
-- PostgreSQL database dump
--

-- \restrict lSYh3NBpQiMNqPfVUSD62DafQ4bn5waqKIeB8K5iYwtVw8OLoNGeYszupqA2IL8

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: audit_log_entries; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: custom_oauth_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: flow_state; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: users; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."users" ("instance_id", "id", "aud", "role", "email", "encrypted_password", "email_confirmed_at", "invited_at", "confirmation_token", "confirmation_sent_at", "recovery_token", "recovery_sent_at", "email_change_token_new", "email_change", "email_change_sent_at", "last_sign_in_at", "raw_app_meta_data", "raw_user_meta_data", "is_super_admin", "created_at", "updated_at", "phone", "phone_confirmed_at", "phone_change", "phone_change_token", "phone_change_sent_at", "email_change_token_current", "email_change_confirm_status", "banned_until", "reauthentication_token", "reauthentication_sent_at", "is_sso_user", "deleted_at", "is_anonymous") VALUES
	('00000000-0000-0000-0000-000000000000', '35a8254f-c385-438f-906d-6b7db3dca57d', 'authenticated', 'authenticated', 'jose.matias.rivero@gmail.com', '$2a$10$v6Pz1uf7LIeJYHJwlpphu.icg3RjRGlk69m6C0HgMN4W15TaaGSui', '2026-03-05 13:21:43.786998+00', NULL, '', NULL, '', NULL, '', '', NULL, '2026-03-16 12:47:40.917693+00', '{"provider": "email", "providers": ["email"]}', '{"email_verified": true}', NULL, '2026-03-05 13:21:43.76677+00', '2026-03-24 11:36:25.641694+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false);


--
-- Data for Name: identities; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."identities" ("provider_id", "user_id", "identity_data", "provider", "last_sign_in_at", "created_at", "updated_at", "id") VALUES
	('35a8254f-c385-438f-906d-6b7db3dca57d', '35a8254f-c385-438f-906d-6b7db3dca57d', '{"sub": "35a8254f-c385-438f-906d-6b7db3dca57d", "email": "jose.matias.rivero@gmail.com", "email_verified": false, "phone_verified": false}', 'email', '2026-03-05 13:21:43.780749+00', '2026-03-05 13:21:43.780805+00', '2026-03-05 13:21:43.780805+00', 'ae69ce2c-32ca-4f2f-b56a-cf275fcf96c3');


--
-- Data for Name: instances; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_clients; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: sessions; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."sessions" ("id", "user_id", "created_at", "updated_at", "factor_id", "aal", "not_after", "refreshed_at", "user_agent", "ip", "tag", "oauth_client_id", "refresh_token_hmac_key", "refresh_token_counter", "scopes") VALUES
	('13086eb1-c834-411a-94a6-68962eb6a5c7', '35a8254f-c385-438f-906d-6b7db3dca57d', '2026-03-08 21:52:33.84091+00', '2026-03-09 00:41:53.529178+00', NULL, 'aal1', NULL, '2026-03-09 00:41:53.529071', 'node', '162.220.234.165', NULL, NULL, NULL, NULL, NULL),
	('cb4a44b8-3b4f-408c-b995-6aacd8d9a3b8', '35a8254f-c385-438f-906d-6b7db3dca57d', '2026-03-16 12:47:40.918539+00', '2026-03-24 11:36:25.657159+00', NULL, 'aal1', NULL, '2026-03-24 11:36:25.657042', 'node', '162.220.234.165', NULL, NULL, NULL, NULL, NULL);


--
-- Data for Name: mfa_amr_claims; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."mfa_amr_claims" ("session_id", "created_at", "updated_at", "authentication_method", "id") VALUES
	('13086eb1-c834-411a-94a6-68962eb6a5c7', '2026-03-08 21:52:33.934395+00', '2026-03-08 21:52:33.934395+00', 'password', 'fdc0689c-1d7a-4633-a308-13565cc85e85'),
	('cb4a44b8-3b4f-408c-b995-6aacd8d9a3b8', '2026-03-16 12:47:40.954837+00', '2026-03-16 12:47:40.954837+00', 'password', '7436d605-bcf0-412e-9ba0-7b193e05c688');


--
-- Data for Name: mfa_factors; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: mfa_challenges; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_authorizations; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_client_states; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_consents; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: one_time_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."refresh_tokens" ("instance_id", "id", "token", "user_id", "revoked", "created_at", "updated_at", "parent", "session_id") VALUES
	('00000000-0000-0000-0000-000000000000', 4, '4l6cew7uiofz', '35a8254f-c385-438f-906d-6b7db3dca57d', true, '2026-03-08 21:52:33.893982+00', '2026-03-09 00:41:53.470739+00', NULL, '13086eb1-c834-411a-94a6-68962eb6a5c7'),
	('00000000-0000-0000-0000-000000000000', 5, 'wimr5v6f2eno', '35a8254f-c385-438f-906d-6b7db3dca57d', false, '2026-03-09 00:41:53.494114+00', '2026-03-09 00:41:53.494114+00', '4l6cew7uiofz', '13086eb1-c834-411a-94a6-68962eb6a5c7'),
	('00000000-0000-0000-0000-000000000000', 6, 'jj5hh5vyruvg', '35a8254f-c385-438f-906d-6b7db3dca57d', true, '2026-03-16 12:47:40.940322+00', '2026-03-16 19:52:12.389082+00', NULL, 'cb4a44b8-3b4f-408c-b995-6aacd8d9a3b8'),
	('00000000-0000-0000-0000-000000000000', 7, 'jafauzc62amd', '35a8254f-c385-438f-906d-6b7db3dca57d', true, '2026-03-16 19:52:12.402042+00', '2026-03-17 12:15:11.761216+00', 'jj5hh5vyruvg', 'cb4a44b8-3b4f-408c-b995-6aacd8d9a3b8'),
	('00000000-0000-0000-0000-000000000000', 8, 'nstgf23cdmjo', '35a8254f-c385-438f-906d-6b7db3dca57d', true, '2026-03-17 12:15:11.787135+00', '2026-03-18 15:41:47.161422+00', 'jafauzc62amd', 'cb4a44b8-3b4f-408c-b995-6aacd8d9a3b8'),
	('00000000-0000-0000-0000-000000000000', 9, 'gpzfw37k3btz', '35a8254f-c385-438f-906d-6b7db3dca57d', true, '2026-03-18 15:41:47.189032+00', '2026-03-24 11:36:25.597164+00', 'nstgf23cdmjo', 'cb4a44b8-3b4f-408c-b995-6aacd8d9a3b8'),
	('00000000-0000-0000-0000-000000000000', 10, 'b6rhwfpoql2v', '35a8254f-c385-438f-906d-6b7db3dca57d', false, '2026-03-24 11:36:25.624354+00', '2026-03-24 11:36:25.624354+00', 'gpzfw37k3btz', 'cb4a44b8-3b4f-408c-b995-6aacd8d9a3b8');


--
-- Data for Name: sso_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: saml_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: saml_relay_states; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: sso_domains; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: webauthn_challenges; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: webauthn_credentials; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: entities; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."entities" ("id", "name", "type", "aba_routing", "account_number", "bank_name", "bank_address", "primary_color", "invoice_prefix", "invoice_counter", "created_at", "invoice_layout", "address", "email") VALUES
	('13d83da0-7951-491c-8644-1c0a1c4d7f10', 'Maria Belen Parrilla', 'both', '061120084', '4014055041787', 'First Century Bank (United States)', '1731 N Elm St Commerce, GA 30529 USA', '#1dd74c', 'B', 1, '2026-03-05 13:30:51.668099+00', 'minimal', 'Ruben Falero 2473 Colonia del Sacramento 70000 Uruguay', NULL),
	('9d36ee3d-be16-484d-96ea-8139d301e5db', 'Agustin Cartasso', 'client', '026073150', '8313166261', 'Community Federal Savings Bank', '89-16 Jamaica Ave, Woodhaven, NY, 11421, United States', '#d7431d', 'AC', 0, '2026-03-17 12:20:04.814988+00', 'classic', 'Calle 55 N° 477, CP 1900, La Plata, Buenos Aires, Argentina', NULL),
	('3a19d660-190a-49d5-ab27-3cea604c2c27', 'Bitbloke LLC', 'provider', '091311229', '202520373931', 'Choice Financial Group', '4501 23rd Avenue S, Fargo, ND 58104', '#961dd7', 'BB', 1, '2026-03-17 12:17:26.010657+00', 'compact', '2875 NE 191st Street, Suite 901', NULL),
	('0feccca5-379c-48f9-b7e4-ebca332a5016', 'Cloudars LLC', 'both', '091311229', '202510690412', 'Choice Financial Group', NULL, '#1D4ED8', 'C', 1, '2026-03-05 13:29:51.406638+00', 'classic', '2875 NE 191ST STE 901 Aventura FL 33180', NULL),
	('969febc0-277f-466b-b0ef-3180d087c006', 'Envios NICA Inc.', 'client', NULL, NULL, NULL, NULL, '#000000', 'N', 0, '2026-03-18 15:43:53.446074+00', 'classic', 'Seville Avenue, Huntington Park, CA, 90255', NULL);


--
-- Data for Name: invoices; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."invoices" ("id", "invoice_number", "origin_id", "destination_id", "date", "amount", "service_description", "created_at", "quantity", "unit_price") VALUES
	('8be571c1-ab6b-427e-bad4-c17db639156a', 'B-001', '13d83da0-7951-491c-8644-1c0a1c4d7f10', '0feccca5-379c-48f9-b7e4-ebca332a5016', '2026-03-05', 75.00, 'English Classes', '2026-03-05 13:32:57.431311+00', 1.0000, 75.00),
	('c304b20f-edac-4e5c-a702-c10405e9e2e0', 'BB-001', '3a19d660-190a-49d5-ab27-3cea604c2c27', '9d36ee3d-be16-484d-96ea-8139d301e5db', '2026-01-27', 310.87, 'Software Development Services', '2026-03-17 12:21:07.835699+00', 1.0000, 310.87),
	('76586273-ed03-4f4e-8cac-9846bfd139af', 'C-001', '0feccca5-379c-48f9-b7e4-ebca332a5016', '969febc0-277f-466b-b0ef-3180d087c006', '2026-03-18', 800.00, 'Software Development Services', '2026-03-18 15:44:30.416917+00', 1.0000, 800.00);


--
-- Data for Name: buckets; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: buckets_analytics; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: buckets_vectors; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: objects; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: s3_multipart_uploads; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: s3_multipart_uploads_parts; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: vector_indexes; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE SET; Schema: auth; Owner: supabase_auth_admin
--

SELECT pg_catalog.setval('"auth"."refresh_tokens_id_seq"', 10, true);


--
-- PostgreSQL database dump complete
--

-- \unrestrict lSYh3NBpQiMNqPfVUSD62DafQ4bn5waqKIeB8K5iYwtVw8OLoNGeYszupqA2IL8

RESET ALL;
