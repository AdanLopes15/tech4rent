//src/components/landing/Footer.tsx

import { Mail, MapPin, Phone, Instagram, Youtube, Linkedin } from "lucide-react";
import { useStore } from "@/store";

const Footer = () => {
  const { companySettings } = useStore();

  const fantasyName = companySettings?.fantasyName || companySettings?.name || "TECH4RENT";

  const aboutDescription =
    companySettings?.siteContent?.about?.description ||
    "Soluções em equipamentos para sua empresa com qualidade, segurança e tecnologia.";

  const shortDescription =
    aboutDescription.length > 160 ? `${aboutDescription.substring(0, 160)}...` : aboutDescription;

  const address = companySettings?.address;
  const shortAddress = [address?.logradouro, address?.numero].filter(Boolean).join(", ");

  const fullAddress = [
    address?.logradouro,
    address?.numero,
    address?.bairro,
    address?.localidade && address?.uf ? `${address.localidade} - ${address.uf}` : address?.localidade || address?.uf,
  ]
    .filter(Boolean)
    .join(", ");

  const mapUrl = fullAddress
    ? `https://maps.google.com/maps?q=${encodeURIComponent(fullAddress)}&t=&z=15&ie=UTF8&iwloc=&output=embed`
    : "";

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <footer className="bg-foreground text-background py-12">
      <div className="container">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <h3 className="text-lg font-bold mb-4">{fantasyName}</h3>
            <p className="text-sm opacity-80 leading-relaxed">{shortDescription}</p>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-4">Navegação</h3>
            <ul className="space-y-2 text-sm opacity-80">
              <li>
                <button onClick={() => scrollTo("hero")} className="hover:opacity-100 transition-opacity">
                  Início
                </button>
              </li>
              <li>
                <button onClick={() => scrollTo("equipamentos")} className="hover:opacity-100 transition-opacity">
                  Equipamentos
                </button>
              </li>
              <li>
                <button onClick={() => scrollTo("diferenciais")} className="hover:opacity-100 transition-opacity">
                  Diferenciais
                </button>
              </li>
              <li>
                <button onClick={() => scrollTo("sobre")} className="hover:opacity-100 transition-opacity">
                  Sobre Nós
                </button>
              </li>
              <li>
                <button onClick={() => scrollTo("contato")} className="hover:opacity-100 transition-opacity">
                  Contato
                </button>
              </li>
              <li>
                <a href="/login" className="hover:opacity-100 transition-opacity">
                  Área Restrita
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-4">Contato</h3>
            <ul className="space-y-3 text-sm opacity-80">
              {shortAddress && (
                <li className="flex items-start gap-2">
                  <MapPin size={16} className="mt-0.5 shrink-0" />
                  <span>{shortAddress}</span>
                </li>
              )}

              {companySettings?.phone && (
                <li className="flex items-center gap-2">
                  <Phone size={16} className="shrink-0" />
                  <span>{companySettings.phone}</span>
                </li>
              )}

              {companySettings?.email && (
                <li className="flex items-center gap-2">
                  <Mail size={16} className="shrink-0" />
                  <span>{companySettings.email}</span>
                </li>
              )}
            </ul>

            {(companySettings?.instagramUrl || companySettings?.youtubeUrl || companySettings?.linkedinUrl) && (
              <div className="flex items-center gap-3 mt-4">
                {companySettings?.instagramUrl && (
                  <a
                    href={companySettings.instagramUrl}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="Instagram"
                    className="opacity-80 hover:opacity-100 transition-opacity"
                  >
                    <Instagram size={18} />
                  </a>
                )}

                {companySettings?.youtubeUrl && (
                  <a
                    href={companySettings.youtubeUrl}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="YouTube"
                    className="opacity-80 hover:opacity-100 transition-opacity"
                  >
                    <Youtube size={18} />
                  </a>
                )}

                {companySettings?.linkedinUrl && (
                  <a
                    href={companySettings.linkedinUrl}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="LinkedIn"
                    className="opacity-80 hover:opacity-100 transition-opacity"
                  >
                    <Linkedin size={18} />
                  </a>
                )}
              </div>
            )}
          </div>

          <div>
            <h3 className="text-lg font-bold mb-4">Localização</h3>
            {mapUrl ? (
              <div className="w-full h-32 rounded-lg overflow-hidden border border-white/10">
                <iframe
                  src={mapUrl}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Mapa da empresa"
                />
              </div>
            ) : (
              <div className="w-full h-32 rounded-lg border border-white/10 flex items-center justify-center text-sm opacity-70">
                Endereço não informado
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-white/10 pt-6 text-center text-sm opacity-70">
          <p>
            © {new Date().getFullYear()} {fantasyName}. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
