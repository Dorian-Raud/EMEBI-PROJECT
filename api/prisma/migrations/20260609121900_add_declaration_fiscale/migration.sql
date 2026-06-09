-- CreateTable
CREATE TABLE "DeclarationFiscale" (
    "id" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "invoiceDate" TIMESTAMP(3),
    "regime" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "partnerId" TEXT NOT NULL,
    "declarationId" TEXT,

    CONSTRAINT "DeclarationFiscale_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DeclarationFiscale_invoiceNumber_partnerId_declarationId_key" ON "DeclarationFiscale"("invoiceNumber", "partnerId", "declarationId");

-- AddForeignKey
ALTER TABLE "DeclarationFiscale" ADD CONSTRAINT "DeclarationFiscale_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeclarationFiscale" ADD CONSTRAINT "DeclarationFiscale_declarationId_fkey" FOREIGN KEY ("declarationId") REFERENCES "Declaration"("id") ON DELETE SET NULL ON UPDATE CASCADE;
