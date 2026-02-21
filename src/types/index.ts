export type EntityType = 'client' | 'provider' | 'both';

export interface Entity {
  id: string;
  name: string;
  type: EntityType;
  aba_routing: string | null;
  account_number: string | null;
  bank_name: string | null;
  bank_address: string | null;
  primary_color: string;
  invoice_prefix: string;
  invoice_counter: number;
  created_at: string;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  origin_id: string;
  destination_id: string;
  date: string;
  quantity: number;
  unit_price: number;
  amount: number;
  service_description: string;
  created_at: string;
  origin?: Entity;
  destination?: Entity;
}

export interface InvoiceFilters {
  origin_id?: string;
  destination_id?: string;
}

export interface CreateInvoiceInput {
  origin_id: string;
  destination_id: string;
  date: string;
  quantity: number;
  unit_price: number;
  amount: number;
  service_description: string;
}

export interface CreateEntityInput {
  name: string;
  type: EntityType;
  aba_routing?: string;
  account_number?: string;
  bank_name?: string;
  bank_address?: string;
  primary_color: string;
  invoice_prefix: string;
}
