import { useStore } from "@/store";
import whatsappIcon from "@/assets/landing/whatsapp-icon.png";

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
      className="fixed bottom-5 right-5 z-50 flex h-16 w-16 items-center justify-center transition-all duration-300 hover:scale-110"
    >
      <img src={whatsappIcon} alt="WhatsApp" className="h-full w-full object-contain" />
    </a>
  );
};

export default FloatingWhatsApp;
