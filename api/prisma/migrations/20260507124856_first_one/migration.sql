-- CreateEnum
CREATE TYPE "Flow" AS ENUM ('INTRODUCTION', 'EXPEDITION');

-- CreateTable
CREATE TABLE "Country" (
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Country_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "Department" (
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Department_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "Nomenclature" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "year" INTEGER NOT NULL,

    CONSTRAINT "Nomenclature_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "siret" TEXT NOT NULL,
    "vatNumber" TEXT NOT NULL,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Partner" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "vatNumber" TEXT NOT NULL,
    "isoCode" TEXT NOT NULL,
    "deptCode" TEXT,
    "companyId" TEXT NOT NULL,

    CONSTRAINT "Partner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Declaration" (
    "id" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "flow" "Flow" NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "companyId" TEXT NOT NULL,

    CONSTRAINT "Declaration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvoiceHeader" (
    "id" TEXT NOT NULL,
    "invoiceNumber" TEXT,
    "invoiceDate" TIMESTAMP(3),
    "regime" TEXT NOT NULL,
    "transactionNature" TEXT NOT NULL,
    "transportMode" TEXT,
    "partnerId" TEXT NOT NULL,
    "declarationId" TEXT NOT NULL,

    CONSTRAINT "InvoiceHeader_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvoiceLine" (
    "id" TEXT NOT NULL,
    "lineNumber" INTEGER NOT NULL,
    "mass" DOUBLE PRECISION NOT NULL,
    "supplementaryUnit" DOUBLE PRECISION,
    "value" DOUBLE PRECISION NOT NULL,
    "originCountryCode" TEXT NOT NULL,
    "provCountryCode" TEXT NOT NULL,
    "deptCode" TEXT NOT NULL,
    "nomenclatureId" TEXT NOT NULL,
    "headerId" TEXT NOT NULL,

    CONSTRAINT "InvoiceLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductHistory" (
    "id" TEXT NOT NULL,
    "productLabel" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "nomenclatureId" TEXT NOT NULL,
    "lastUsed" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Country_code_key" ON "Country"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Department_code_key" ON "Department"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Nomenclature_code_year_key" ON "Nomenclature"("code", "year");

-- CreateIndex
CREATE UNIQUE INDEX "Company_siret_key" ON "Company"("siret");

-- CreateIndex
CREATE UNIQUE INDEX "Company_vatNumber_key" ON "Company"("vatNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Partner_vatNumber_companyId_key" ON "Partner"("vatNumber", "companyId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductHistory_partnerId_productLabel_key" ON "ProductHistory"("partnerId", "productLabel");

-- AddForeignKey
ALTER TABLE "Partner" ADD CONSTRAINT "Partner_isoCode_fkey" FOREIGN KEY ("isoCode") REFERENCES "Country"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Partner" ADD CONSTRAINT "Partner_deptCode_fkey" FOREIGN KEY ("deptCode") REFERENCES "Department"("code") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Partner" ADD CONSTRAINT "Partner_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Declaration" ADD CONSTRAINT "Declaration_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceHeader" ADD CONSTRAINT "InvoiceHeader_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceHeader" ADD CONSTRAINT "InvoiceHeader_declarationId_fkey" FOREIGN KEY ("declarationId") REFERENCES "Declaration"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceLine" ADD CONSTRAINT "InvoiceLine_originCountryCode_fkey" FOREIGN KEY ("originCountryCode") REFERENCES "Country"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceLine" ADD CONSTRAINT "InvoiceLine_provCountryCode_fkey" FOREIGN KEY ("provCountryCode") REFERENCES "Country"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceLine" ADD CONSTRAINT "InvoiceLine_deptCode_fkey" FOREIGN KEY ("deptCode") REFERENCES "Department"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceLine" ADD CONSTRAINT "InvoiceLine_nomenclatureId_fkey" FOREIGN KEY ("nomenclatureId") REFERENCES "Nomenclature"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceLine" ADD CONSTRAINT "InvoiceLine_headerId_fkey" FOREIGN KEY ("headerId") REFERENCES "InvoiceHeader"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductHistory" ADD CONSTRAINT "ProductHistory_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductHistory" ADD CONSTRAINT "ProductHistory_nomenclatureId_fkey" FOREIGN KEY ("nomenclatureId") REFERENCES "Nomenclature"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
