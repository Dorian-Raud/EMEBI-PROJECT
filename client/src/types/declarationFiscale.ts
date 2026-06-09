export type DeclarationFiscaleSummary = {
    id: string;
    invoiceNumber: string;
    invoiceDate: string | null;
    regime: string;
    value: number;
    partner: { id: string; name: string; vatNumber: string; isoCode: string };
    declaration: { id: string; flow: "FISCALE"; month: number; year: number; status: string };
  }
  
  export type CreateDeclarationFiscalePayload = {
    companyId: string;
    month: number;
    year: number;
    invoiceNumber: string;
    invoiceDate?: string | null;
    regime: string;
    value: number;
    partnerId: string;
  }