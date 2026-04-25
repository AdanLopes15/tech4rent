import { useStore } from "@/store";
import { MessageCircle } from "lucide-react";

const FloatingWhatsApp = () => {
  const { companySettings } = useStore();
  const digits = companySettings?.phone?.replace(/\D/g, "") || "";
  if (!digits) return null;
  const url = `https://wa.me/55${digits}?text=${encodeURIComponent("Olá, gostaria de mais informações.")}`;

  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      aria-label="Falar no WhatsApp"
      className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-success text-success-foreground shadow-[0_15px_40px_-10px_hsl(var(--success)/0.6)] transition-all duration-300 hover:scale-110"
    >
      <MessageCircle className="h-6 w-6" />
    </a>
  );
};

export default FloatingWhatsApp;
