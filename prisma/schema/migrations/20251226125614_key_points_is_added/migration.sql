-- CreateTable
CREATE TABLE "ProductKeyPoint" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductKeyPoint_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProductKeyPoint_productId_idx" ON "ProductKeyPoint"("productId");

-- AddForeignKey
ALTER TABLE "ProductKeyPoint" ADD CONSTRAINT "ProductKeyPoint_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
