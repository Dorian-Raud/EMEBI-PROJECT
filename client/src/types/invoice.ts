export type InvoiceSummary = {
  id: string;
  invoiceNumber: string;
  invoiceDate: string | null;
  regime: string;
  transactionNature: string;
  partner: { id: string; name: string; vatNumber: string; isoCode: string };
  declaration: { id: string; flow: "INTRODUCTION" | "EXPEDITION"; month: number; year: number; status: string };
  lines: { id: string; value: number }[];
};

export type CreateInvoicePayload = {
  companyId: string;
  flow: "INTRODUCTION" | "EXPEDITION";
  month: number;
  year: number;
  invoiceNumber: string;
  invoiceDate?: string | null;
  regime: string;
  transactionNature: string;
  transportMode?: string | null;
  partnerId: string;
  deptCode: string;
  lines: Array<{
    lineNumber: number;
    nomenclatureCode: string;
    mass: number;
    supplementaryUnit?: number | null;
    value: number;
    originCountryCode: string;
    provCountryCode: string;
  }>;
};

export type InvoiceHeaderDraft = {
  invoiceNumber: string;
  invoiceDate: string;
  regime: string;
  natureTransaction: string;
  tiersVatNumber: string;
  transportMode: string;
};

export type InvoiceLineDraft = {
  nomenclatureCode: string;
  supplementaryUnit: string;
  mass: string;
  value: string;
  provCountryCode: string;
  originCountryCode: string;
};

export type InvoiceLine = InvoiceLineDraft & { id: string };

