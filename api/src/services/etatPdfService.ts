import { createRequire } from "node:module";
import { listInvoices } from "./invoiceService.ts";
import { listDeclarationsFiscales } from "./declarationFiscaleService.ts";
import { getCompanyById } from "./companyService.ts";

// pdfmake est un module CJS : on le charge via createRequire pour rester compatible
// avec l'ESM strict du projet et garder les polices sous forme de Buffer.
const require = createRequire(import.meta.url);
const PdfPrinter = require("pdfmake") as new (fonts: unknown) => {
  createPdfKitDocument: (def: unknown) => NodeJS.ReadableStream & { end: () => void };
};
const vfs = require("pdfmake/build/vfs_fonts") as Record<string, string>;

const fonts = {
  Roboto: {
    normal: Buffer.from(vfs["Roboto-Regular.ttf"], "base64"),
    bold: Buffer.from(vfs["Roboto-Medium.ttf"], "base64"),
    italics: Buffer.from(vfs["Roboto-Italic.ttf"], "base64"),
    bolditalics: Buffer.from(vfs["Roboto-MediumItalic.ttf"], "base64"),
  },
};

export type EtatFlow = "INTRODUCTION" | "EXPEDITION" | "FISCALE";

const flowLabels: Record<EtatFlow, string> = {
  INTRODUCTION: "Introduction",
  EXPEDITION: "Expédition",
  FISCALE: "Déclaration fiscale",
};

const monthNames = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

const eurFmt = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });

// fr-FR utilise une espace fine insécable (U+202F) comme séparateur de milliers,
// dont le glyphe manque dans la police embarquée → on la remplace par une espace normale.
function eur(n: number): string {
  return eurFmt.format(n).replace(/[  ]/g, " ");
}

function fmtDate(d: Date | null | undefined): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR");
}

interface EtatRow {
  cells: string[];
  /** Montant HT / valeur de la facture, pour le total. */
  montant: number;
  /** Nombre de lignes de la facture (1 pour le fiscal). */
  nbLignes: number;
}

interface EtatData {
  headers: string[];
  rows: EtatRow[];
  montantTotal: number;
  nbFactures: number;
  nbLignes: number;
}

/** Assemble les lignes + totaux d'un état pour un flux/période donné. */
async function buildEtatData(
  companyId: string,
  month: number,
  year: number,
  flow: EtatFlow,
): Promise<EtatData> {
  if (flow === "FISCALE") {
    const data = await listDeclarationsFiscales({ companyId, month, year });
    const rows: EtatRow[] = data.map((d) => ({
      cells: [
        d.invoiceNumber,
        fmtDate(d.invoiceDate),
        `${d.partner?.name ?? "Inconnu"} · ${d.partner?.vatNumber ?? ""}`,
        d.regime,
        eur(d.value),
      ],
      montant: d.value,
      nbLignes: 1, // une déclaration fiscale = une ligne (décision actée)
    }));
    return summarize(["N° facture", "Date", "Tiers", "Régime", "Valeur"], rows);
  }

  const data = await listInvoices({ companyId, flow, month, year });
  const rows: EtatRow[] = data.map((inv) => {
    const montant = (inv.lines ?? []).reduce((s, l) => s + Number(l.value), 0);
    return {
      cells: [
        inv.invoiceNumber,
        fmtDate(inv.invoiceDate),
        `${inv.partner?.name ?? "Inconnu"} · ${inv.partner?.vatNumber ?? ""}`,
        inv.regime,
        inv.transactionNature,
        eur(montant),
      ],
      montant,
      nbLignes: (inv.lines ?? []).length,
    };
  });
  return summarize(["N° facture", "Date", "Tiers", "Régime", "Nature", "Total HT"], rows);
}

function summarize(headers: string[], rows: EtatRow[]): EtatData {
  return {
    headers,
    rows,
    montantTotal: rows.reduce((s, r) => s + r.montant, 0),
    nbFactures: rows.length,
    nbLignes: rows.reduce((s, r) => s + r.nbLignes, 0),
  };
}

function buildDocDefinition(
  companyName: string,
  month: number,
  year: number,
  flow: EtatFlow,
  data: EtatData,
): unknown {
  const tableBody = [
    data.headers.map((h) => ({ text: h, style: "th" })),
    ...data.rows.map((r) => r.cells.map((c) => ({ text: c, style: "td" }))),
  ];

  return {
    pageSize: "A4",
    pageMargins: [36, 56, 36, 48],
    defaultStyle: { font: "Roboto", fontSize: 9 },
    content: [
      { text: companyName, style: "company" },
      { text: `État — ${flowLabels[flow]}`, style: "title" },
      {
        text: `Période : ${monthNames[month - 1]} ${year}  ·  Généré le ${new Date().toLocaleDateString("fr-FR")}`,
        style: "subtitle",
        margin: [0, 0, 0, 12],
      },
      {
        table: {
          headerRows: 1,
          widths: data.headers.map(() => "auto"),
          body: tableBody,
        },
        layout: {
          fillColor: (rowIndex: number) =>
            rowIndex === 0 ? "#1e293b" : rowIndex % 2 === 0 ? "#f1f5f9" : null,
          hLineColor: () => "#e2e8f0",
          vLineColor: () => "#e2e8f0",
        },
      },
      {
        margin: [0, 16, 0, 0],
        columns: [
          { text: "" },
          {
            width: "auto",
            table: {
              body: [
                ["Montant total", eur(data.montantTotal)],
                ["Nombre de factures", String(data.nbFactures)],
                ["Nombre de lignes", String(data.nbLignes)],
              ].map(([label, value]) => [
                { text: label, style: "totalLabel" },
                { text: value, style: "totalValue" },
              ]),
            },
            layout: "noBorders",
          },
        ],
      },
    ],
    footer: (currentPage: number, pageCount: number) => ({
      text: `${currentPage} / ${pageCount}`,
      alignment: "center",
      fontSize: 8,
      color: "#94a3b8",
      margin: [0, 16, 0, 0],
    }),
    styles: {
      company: { fontSize: 14, bold: true, color: "#1e293b" },
      title: { fontSize: 12, bold: true, margin: [0, 4, 0, 2] },
      subtitle: { fontSize: 9, color: "#64748b" },
      th: { color: "#ffffff", bold: true, fontSize: 9, margin: [0, 3, 0, 3] },
      td: { fontSize: 9, margin: [0, 2, 0, 2] },
      totalLabel: { bold: true, fontSize: 10, margin: [0, 1, 12, 1] },
      totalValue: { fontSize: 10, alignment: "right", margin: [0, 1, 0, 1] },
    },
  };
}

function streamToBuffer(doc: NodeJS.ReadableStream & { end: () => void }): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    doc.on("data", (c: Buffer) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
    doc.end();
  });
}

export interface EtatPdfResult {
  buffer: Buffer;
  filename: string;
}

/**
 * Génère le PDF d'un état pour un flux/période.
 * Renvoie `null` si la société est introuvable ou s'il n'y a aucune facture
 * (le contrôleur traduit ça en 404).
 */
export async function generateEtatPdf(
  companyId: string,
  month: number,
  year: number,
  flow: EtatFlow,
): Promise<EtatPdfResult | null> {
  const company = await getCompanyById(companyId);
  if (!company) return null;

  const data = await buildEtatData(companyId, month, year, flow);
  if (data.rows.length === 0) return null;

  const docDef = buildDocDefinition(company.name, month, year, flow, data);
  const printer = new PdfPrinter(fonts);
  const buffer = await streamToBuffer(printer.createPdfKitDocument(docDef));

  const mm = String(month).padStart(2, "0");
  return { buffer, filename: `etat-${flow.toLowerCase()}-${mm}-${year}.pdf` };
}
