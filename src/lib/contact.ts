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

  return normalizedPhone ? `https://api.whatsapp.com/send?phone=${normalizedPhone}` : "";
};

export const openWhatsappLink = (record: Record<string, any> | null | undefined) => {
  const link = getWhatsappLink(record);

  if (!link || typeof window === "undefined") return;

  window.location.assign(link);
};
