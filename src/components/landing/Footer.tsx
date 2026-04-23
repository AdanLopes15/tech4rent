//src/components/landing/Footer.tsx

import { Instagram, Linkedin, Mail, MapPin, Phone, Youtube } from "lucide-react";
import { useStore } from "@/store";

const Footer = () => {
  const { companySettings } = useStore();
  const fantasyName = companySettings?.fantasyName || companySettings?.name || "TECH4RENT";
  const siteLogoUrl = companySettings?.siteLogoUrl;
  const aboutDescription =
    companySettings?.siteContent?.about?.description ||
    "Soluções em equipamentos para empresas com qualidade, segurança, tecnologia e suporte especializado.";

  const address = companySettings?.address;
  const fullAddress = [
    address?.logradouro,
    address?.numero,
    address?.bairro,
    address?.localidade && address?.uf ? `${address.localidade} - ${address.uf}` : address?.localidade || address?.uf,
  ]
    .filter(Boolean)
    .join(", ");

  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

  return (
    <footer className="bg-foreground py-14 text-background">
      <div className="container">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-[1.3fr_0.8fr_0.8fr_1.1fr]">
          <div className="space-y-5">
            {siteLogoUrl ? (
              <img src={siteLogoUrl} alt="Logo da Tech4Rent" className="h-12 w-auto max-w-48 object-contain brightness-0 invert" />
            ) : (
              <h3 className="text-2xl font-black tracking-tight">{fantasyName}</h3>
            )}
            <p className="max-w-sm text-sm leading-relaxed text-background/70">{aboutDescription.substring(0, 190)}</p>
            <div className="flex items-center gap-3">
              {companySettings?.instagramUrl && (
                <a href={companySettings.instagramUrl} target="_blank" rel="noreferrer" aria-label="Instagram" className="text-background/70 hover:text-primary">
                  <Instagram className="h-5 w-5" />
                </a>
              )}
              {companySettings?.youtubeUrl && (
                <a href={companySettings.youtubeUrl} target="_blank" rel="noreferrer" aria-label="YouTube" className="text-background/70 hover:text-primary">
                  <Youtube className="h-5 w-5" />
                </a>
              )}
              {companySettings?.linkedinUrl && (
                <a href={companySettings.linkedinUrl} target="_blank" rel="noreferrer" aria-label="LinkedIn" className="text-background/70 hover:text-primary">
                  <Linkedin className="h-5 w-5" />
                </a>
              )}
            </div>
          </div>

          <div>
            <h3 className="mb-4 font-bold">Navegação</h3>
            <ul className="space-y-3 text-sm text-background/70">
              {[
                ["Produtos", "equipamentos"],
                ["Diferenciais", "diferenciais"],
                ["Sobre", "sobre"],
                ["Contato", "contato"],
              ].map(([label, id]) => (
                <li key={id}>
                  <button onClick={() => scrollTo(id)} className="transition-colors hover:text-primary">
                    {label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-4 font-bold">Institucional</h3>
            <ul className="space-y-3 text-sm text-background/70">
              <li>Locação</li>
              <li>Venda</li>
              <li>Suporte técnico</li>
              <li><a href="/login" className="transition-colors hover:text-primary">Área Restrita</a></li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 font-bold">Contato</h3>
            <ul className="space-y-4 text-sm text-background/70">
              {companySettings?.phone && <li className="flex gap-3"><Phone className="mt-0.5 h-4 w-4 shrink-0 text-primary" />{companySettings.phone}</li>}
              {companySettings?.email && <li className="flex gap-3"><Mail className="mt-0.5 h-4 w-4 shrink-0 text-primary" />{companySettings.email}</li>}
              {fullAddress && <li className="flex gap-3"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />{fullAddress}</li>}
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-background/10 pt-6 text-center text-xs text-background/55">
          © {new Date().getFullYear()} {fantasyName}. Todos os direitos reservados.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
