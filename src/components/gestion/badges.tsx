import type { OrderStatus, ProductStatus } from "@prisma/client";
import { ORDER_STATUS_LABEL } from "@/lib/orders/format";
import { PRODUCT_STATUS_LABEL, STOCK_STATUS_LABEL } from "@/lib/gestion/format";
import { Badge, type Tone } from "./ui";

const ORDER_TONE: Record<OrderStatus, Tone> = {
  RECEIVED: "danger",
  PROCESSING: "warning",
  COMPLETED: "success",
  CANCELLED: "neutral",
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return <Badge tone={ORDER_TONE[status]}>{ORDER_STATUS_LABEL[status]}</Badge>;
}

const PRODUCT_TONE: Record<ProductStatus, Tone> = {
  PUBLISHED: "success",
  DRAFT: "neutral",
  PRIVATE: "info",
  PENDING: "warning",
  TRASH: "danger",
};

export function ProductStatusBadge({ status }: { status: ProductStatus }) {
  return <Badge tone={PRODUCT_TONE[status]}>{PRODUCT_STATUS_LABEL[status]}</Badge>;
}

export function StockBadge({ status, quantity }: { status: string; quantity?: number | null }) {
  const tone: Tone = status === "instock" ? "success" : status === "onbackorder" ? "warning" : "danger";
  const label = STOCK_STATUS_LABEL[status] ?? status;
  return <Badge tone={tone}>{quantity !== null && quantity !== undefined ? `${label} · ${quantity}` : label}</Badge>;
}
