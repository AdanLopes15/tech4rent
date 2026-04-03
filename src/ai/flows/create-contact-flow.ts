//src/ai/flows/create-contact-flow.ts

import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getNextId } from "@/store/utils";

export interface CreateContactInput {
  name: string;
  email: string;
  phone?: string;
  message: string;
}

export interface CreateContactResult {
  success: boolean;
  message: string;
}

function validateInput(input: CreateContactInput) {
  if (!input.name?.trim()) {
    throw new Error("O nome é obrigatório.");
  }

  if (!input.email?.trim()) {
    throw new Error("O e-mail é obrigatório.");
  }

  if (!input.message?.trim()) {
    throw new Error("A mensagem é obrigatória.");
  }
}

export async function createContact(input: CreateContactInput): Promise<CreateContactResult> {
  try {
    validateInput(input);

    const contactId = await getNextId("siteContacts");

    const contactRef = doc(db, "siteContacts", contactId);

    await setDoc(contactRef, {
      id: contactId,
      name: input.name.trim(),
      email: input.email.trim(),
      phone: input.phone?.trim() || "",
      message: input.message.trim(),
      status: "new",
      createdAt: serverTimestamp(),
    });

    return {
      success: true,
      message: "Sua mensagem foi enviada com sucesso!",
    };
  } catch (error: any) {
    console.error("Erro ao criar contato:", error);

    return {
      success: false,
      message: error?.message || "Falha ao enviar mensagem.",
    };
  }
}
