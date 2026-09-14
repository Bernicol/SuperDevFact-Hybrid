export type QuoteStatus = 'Draft' | 'Sent' | 'Accepted' | 'Declined' | 'Expired';
export type InvoiceStatus = 'Draft' | 'Sent' | 'PartiallyPaid' | 'Paid' | 'Cancelled';
export type PaymentMethod = 'BankTransfer' | 'Check' | 'Card' | 'Cash';

export interface CustomerSummary {
  id: string;
  companyName: string;
  street: string;
  postalCode: string;
  city: string;
  country: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string | null;
  siret: string | null;
  vatNumber: string | null;
  paymentTermsLabel: string;
  isActive: boolean;
}

export interface TaxBreakdown {
  label: string;
  ratePercent: number;
  taxableBase: number;
  taxAmount: number;
}

export interface DocumentTotals {
  subtotalHt: number;
  globalDiscountAmount: number;
  netHt: number;
  taxBreakdown: TaxBreakdown[];
  totalTax: number;
  totalTtc: number;
}

export interface QuoteLine {
  id: string;
  position: number;
  description: string;
  detail: string | null;
  quantity: number;
  unit: string;
  unitPriceHt: number;
  discountRatePercent: number;
  taxRatePercent: number;
  taxLabel: string;
  lineTotalHt: number;
}

export interface QuoteDetails {
  id: string;
  number: string;
  customer: CustomerSummary;
  issueDate: string;
  expiryDate: string;
  validityDays: number;
  paymentTermsLabel: string;
  clientReference: string | null;
  internalNotes: string | null;
  clientMessage: string | null;
  status: QuoteStatus;
  convertedInvoiceId: string | null;
  globalDiscountRatePercent: number;
  lines: QuoteLine[];
  totals: DocumentTotals;
  createdAtUtc: string;
  lastModifiedAtUtc: string;
}

export interface QuoteSummary {
  id: string;
  number: string;
  customerName: string;
  issueDate: string;
  totalHt: number;
  status: QuoteStatus;
  convertedInvoiceId: string | null;
  displayStatus: string;
}

export interface InvoiceLine {
  id: string;
  position: number;
  description: string;
  detail: string | null;
  quantity: number;
  unit: string;
  unitPriceHt: number;
  discountRatePercent: number;
  taxRatePercent: number;
  taxLabel: string;
  lineTotalHt: number;
}

export interface Payment {
  id: string;
  amount: number;
  paymentDate: string;
  method: PaymentMethod;
  reference: string | null;
}

export interface InvoiceDetails {
  id: string;
  number: string;
  customer: CustomerSummary;
  sourceQuoteId: string | null;
  issueDate: string;
  dueDate: string;
  paymentTermsLabel: string;
  clientReference: string | null;
  internalNotes: string | null;
  clientMessage: string | null;
  status: InvoiceStatus;
  isOverdue: boolean;
  globalDiscountRatePercent: number;
  lines: InvoiceLine[];
  payments: Payment[];
  amountPaid: number;
  balance: number;
  totals: DocumentTotals;
  createdAtUtc: string;
  lastModifiedAtUtc: string;
}

export interface InvoiceSummary {
  id: string;
  number: string;
  customerName: string;
  issueDate: string;
  totalTtc: number;
  status: InvoiceStatus;
  isOverdue: boolean;
}

export interface PaymentListItem {
  id: string;
  invoiceId: string;
  invoiceNumber: string;
  customerName: string;
  amount: number;
  paymentDate: string;
  method: PaymentMethod;
  reference: string | null;
}

export interface QuoteLineRequest {
  description: string;
  detail: string | null;
  quantity: number;
  unit: string;
  unitPriceHt: number;
  discountRatePercent: number;
  taxRatePercent: number;
}
