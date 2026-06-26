//src/lib/contact.ts

const PHONE_FIELDS = ["phone", "telefone", "whatsapp", "celular", "cellphone", "mobile"] as const;

export const getContactPhone = (record: Record<string, any> | null | undefined) => {
  if (!record) return "";

  for (const field of PHONE_FIELDS) {
    const value = record[field];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return "";
};

// Formata um telefone para o padrão brasileiro de exibição.
// 11 dígitos -> (XX) XXXXX-XXXX | 10 dígitos -> (XX) XXXX-XXXX
export const formatPhoneBR = (phone: string | null | undefined): string => {
  if (!phone) return "—";
  const digits = String(phone).replace(/\D/g, "").slice(0, 11);
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return digits || "—";
};

// Aplica máscara em tempo real durante a digitação (parcial).
export const maskPhoneBR = (phone: string | null | undefined): string => {
  const digits = String(phone ?? "").replace(/\D/g, "").slice(0, 11);
  if (!digits) return "";
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
};

export const normalizeWhatsappPhone = (phone: string) => {
  const digits = phone.replace(/\D/g, "");

  if (!digits) return "";
  if (digits.startsWith("55") && (digits.length === 12 || digits.length === 13)) return digits;
  if (digits.length === 10 || digits.length === 11) return `55${digits}`;

  return digits;
};

export const getWhatsappLink = (record: Record<string, any> | null | undefined) => {
  const phone = getContactPhone(record);
  const normalizedPhone = normalizeWhatsappPhone(phone);

  return normalizedPhone ? `https://wa.me/${normalizedPhone}` : "";
};

export const openWhatsappLink = (record: Record<string, any> | null | undefined) => {
  const link = getWhatsappLink(record);

  if (!link || typeof window === "undefined") return;

  const anchor = document.createElement("a");
  anchor.href = link;
  anchor.target = "_blank";
  anchor.rel = "noopener noreferrer";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
};
