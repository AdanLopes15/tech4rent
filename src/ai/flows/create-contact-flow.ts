import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface CreateContactInput {
  name: string;
  email: string;
  phone: string;
  message: string;
}

interface CreateContactResult {
  success: boolean;
  message: string;
}

export async function createContact(input: CreateContactInput): Promise<CreateContactResult> {
  try {
    await addDoc(collection(db, "siteContacts"), {
      ...input,
      status: "novo",
      createdAt: serverTimestamp(),
    });

    return {
      success: true,
      message: "Mensagem enviada com sucesso! Entraremos em contato em breve.",
    };
  } catch (error: any) {
    console.error("Erro ao criar contato:", error);
    return {
      success: false,
      message: error?.message || "Erro ao enviar mensagem. Tente novamente.",
    };
  }
}
