CREATE TYPE "Role" AS ENUM ('CUSTOMER', 'ADMIN', 'DELIVERY');
CREATE TYPE "OrderStatus" AS ENUM ('PENDING_PAYMENT', 'PAID', 'PACKED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'EXPIRED');
CREATE TYPE "PaymentStatus" AS ENUM ('CAPTURED', 'FAILED', 'REFUNDED', 'AMOUNT_MISMATCH');
CREATE TYPE "CattleType" AS ENUM ('COW', 'BULL', 'CALF');
CREATE TYPE "CowCategory" AS ENUM ('MILKING', 'DRY', 'PREGNANT', 'HEIFER');

CREATE TABLE "User" (
  "id" SERIAL NOT NULL,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "role" "Role" NOT NULL DEFAULT 'CUSTOMER',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RefreshToken" (
  "id" SERIAL NOT NULL,
  "userId" INTEGER NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "revokedAt" TIMESTAMP(3),
  CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Product" (
  "id" SERIAL NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "imageUrl" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Variant" (
  "id" SERIAL NOT NULL,
  "productId" INTEGER NOT NULL,
  "sku" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "pricePaise" INTEGER NOT NULL,
  "stock" INTEGER NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  CONSTRAINT "Variant_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DeliveryZone" (
  "id" SERIAL NOT NULL,
  "pincode" TEXT NOT NULL,
  "areaName" TEXT NOT NULL,
  "deliveryFeePaise" INTEGER NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  CONSTRAINT "DeliveryZone_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Order" (
  "id" SERIAL NOT NULL,
  "orderNumber" TEXT NOT NULL,
  "userId" INTEGER NOT NULL,
  "status" "OrderStatus" NOT NULL DEFAULT 'PENDING_PAYMENT',
  "subtotalPaise" INTEGER NOT NULL,
  "deliveryFeePaise" INTEGER NOT NULL,
  "totalPaise" INTEGER NOT NULL,
  "shippingAddress" JSONB NOT NULL,
  "idempotencyKey" TEXT NOT NULL,
  "razorpayOrderId" TEXT,
  "reservationExpiresAt" TIMESTAMP(3) NOT NULL,
  "deliveryOtpHash" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "OrderItem" (
  "id" SERIAL NOT NULL,
  "orderId" INTEGER NOT NULL,
  "variantId" INTEGER NOT NULL,
  "productName" TEXT NOT NULL,
  "variantLabel" TEXT NOT NULL,
  "unitPricePaise" INTEGER NOT NULL,
  "quantity" INTEGER NOT NULL,
  CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Payment" (
  "id" SERIAL NOT NULL,
  "orderId" INTEGER NOT NULL,
  "razorpayPaymentId" TEXT NOT NULL,
  "amountPaise" INTEGER NOT NULL,
  "status" "PaymentStatus" NOT NULL,
  "method" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "WebhookEvent" (
  "id" SERIAL NOT NULL,
  "eventId" TEXT NOT NULL,
  "eventType" TEXT NOT NULL,
  "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "WebhookEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "OrderStatusHistory" (
  "id" SERIAL NOT NULL,
  "orderId" INTEGER NOT NULL,
  "fromStatus" "OrderStatus",
  "toStatus" "OrderStatus" NOT NULL,
  "changedBy" TEXT NOT NULL,
  "note" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "OrderStatusHistory_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Cattle" (
  "id" SERIAL NOT NULL,
  "tagId" TEXT NOT NULL,
  "type" "CattleType" NOT NULL,
  "breed" TEXT NOT NULL,
  "category" "CowCategory",
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Cattle_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "RefreshToken_tokenHash_key" ON "RefreshToken"("tokenHash");
CREATE UNIQUE INDEX "Product_slug_key" ON "Product"("slug");
CREATE UNIQUE INDEX "Variant_sku_key" ON "Variant"("sku");
CREATE INDEX "Variant_productId_idx" ON "Variant"("productId");
CREATE UNIQUE INDEX "DeliveryZone_pincode_key" ON "DeliveryZone"("pincode");
CREATE UNIQUE INDEX "Order_orderNumber_key" ON "Order"("orderNumber");
CREATE UNIQUE INDEX "Order_razorpayOrderId_key" ON "Order"("razorpayOrderId");
CREATE UNIQUE INDEX "Order_userId_idempotencyKey_key" ON "Order"("userId", "idempotencyKey");
CREATE INDEX "Order_status_reservationExpiresAt_idx" ON "Order"("status", "reservationExpiresAt");
CREATE UNIQUE INDEX "Payment_razorpayPaymentId_key" ON "Payment"("razorpayPaymentId");
CREATE UNIQUE INDEX "WebhookEvent_eventId_key" ON "WebhookEvent"("eventId");
CREATE UNIQUE INDEX "Cattle_tagId_key" ON "Cattle"("tagId");

ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Variant" ADD CONSTRAINT "Variant_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Order" ADD CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "Variant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OrderStatusHistory" ADD CONSTRAINT "OrderStatusHistory_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
