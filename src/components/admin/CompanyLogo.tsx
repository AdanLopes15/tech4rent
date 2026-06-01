
import React, { useState, useEffect } from "react";
import logoTech4RentAsset from "@/assets/landing/logo-tech4rent.png";
import { cn } from "@/lib/utils";

interface CompanyLogoProps {
  className?: string;
  style?: React.CSSProperties;
  isDark?: boolean;
  useSettings?: boolean;
}

/**
 * Componente centralizado para exibição da logo Tech4Rent.
 * Gerencia fallbacks e garante visibilidade em modos claro/escuro.
 */
export const CompanyLogo = ({ className, style, isDark = false, useSettings = false }: CompanyLogoProps) => {
  // URLs estáveis para a logo
  const LIGHT_LOGO_URL = "/logo-tech4rent-light.png"; // Versão gerada com texto escuro (#0D1B2A)
  const DARK_LOGO_URL = "/lovable-uploads/48e895df-32f2-443b-9e4a-977ca36b043d.png";   // Versão com texto branco (mantida)

  const [imgSrc, setImgSrc] = useState<string>(isDark ? DARK_LOGO_URL : LIGHT_LOGO_URL);
  const [hasError, setHasError] = useState(false);

  // Efeito para atualizar o src quando o tema mudar ou se houver erro
  useEffect(() => {
    if (!hasError) {
      setImgSrc(isDark ? DARK_LOGO_URL : LIGHT_LOGO_URL);
    }
  }, [isDark, hasError]);

  const handleError = () => {
    console.warn("Logo URL failed to load, falling back to local asset.");
    setHasError(true);
    setImgSrc(logoTech4RentAsset);
  };

  return (
    <img
      src={imgSrc}
      alt="Tech4Rent Logo"
      onError={handleError}
      style={style}
      crossOrigin="anonymous"
      className={cn("object-contain", className)}
    />
  );
};
