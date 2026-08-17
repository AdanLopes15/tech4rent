// src/lib/private-file.ts
//
// Abertura de documentos privados (contratos assinados, boletos, comprovantes).
//
// Antes, as telas faziam window.open() direto na URL persistida no Firestore.
// Essa URL é permanente e pública: quem a obtivesse conseguia baixar o arquivo
// para sempre, sem passar pelas Storage Rules.
//
// Aqui a URL é obtida NO MOMENTO DO CLIQUE, via getDownloadURL(), que é
// governado pelas regras — só quem tem permissão de leitura no caminho
// consegue o link. O valor guardado no Firestore deixa de ser o que autoriza
// o acesso.

import { ref, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";
import { toast } from "sonner";

const LEGACY_BLOB_MESSAGE =
  "Este anexo foi salvo em um formato antigo e não está mais disponível. Reenvie o arquivo.";

/**
 * Abre um arquivo privado do Storage em nova aba.
 * Aceita tanto a URL completa quanto o caminho (`contracts/CTR-001/x.pdf`),
 * pois ref() resolve as duas formas.
 */
export async function openPrivateFile(urlOrPath?: string | null): Promise<void> {
  if (!urlOrPath) {
    toast.error("Nenhum arquivo anexado.");
    return;
  }

  // Anexos legados gravados como URL.createObjectURL(): só valiam na aba que
  // os criou e nunca chegaram ao Storage.
  if (urlOrPath.startsWith("blob:")) {
    toast.error(LEGACY_BLOB_MESSAGE);
    return;
  }

  // A aba precisa ser aberta de forma SÍNCRONA, ainda dentro do gesto do
  // usuário. Chamar window.open() depois do await faz o navegador barrar
  // como popup.
  const win = window.open("", "_blank");
  if (win) win.opener = null;

  try {
    const freshUrl = await getDownloadURL(ref(storage, urlOrPath));

    if (win) {
      win.location.href = freshUrl;
      return;
    }

    // Popup bloqueado: navega por âncora.
    const anchor = document.createElement("a");
    anchor.href = freshUrl;
    anchor.target = "_blank";
    anchor.rel = "noopener noreferrer";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  } catch (error: any) {
    win?.close();

    const code = String(error?.code || "");
    if (code === "storage/unauthorized") {
      toast.error("Você não tem permissão para acessar este arquivo.");
    } else if (code === "storage/object-not-found") {
      toast.error("Arquivo não encontrado. Ele pode ter sido removido.");
    } else if (code === "storage/invalid-argument" || code === "storage/invalid-url") {
      toast.error(LEGACY_BLOB_MESSAGE);
    } else {
      toast.error(error?.message || "Não foi possível abrir o arquivo.");
    }
  }
}
