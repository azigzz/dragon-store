import type { StoreProduct } from "@/lib/types";

export function parsePrice(value: string) {
  const raw = String(value || "")
    .replace(/[^\d,.-]/g, "")
    .replace(/\.(?=\d{3}(\D|$))/g, "")
    .replace(",", ".");
  const amount = Number.parseFloat(raw);
  return Number.isFinite(amount) ? amount : null;
}

export function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function cartTotal(items: StoreProduct[]) {
  return items.reduce((total, item) => total + (parsePrice(item.price) || 0), 0);
}

export function hasUnknownPrices(items: StoreProduct[]) {
  return items.some(item => parsePrice(item.price) === null);
}
