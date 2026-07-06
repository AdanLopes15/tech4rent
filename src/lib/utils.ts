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

// Máscara de dinheiro (digitação de trás para frente). Retorna ex: "R$ 90,99"
export function maskCurrencyBR(input: string | number | null | undefined): string {
  const digits = String(input ?? "").replace(/\D/g, "");
  const cents = digits ? parseInt(digits, 10) : 0;
  return formatCurrency(cents / 100);
}

// Converte valor mascarado/numérico em número decimal. Ex: "R$ 1.200,00" -> 1200
export function parseCurrencyBR(masked: string | number | null | undefined): number {
  if (typeof masked === "number") return Number.isNaN(masked) ? 0 : masked;
  const digits = String(masked ?? "").replace(/\D/g, "");
  return digits ? parseInt(digits, 10) / 100 : 0;
}

// Máscara de dinheiro com 4 casas decimais (digitação de trás para frente). Ex: "R$ 355,4075"
export function maskCurrencyBR4(input: string | number | null | undefined): string {
  const digits = String(input ?? "").replace(/\D/g, "");
  const units = digits ? parseInt(digits, 10) / 10000 : 0;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  }).format(units);
}

// Converte valor mascarado (4 casas) em número decimal. Ex: "R$ 355,4075" -> 355.4075
export function parseCurrencyBR4(masked: string | number | null | undefined): number {
  if (typeof masked === "number") return Number.isNaN(masked) ? 0 : masked;
  const digits = String(masked ?? "").replace(/\D/g, "");
  return digits ? parseInt(digits, 10) / 10000 : 0;
}

// Formata valor unitário exibindo até 4 casas decimais. Ex: "R$ 355,4075"
export function formatCurrency4(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) value = 0;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
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

