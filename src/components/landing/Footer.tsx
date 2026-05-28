//src/components/landing/Footer.tsx
import logoWhite from "@/assets/landing/logo-tech4rent.png";

import { Clock, Instagram, Linkedin, Lock, Mail, MapPin, Phone, Youtube } from "lucide-react";
import { CompanyLogo } from "../admin/CompanyLogo";
import { Link } from "react-router-dom";
import { useStore } from "@/store";

const Footer = () => {
  const { companySettings } = useStore();
  const fantasyName = companySettings?.fantasyName || companySettings?.name || "TECH4RENT";
  const siteLogoUrl = companySettings?.siteLogoUrl && companySettings.siteLogoUrl !== "" ? companySettings.siteLogoUrl : logoWhite;
  const address = companySettings?.address;
  const fullAddress = [
    address?.logradouro,
    address?.numero,
    address?.bairro,
    address?.localidade && address?.uf ? `${address.localidade} - ${address.uf}` : address?.localidade || address?.uf,
  ].filter(Boolean).join(", ");

  return (
    <footer className="bg-[#05070D] pt-12 text-white border-t border-white/10">
      <div className="container max-w-5xl">
        <div className="grid gap-12 py-8 md:grid-cols-4">
          <div className="space-y-7">
            <img
              src={siteLogoUrl}
              alt="Logo da Tech4Rent"
              className="h-12 w-auto max-w-44 object-contain"
            />
            <p className="text-xs leading-relaxed text-white/60">Coletores, leitores, tablets e equipamentos para logística e operação.</p>
          </div>

          <div>
            <h3 className="mb-4 text-xs font-black uppercase tracking-widest">Navegação</h3>
            <ul className="space-y-3 text-xs text-white/60">
              <li><a href="#produtos" className="transition-colors hover:text-white">Produtos</a></li>
              <li><a href="#duvidas" className="transition-colors hover:text-white">Dúvidas</a></li>
              <li><a href="#quem-somos" className="transition-colors hover:text-white">Sobre</a></li>
              <li><a href="#contato" className="transition-colors hover:text-white">Contato</a></li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-xs font-black uppercase tracking-widest">Institucional</h3>
            <ul className="space-y-3 text-xs text-white/60">
              <li><a href="#quem-somos" className="transition-colors hover:text-white">Sobre a Tech4Rent</a></li>
              <li><a href="#contato" className="transition-colors hover:text-white">Suporte e Contato</a></li>
              <li><a href="#duvidas" className="transition-colors hover:text-white">Dúvidas Frequentes</a></li>
            </ul>
          </div>


          <div>
            <h3 className="mb-4 text-xs font-black uppercase tracking-widest">Contato</h3>
            <ul className="space-y-3 text-xs text-white/60">
              {companySettings?.phone && <li className="flex gap-2"><Phone className="h-3.5 w-3.5 shrink-0" />{companySettings.phone}</li>}
              {companySettings?.email && <li className="flex gap-2"><Mail className="h-3.5 w-3.5 shrink-0" />{companySettings.email}</li>}
              {fullAddress && <li className="flex gap-2"><MapPin className="h-3.5 w-3.5 shrink-0" />{fullAddress}</li>}
              <li className="flex items-center gap-2">
                <Clock className="h-3.5 w-3.5 shrink-0" />
                <span>Segunda a Sexta, 8h às 18h</span>
              </li>
              <li>
                <a
                  href={companySettings?.instagramUrl || "#"}
                  target={companySettings?.instagramUrl ? "_blank" : undefined}
                  rel="noreferrer"
                  aria-label="Instagram"
                  className="inline-flex transition-colors hover:text-white"
                >
                  <Instagram className="h-4 w-4" />
                </a>
              </li>
            </ul>
            <div className="mt-4 flex gap-3 text-white/60">
              {companySettings?.youtubeUrl && <a href={companySettings.youtubeUrl} target="_blank" rel="noreferrer" aria-label="YouTube" className="hover:text-white"><Youtube className="h-4 w-4" /></a>}
              {companySettings?.linkedinUrl && <a href={companySettings.linkedinUrl} target="_blank" rel="noreferrer" aria-label="LinkedIn" className="hover:text-white"><Linkedin className="h-4 w-4" /></a>}
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 py-5 text-center text-[11px] leading-relaxed text-white/40">
        <p>{companySettings?.name || fantasyName} — CNPJ: {companySettings?.cnpj || ""}</p>
        <p>© {new Date().getFullYear()} {fantasyName}. Todos os direitos reservados.</p>
        <p>Empresa orgulhosamente brasileira BR</p>
        <p className="mt-2">
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-white/30 transition-colors hover:text-white/60"
          >
            <Lock className="h-3 w-3" /> Área Restrita
          </Link>
        </p>
      </div>
    </footer>
  );
};

export default Footer;