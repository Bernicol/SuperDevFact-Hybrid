import type {
  CustomerSummary,
  InvoiceDetails,
  InvoiceSummary,
  PaymentListItem,
  PaymentMethod,
  QuoteDetails,
  QuoteLineRequest,
  QuoteSummary,
} from './types';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.message ?? `Erreur ${response.status}`);
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export const api = {
  customers: {
    search: (search?: string) =>
      request<CustomerSummary[]>(`/customers${search ? `?search=${encodeURIComponent(search)}` : ''}`),
  },
  quotes: {
    search: (search?: string, status?: string) => {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (status) params.set('status', status);
      const qs = params.toString();
      return request<QuoteSummary[]>(`/quotes${qs ? `?${qs}` : ''}`);
    },
    get: (id: string) => request<QuoteDetails>(`/quotes/${id}`),
    create: (customerId: string) =>
      request<QuoteDetails>('/quotes', { method: 'POST', body: JSON.stringify({ customerId }) }),
    updateGeneralInfo: (
      id: string,
      body: { customerId: string; issueDate: string; validityDays: number; paymentTermsDays: number; clientReference: string | null },
    ) => request<QuoteDetails>(`/quotes/${id}/general-info`, { method: 'PUT', body: JSON.stringify(body) }),
    updateNotes: (id: string, internalNotes: string | null, clientMessage: string | null) =>
      request<QuoteDetails>(`/quotes/${id}/notes`, {
        method: 'PUT',
        body: JSON.stringify({ internalNotes, clientMessage }),
      }),
    applyDiscount: (id: string, discountRatePercent: number) =>
      request<QuoteDetails>(`/quotes/${id}/discount`, { method: 'PUT', body: JSON.stringify({ discountRatePercent }) }),
    addLine: (id: string, line: QuoteLineRequest) =>
      request<QuoteDetails>(`/quotes/${id}/lines`, { method: 'POST', body: JSON.stringify(line) }),
    updateLine: (id: string, lineId: string, line: QuoteLineRequest) =>
      request<QuoteDetails>(`/quotes/${id}/lines/${lineId}`, { method: 'PUT', body: JSON.stringify(line) }),
    removeLine: (id: string, lineId: string) =>
      request<QuoteDetails>(`/quotes/${id}/lines/${lineId}`, { method: 'DELETE' }),
    send: (id: string) => request<QuoteDetails>(`/quotes/${id}/send`, { method: 'POST' }),
    accept: (id: string) => request<QuoteDetails>(`/quotes/${id}/accept`, { method: 'POST' }),
    decline: (id: string) => request<QuoteDetails>(`/quotes/${id}/decline`, { method: 'POST' }),
    convertToInvoice: (id: string) => request<InvoiceDetails>(`/quotes/${id}/convert-to-invoice`, { method: 'POST' }),
  },
  invoices: {
    search: (search?: string, status?: string) => {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (status) params.set('status', status);
      const qs = params.toString();
      return request<InvoiceSummary[]>(`/invoices${qs ? `?${qs}` : ''}`);
    },
    get: (id: string) => request<InvoiceDetails>(`/invoices/${id}`),
    recordPayment: (id: string, body: { amount: number; paymentDate: string; method: PaymentMethod; reference: string | null }) =>
      request<InvoiceDetails>(`/invoices/${id}/payments`, { method: 'POST', body: JSON.stringify(body) }),
  },
  payments: {
    list: () => request<PaymentListItem[]>('/payments'),
  },
};
