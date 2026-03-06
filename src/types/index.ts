export const PROPERTY_TYPES = [
  'villa', 'apartment', 'townhouse', 'penthouse', 'studio', 'duplex',
  'commercial', 'warehouse', 'office', 'retail',
  'land', 'mixed_use',
  'building', 'standalone',
] as const;

export type PropertyType = (typeof PROPERTY_TYPES)[number];

export const PROPERTY_TYPE_GROUPS: Record<string, PropertyType[]> = {
  Residential: ['villa', 'apartment', 'townhouse', 'penthouse', 'studio', 'duplex'],
  Commercial: ['commercial', 'warehouse', 'office', 'retail'],
  Other: ['land', 'mixed_use'],
};

export const UAE_EMIRATES = [
  'Abu Dhabi', 'Dubai', 'Sharjah', 'Ajman',
  'Umm Al Quwain', 'Ras Al Khaimah', 'Fujairah',
] as const;

export type UAEEmirate = (typeof UAE_EMIRATES)[number];

export interface Property {
  id: number;
  name: string;
  type: PropertyType;
  emirate: UAEEmirate;
  city?: string;
  neighborhood?: string;
  street?: string;
  villa_number?: string;
  notes?: string;
  unit_count?: number;
  occupied_count?: number;
  purchase_price?: number;
  purchase_date?: string;
  current_estimated_value?: number;
  last_valuation_date?: string;
  zillow_url?: string;
  redfin_url?: string;
  created_at: string;
  updated_at: string;
  units?: Unit[];
  mortgages?: Mortgage[];
}

export interface Unit {
  id: number;
  property_id: number;
  unit_number: string;
  floor?: string;
  bedrooms?: number;
  bathrooms?: number;
  area_sqm?: number;
  status: 'vacant' | 'occupied' | 'maintenance';
  notes?: string;
  property_name?: string;
  created_at: string;
}

export interface Tenant {
  id: number;
  first_name: string;
  last_name: string;
  email?: string;
  phone: string;
  id_number?: string;
  company_name?: string;
  notes?: string;
  active_contracts?: number;
  created_at: string;
  contracts?: Contract[];
}

export type PaymentFrequency = 'monthly' | 'quarterly' | 'semi_annual' | 'annual';
export type ContractStatus = 'draft' | 'active' | 'expired' | 'terminated' | 'renewed';

export interface Contract {
  id: number;
  unit_id: number;
  tenant_id: number;
  start_date: string;
  end_date: string;
  rent_amount: number;
  payment_frequency: PaymentFrequency;
  total_payments: number;
  status: ContractStatus;
  renewal_of?: number;
  notes?: string;
  tenant_name?: string;
  tenant_phone?: string;
  tenant_email?: string;
  unit_number?: string;
  property_name?: string;
  payments?: Payment[];
  deposit?: Deposit | null;
  files?: ContractFile[];
  file_count?: number;
  created_at: string;
}

export type PaymentStatus = 'pending' | 'paid' | 'overdue' | 'cancelled';

export interface Payment {
  id: number;
  contract_id: number;
  payment_number: number;
  due_date: string;
  amount: number;
  status: PaymentStatus;
  paid_date?: string;
  payment_method?: 'check' | 'bank_transfer' | 'cash' | 'other';
  reference?: string;
  notes?: string;
  tenant_name?: string;
  unit_number?: string;
  property_name?: string;
}

export type DepositStatus = 'held' | 'partially_refunded' | 'refunded' | 'forfeited';

export interface Deposit {
  id: number;
  contract_id: number;
  amount: number;
  date_received: string;
  status: DepositStatus;
  refund_amount?: number;
  refund_date?: string;
  refund_reason?: string;
  notes?: string;
  tenant_name?: string;
  unit_number?: string;
  property_name?: string;
}

export interface ContractFile {
  id: number;
  contract_id: number;
  original_name: string;
  stored_name: string;
  mime_type: string;
  size_bytes: number;
  uploaded_at: string;
}

export interface DashboardSummary {
  total_properties: number;
  total_units: number;
  occupied_units: number;
  vacant_units: number;
  active_contracts: number;
  total_tenants: number;
  revenue_this_month: number;
  overdue_count: number;
  overdue_amount: number;
}

// Mortgage Types
export interface Mortgage {
  id: number;
  property_id: number;
  lender_name: string;
  loan_amount: number;
  interest_rate: number;
  term_months: number;
  start_date: string;
  monthly_payment: number;
  remaining_balance?: number;
  loan_type: 'fixed' | 'variable' | 'interest_only';
  account_number?: string;
  notes?: string;
  property_name?: string;
  payments?: MortgagePayment[];
  created_at: string;
}

export interface MortgagePayment {
  id: number;
  mortgage_id: number;
  payment_number: number;
  due_date: string;
  principal: number;
  interest: number;
  total_amount: number;
  remaining_balance: number;
  status: 'pending' | 'paid' | 'overdue';
  paid_date?: string;
}

export interface CashFlowData {
  property_id: number;
  property_name: string;
  month: string;
  rent_income: number;
  mortgage_payment: number;
  net_cash_flow: number;
}

// Valuation Types
export interface PropertyValuation {
  id: number;
  property_id: number;
  valuation_date: string;
  estimated_value: number;
  source: 'manual' | 'scraped' | 'zillow' | 'redfin' | 'realtor';
  confidence?: 'high' | 'medium' | 'low';
  notes?: string;
  created_at: string;
}

export interface PortfolioSummary {
  total_properties: number;
  total_purchase_value: number;
  total_current_value: number;
  total_gain_loss: number;
  gain_loss_percent: number;
  properties: Array<{
    id: number;
    name: string;
    purchase_price: number;
    current_value: number;
    gain_loss: number;
    gain_loss_percent: number;
    last_updated: string;
  }>;
}

// AI Analysis Types
export interface ContractAnalysis {
  id: number;
  contract_id: number;
  file_id: number;
  extracted_start_date?: string;
  extracted_end_date?: string;
  extracted_payment_due?: string[];
  key_terms?: KeyTerm[];
  obligations?: Obligation[];
  summary?: string;
  milestones?: Milestone[];
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error_message?: string;
  analyzed_at?: string;
  created_at: string;
}

export interface KeyTerm {
  term: string;
  description: string;
  importance: 'high' | 'medium' | 'low';
}

export interface Obligation {
  party: 'landlord' | 'tenant';
  obligation: string;
  deadline?: string;
}

export interface Milestone {
  date: string;
  description: string;
}

// AI Contract Creation Types
export interface ContractCreationAnalysis {
  tenant: {
    first_name: string;
    last_name: string;
    email: string | null;
    phone: string;
    id_number: string | null;
    company_name: string | null;
  };
  property: {
    name: string;
    type: string;
    emirate: string;
    city: string | null;
    neighborhood: string | null;
    street: string | null;
    villa_number: string | null;
  };
  unit: {
    unit_number: string;
    floor: string | null;
    bedrooms: number | null;
    bathrooms: number | null;
    area_sqm: number | null;
  };
  contract: {
    start_date: string;
    end_date: string;
    rent_amount: number;
    payment_frequency: string;
    total_payments: number;
    deposit_amount: number | null;
    notes: string | null;
  };
  summary: string;
}

// Calendar Types
export interface CalendarEvent {
  id: number;
  google_event_id: string;
  event_type: 'contract_end' | 'payment_due' | 'renewal_deadline' | 'ai_milestone';
  source_type: 'contract' | 'payment' | 'ai_analysis';
  source_id: number;
  title: string;
  event_date: string;
  synced_at: string;
}

export interface CalendarStatus {
  connected: boolean;
  events_synced?: number;
}

// Webhook Types
export type WebhookEventType =
  | 'payment.paid'
  | 'payment.overdue'
  | 'contract.created'
  | 'contract.renewed'
  | 'contract.terminated'
  | 'contract.created_from_ai';

export interface Webhook {
  id: number;
  name: string;
  url: string;
  secret: string | null;
  events: string;
  active: number;
  created_at: string;
  updated_at: string;
}

export interface WebhookLog {
  id: number;
  webhook_id: number;
  event: string;
  payload: string;
  status_code: number;
  response_body: string | null;
  success: number;
  created_at: string;
}

// Expense Types
export const EXPENSE_CATEGORIES = [
  'maintenance', 'insurance', 'property_tax', 'utilities', 'management_fee',
  'legal', 'cleaning', 'landscaping', 'pest_control', 'other',
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export interface Expense {
  id: number;
  property_id: number;
  unit_id?: number;
  category: ExpenseCategory;
  amount: number;
  expense_date: string;
  vendor_name?: string;
  description?: string;
  receipt_file?: string;
  recurring: number;
  recurring_frequency?: string;
  currency?: string;
  property_name?: string;
  unit_number?: string;
  created_at: string;
  updated_at: string;
}

export interface ExpenseSummary {
  by_category: { category: string; total: number; count: number }[];
  by_property: { property_id: number; property_name: string; total: number; count: number }[];
  monthly_trend: { month: string; total: number }[];
  total_amount: number;
  total_count: number;
}

// Audit Log Types
export interface AuditLog {
  id: number;
  entity_type: string;
  entity_id: number | null;
  action: 'create' | 'update' | 'delete';
  old_values: string | null;
  new_values: string | null;
  ip_address: string | null;
  timestamp: string;
}

// Currency Types
export interface Currency {
  code: string;
  name: string;
  symbol: string;
  exchange_rate: number;
  updated_at: string;
}

// Document Template Types
export interface DocumentTemplate {
  id: number;
  name: string;
  template_type: 'contract' | 'receipt' | 'notice';
  content?: string;
  created_at: string;
  updated_at: string;
}

// Reminder Types
export interface ReminderSetting {
  id: number;
  reminder_type: 'payment_due' | 'contract_expiry' | 'maintenance';
  days_before: number;
  enabled: number;
  notification_method: 'email' | 'webhook';
  created_at: string;
  updated_at: string;
}

export interface ReminderLog {
  id: number;
  reminder_type: string;
  entity_type: string;
  entity_id: number;
  triggered_at: string;
  status: string;
}

// Report Types
export interface ReportType {
  id: string;
  name: string;
  description: string;
  requires_property?: boolean;
}
