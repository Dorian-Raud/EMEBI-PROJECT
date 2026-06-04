/*
  Warnings:

  - You are about to drop the column `deptCode` on the `InvoiceLine` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[vatNumber]` on the table `Partner` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `deptCode` to the `InvoiceHeader` table without a default value. This is not possible if the table is not empty.
  - Made the column `invoiceNumber` on table `InvoiceHeader` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "InvoiceHeader" DROP CONSTRAINT "InvoiceHeader_declarationId_fkey";

-- DropForeignKey
ALTER TABLE "InvoiceLine" DROP CONSTRAINT "InvoiceLine_deptCode_fkey";

-- AlterTable
ALTER TABLE "InvoiceHeader" ADD COLUMN     "deptCode" TEXT NOT NULL,
ALTER COLUMN "invoiceNumber" SET NOT NULL,
ALTER COLUMN "declarationId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "InvoiceLine" DROP COLUMN "deptCode";

-- CreateIndex
CREATE UNIQUE INDEX "Partner_vatNumber_key" ON "Partner"("vatNumber");

-- AddForeignKey
ALTER TABLE "InvoiceHeader" ADD CONSTRAINT "InvoiceHeader_deptCode_fkey" FOREIGN KEY ("deptCode") REFERENCES "Department"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceHeader" ADD CONSTRAINT "InvoiceHeader_declarationId_fkey" FOREIGN KEY ("declarationId") REFERENCES "Declaration"("id") ON DELETE SET NULL ON UPDATE CASCADE;
