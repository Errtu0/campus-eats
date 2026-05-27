-- CreateEnum
CREATE TYPE "CouponType" AS ENUM ('PERCENT', 'FIXED_AMOUNT');

-- CreateEnum
CREATE TYPE "CouponCategory" AS ENUM ('ALL', 'COFFEE', 'BURGERS', 'SNACKS', 'DRINKS');

-- AlterTable
ALTER TABLE "Coupon" ADD COLUMN     "applicable_to" "CouponCategory" NOT NULL DEFAULT 'ALL',
ADD COLUMN     "coupon_type" "CouponType" NOT NULL DEFAULT 'PERCENT',
ADD COLUMN     "min_cart_limit" DOUBLE PRECISION NOT NULL DEFAULT 0.0;
