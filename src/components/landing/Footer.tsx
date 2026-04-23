//src/components/landing/Footer.tsx

import { Instagram, Linkedin, Mail, MapPin, Phone, Youtube } from "lucide-react";
import { useStore } from "@/store";

const Footer = () => {
  const { companySettings } = useStore();
  const fantasyName = companySettings?.fantasyName || companySettings?.name || "TECH4RENT";
  const siteLogoUrl = companySettings?.siteLogoUrl;
  const address = companySettings?.address;
  const fullAddress = [
    address?.logradouro,
    address?.numero,
    address?.bairro,
    address?.localidade && address?.uf ? `${address.localidade} - ${address.uf}` : address?.localidade || address?.uf,
  ].filter(Boolean).join(", ");

  return (
    <footer className="bg-foreground pt-12 text-background">
      <div className="container max-w-5xl">
        <div className="grid gap-12 py-8 md:grid-cols-4">
          <div className="space-y-7">
            {siteLogoUrl ? (
              <img src={siteLogoUrl} alt="Logo da Tech4Rent" className="h-8 w-auto max-w-28 object-contain brightness-0 invert" />
            ) : (
              <h3 className="text-xl font-black tracking-tight">{fantasyName}</h3>
            )}
            <p className="text-xs leading-relaxed text-background/75">Coletores, leitores, tablets e equipamentos para logística e operação.</p>
          </div>

          <div>
            <h3 className="mb-4 text-xs font-black uppercase tracking-widest">Navegação</h3>
            <ul className="space-y-3 text-xs text-background/75">
              <li>Produtos</li>
              <li>Coletores PDA</li>
              <li>Leitores de Código</li>
              <li>Impressoras Térmicas</li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-xs font-black uppercase tracking-widest">Institucional</h3>
            <ul className="space-y-3 text-xs text-background/75">
              <li>Sobre a Tech4Rent</li>
              <li>Blog</li>
              <li>Suporte e Contato</li>
              <li>Política de Devolução</li>
              <li>Dúvidas Frequentes</li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-xs font-black uppercase tracking-widest">Contato</h3>
            <ul className="space-y-3 text-xs text-background/75">
              {companySettings?.phone && <li className="flex gap-2"><Phone className="h-3.5 w-3.5 shrink-0" />{companySettings.phone}</li>}
              {companySettings?.email && <li className="flex gap-2"><Mail className="h-3.5 w-3.5 shrink-0" />{companySettings.email}</li>}
              {fullAddress && <li className="flex gap-2"><MapPin className="h-3.5 w-3.5 shrink-0" />{fullAddress}</li>}
              <li>Segunda a Sexta, 8h às 18h</li>
            </ul>
            <div className="mt-4 flex gap-3 text-background/80">
              {companySettings?.instagramUrl && <a href={companySettings.instagramUrl} target="_blank" rel="noreferrer" aria-label="Instagram"><Instagram className="h-4 w-4" /></a>}
              {companySettings?.youtubeUrl && <a href={companySettings.youtubeUrl} target="_blank" rel="noreferrer" aria-label="YouTube"><Youtube className="h-4 w-4" /></a>}
              {companySettings?.linkedinUrl && <a href={companySettings.linkedinUrl} target="_blank" rel="noreferrer" aria-label="LinkedIn"><Linkedin className="h-4 w-4" /></a>}
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-background/10 py-5 text-center text-[11px] leading-relaxed text-background/50">
        <p>{companySettings?.name || fantasyName} — CNPJ: {companySettings?.cnpj || ""}</p>
        <p>© {new Date().getFullYear()} {fantasyName}. Todos os direitos reservados.</p>
        <p>Empresa orgulhosamente brasileira BR</p>
      </div>
    </footer>
  );
};

export default Footer;
