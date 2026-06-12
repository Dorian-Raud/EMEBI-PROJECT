import { apiFetch } from "./fetch";
import type { Company, Partner, InvoiceSummary, CreateInvoicePayload, DeclarationFiscaleSummary, CreateDeclarationFiscalePayload } from "../../types";


export const companiesRequester = {
  getAll: () => apiFetch<Company[]>("/companies"),
  getById: (id: string) => apiFetch<Company>(`/companies/${id}`),
  create: (data: Omit<Company, "id">) =>
    apiFetch<Company>("/companies", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id: string, data: Partial<Company>) =>
    apiFetch<Company>(`/companies/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    apiFetch(`/companies/${id}`, { method: "DELETE" }),
};

// PARTNERS
export const partnersRequester = {
  getAll: (companyId: string, q?: string) => {
    const params = new URLSearchParams({ companyId })
    if (q?.trim()) params.set("q", q.trim())
    return apiFetch<Partner[]>(`/partners?${params.toString()}`)
  },
  create: (data: Pick<Partner, "name" | "vatNumber" | "isoCode" | "companyId">) =>
    apiFetch<Partner>("/partners", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  delete: (partnerId: string, companyId: string) =>
    apiFetch(`/partners/${partnerId}?companyId=${companyId}`, { method: "DELETE" }),
};

// INVOICES
export const invoicesRequester = {
  getAll: (
    companyId: string,
    filters?: { q?: string; flow?: string; month?: number; year?: number },
  ) => {
    const params = new URLSearchParams({ companyId });
    if (filters?.q) params.set("q", filters.q);
    if (filters?.flow) params.set("flow", filters.flow);
    if (filters?.month) params.set("month", String(filters.month));
    if (filters?.year) params.set("year", String(filters.year));
    return apiFetch<InvoiceSummary[]>(`/invoices?${params.toString()}`);
  },
  getById: (id: string) => apiFetch<any>(`/invoices/${id}`),
  create: (data: CreateInvoicePayload) =>
    apiFetch<InvoiceSummary>("/invoices", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id: string, data: Partial<Omit<CreateInvoicePayload, 'companyId' | 'flow' | 'month' | 'year'>>) =>
    apiFetch<InvoiceSummary>(`/invoices/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    apiFetch(`/invoices/${id}`, { method: "DELETE" }),
};

// DECLARATIONS FISCALES
export const declarationsFiscalesRequester = {
  getAll: (companyId: string, filters?: { month?: number; year?: number }) => {
    const params = new URLSearchParams({ companyId });
    if (filters?.month) params.set("month", String(filters.month));
    if (filters?.year) params.set("year", String(filters.year));
    return apiFetch<DeclarationFiscaleSummary[]>(`/declarations-fiscales?${params.toString()}`);
  },
  getById: (id: string) => apiFetch<DeclarationFiscaleSummary>(`/declarations-fiscales/${id}`),
  create: (data: CreateDeclarationFiscalePayload) =>
    apiFetch<DeclarationFiscaleSummary>("/declarations-fiscales", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id: string, data: Partial<Pick<CreateDeclarationFiscalePayload, 'invoiceNumber' | 'invoiceDate' | 'regime' | 'value' | 'partnerId'>>) =>
    apiFetch<DeclarationFiscaleSummary>(`/declarations-fiscales/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    apiFetch(`/declarations-fiscales/${id}`, { method: "DELETE" }),
}

