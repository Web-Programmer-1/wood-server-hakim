-- CreateTable
CREATE TABLE "slider_banners" (
    "id" TEXT NOT NULL,
    "subHeading" TEXT,
    "heading" TEXT NOT NULL,
    "buttonText" TEXT,
    "buttonUrl" TEXT,
    "tagOne" TEXT,
    "tagTwo" TEXT,
    "tagThree" TEXT,
    "bgImageUrl" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "slider_banners_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "slider_banners_subHeading_key" ON "slider_banners"("subHeading");

-- CreateIndex
CREATE UNIQUE INDEX "slider_banners_heading_key" ON "slider_banners"("heading");

-- CreateIndex
CREATE UNIQUE INDEX "slider_banners_tagOne_key" ON "slider_banners"("tagOne");

-- CreateIndex
CREATE INDEX "slider_banners_sortOrder_idx" ON "slider_banners"("sortOrder");
