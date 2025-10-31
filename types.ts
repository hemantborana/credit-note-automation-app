export interface Party {
  id: string;
  name: string;
  address1: string;
  address2: string;
  address3?: string;
  city: string;
  email?: string;
  whatsappNumber?: string;
  gstin?: string;
}

export interface CreditNoteData {
  cn_number: string;
  date: string;
  party_name: string;
  party_address1: string;
  party_address2: string;
  party_city: string;
  period_from: string;
  period_to: string;
  month: string;
  purpose: string;
  net_sales: number;
  cn_percentage: number;
  credit_amount: number;
  round_off: number;
  final_amount: number;
  party_email?: string;
  party_whatsapp?: string;
}

export interface SheetRowData extends CreditNoteData {
    pdf_link: string;
    sent_to_party_at: string;
    sent_to_ho_at: string;
    sent_to_printer_at: string;
    last_resent_to_party_at?: string;
    last_resent_to_ho_at?: string;
}

export interface CompanySettings {
  name: string;
  addressLine1: string;
  addressLine2: string;
  contactInfo: string;
  gstin: string;
  udyam: string;
  stateCode: string;
}

export interface Template {
  id: string;
  name: string;
  partyId: string;
  partyName: string;
  purpose: string;
  cnPercentage: number;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  action: string;
  details: string;
}