//src/lib/utils.ts

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    value = 0;
  }

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function formatAddress(address: any): string {
  if (!address) return "Endereço não informado";
  if (typeof address === "string") return address;
  if (typeof address === "object") {
    const parts = [
      address.street || address.logradouro || address.address,
      address.number || address.numero,
      address.complement || address.complemento,
      address.neighborhood || address.bairro,
      address.city || address.cidade || address.localidade,
      address.state || address.estado || address.uf,
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(", ") : "Endereço não informado";
  }
  return "Endereço não informado";
}

