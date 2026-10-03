import type { OrderStatus, FulfillmentMethod } from "@prisma/client";

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  RECEIVED: "Reçue",
  PROCESSING: "En traitement",
  COMPLETED: "Complétée",
  CANCELLED: "Annulée",
};

export const FULFILLMENT_LABEL: Record<FulfillmentMethod, string> = {
  PICKUP: "Cueillette en boutique",
  DELIVERY: "Livraison",
};

export type AddressSnapshot = {
  firstName?: string; lastName?: string; company?: string;
  address1?: string; address2?: string; city?: string; state?: string; postcode?: string; country?: string; phone?: string;
};

export function asAddress(value: unknown): AddressSnapshot | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as AddressSnapshot;
}

export function formatAddressLines(a: AddressSnapshot | null): string[] {
  if (!a) return [];
  return [
    [a.firstName, a.lastName].filter(Boolean).join(" "),
    a.company,
    a.address1,
    a.address2,
    [a.city, a.state, a.postcode].filter(Boolean).join(", "),
  ].filter((x): x is string => Boolean(x));
}

export function nextOrderNumber(id: number): string {
  return `TDE-${String(id).padStart(6, "0")}`;
}
