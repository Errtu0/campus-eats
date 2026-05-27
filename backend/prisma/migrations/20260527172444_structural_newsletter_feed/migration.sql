-- CreateTable
CREATE TABLE "PromotionNews" (
    "id" SERIAL NOT NULL,
    "restaurant_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "image_tag" TEXT NOT NULL DEFAULT 'default',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PromotionNews_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PromotionNews" ADD CONSTRAINT "PromotionNews_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
