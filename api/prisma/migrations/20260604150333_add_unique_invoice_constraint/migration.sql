/*
  Warnings:

  - A unique constraint covering the columns `[invoiceNumber,partnerId,declarationId]` on the table `InvoiceHeader` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "InvoiceHeader_invoiceNumber_partnerId_declarationId_key" ON "InvoiceHeader"("invoiceNumber", "partnerId", "declarationId");
