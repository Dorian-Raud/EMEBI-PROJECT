/*
  Warnings:

  - A unique constraint covering the columns `[companyId,month,year,flow]` on the table `Declaration` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Declaration_companyId_month_year_flow_key" ON "Declaration"("companyId", "month", "year", "flow");
