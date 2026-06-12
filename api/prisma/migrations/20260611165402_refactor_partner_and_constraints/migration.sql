/*
  Warnings:

  - You are about to drop the column `companyId` on the `Partner` table. All the data in the column will be lost.
  - Made the column `declarationId` on table `DeclarationFiscale` required. This step will fail if there are existing NULL values in that column.
  - Made the column `declarationId` on table `InvoiceHeader` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "DeclarationFiscale" DROP CONSTRAINT "DeclarationFiscale_declarationId_fkey";

-- DropForeignKey
ALTER TABLE "InvoiceHeader" DROP CONSTRAINT "InvoiceHeader_declarationId_fkey";

-- DropForeignKey
ALTER TABLE "Partner" DROP CONSTRAINT "Partner_companyId_fkey";

-- DropIndex
DROP INDEX "Partner_vatNumber_companyId_key";

-- AlterTable
ALTER TABLE "DeclarationFiscale" ALTER COLUMN "declarationId" SET NOT NULL;

-- AlterTable
ALTER TABLE "InvoiceHeader" ALTER COLUMN "declarationId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Partner" DROP COLUMN "companyId";

-- CreateTable
CREATE TABLE "CompanyPartner" (
    "companyId" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,

    CONSTRAINT "CompanyPartner_pkey" PRIMARY KEY ("companyId","partnerId")
);

-- AddForeignKey
ALTER TABLE "CompanyPartner" ADD CONSTRAINT "CompanyPartner_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyPartner" ADD CONSTRAINT "CompanyPartner_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeclarationFiscale" ADD CONSTRAINT "DeclarationFiscale_declarationId_fkey" FOREIGN KEY ("declarationId") REFERENCES "Declaration"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceHeader" ADD CONSTRAINT "InvoiceHeader_declarationId_fkey" FOREIGN KEY ("declarationId") REFERENCES "Declaration"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
