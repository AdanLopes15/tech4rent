// src/lib/upload-metadata.ts
//
// Resolução de contentType para documentos privados (contrato assinado,
// boleto, comprovante).
//
// Motivo: uploadBytes(ref, file) sem metadata faz o SDK usar file.type. O
// navegador nem sempre preenche esse campo — depende do sistema operacional
// reconhecer a extensão. Quando vem vazio, o objeto sobe como
// "application/octet-stream", e as Storage Rules (que exigem
// `isPdf() || isImage()`) negam o upload com storage/unauthorized.
//
// Aqui o tipo é decidido primeiro pelo que o navegador declarou e, se isso
// não servir, pela extensão do arquivo.

const EXTENSION_CONTENT_TYPES: Record<string, string> = {
  pdf: "application/pdf",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  gif: "image/gif",
};

/**
 * Retorna o contentType a enviar, ou undefined se o arquivo não for
 * PDF nem imagem reconhecida.
 */
export function resolveDocumentContentType(file: File): string | undefined {
  const declared = (file.type || "").trim().toLowerCase();

  if (declared === "application/pdf") return "application/pdf";
  if (declared.startsWith("image/")) return declared;

  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  return EXTENSION_CONTENT_TYPES[extension];
}

/**
 * Igual à anterior, mas lança erro com mensagem clara em vez de deixar o
 * upload falhar depois como "sem permissão".
 */
export function requireDocumentContentType(file: File): string {
  const resolved = resolveDocumentContentType(file);

  if (!resolved) {
    throw new Error(
      `Tipo de arquivo não suportado (${file.name}). Envie PDF, JPG, PNG ou WebP.`,
    );
  }

  return resolved;
}
