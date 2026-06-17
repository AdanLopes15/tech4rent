import React from "react";
import { cn } from "@/lib/utils";
import { CompanyLogo } from "../../CompanyLogo";
import { useStore } from "@/store";

// Helper function to resolve item image from various possible fields
export const getItemImageUrl = (item: any, equipments: any[] = []) => {
  if (!item) return null;

  // 1. Find equipment if not already in item
  const equipment = equipments.find((eq: any) => 
    eq.id === item.equipmentId || eq.id === item.productId || eq.id === item.equipamentoId || eq.id === item.produtoId
  );

  // 2. Comprehensive list of possible image fields
  const possibleFields = [
    item.imageUrl,
    item.image,
    item.photoUrl,
    item.foto,
    item.fotoUrl,
    item.imagem,
    item.imagemUrl,
    item.equipmentImage,
    item.equipment?.imageUrl,
    item.equipment?.photoUrl,
    item.equipment?.fotoUrl,
    item.equipment?.imagem,
    item.equipment?.imagemUrl,
    item.product?.imageUrl,
    item.product?.photoUrl,
    item.product?.imagem,
    item.produto?.imagem,
    item.produto?.imagemUrl,
    item.equipamento?.imagem,
    item.equipamento?.imagemUrl,
    equipment?.imageUrl,
    equipment?.photoUrl,
    equipment?.fotoUrl,
    equipment?.imagem,
    equipment?.imagemUrl,
    equipment?.image,
    equipment?.foto
  ];

  // 3. Return the first valid absolute URL
  const validUrl = possibleFields.find(url => {
    if (url && typeof url === 'string' && url.length > 5) {
      // Ensure it's not a placeholder string
      if (url.includes('placeholder') || url.includes('your-app-will-live-here')) return false;
      return true;
    }
    return false;
  });

  return validUrl || null;
};

interface DocumentItemRowProps {
  item: any;
  equipments?: any[];
}

export const DocumentItemRow = ({ item, equipments = [] }: DocumentItemRowProps) => {
  const imageUrl = getItemImageUrl(item, equipments);
  const equipmentName = item.equipmentName || item.productName || item.name || 
                        equipments.find(e => e.id === item.equipmentId)?.name || "Equipamento";
  const equipmentDescription = item.description || equipments.find(e => e.id === item.equipmentId)?.description;

  return (
    <div className="flex items-start gap-4 py-1 min-w-[250px]">
      <div className="w-16 h-16 flex-shrink-0 border border-[#e5e5e5] rounded overflow-hidden bg-white flex items-center justify-center">
        {imageUrl ? (
          <img 
            src={imageUrl} 
            alt={equipmentName}
            className="w-full h-full object-contain"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.onerror = null; 
              target.src = ""; // Clear src to trigger fallback or hidden state
              target.classList.add('hidden');
              const parent = target.parentElement;
              if (parent && !parent.querySelector('.fallback-icon')) {
                const icon = document.createElement('div');
                icon.className = 'fallback-icon w-full h-full flex flex-col items-center justify-center bg-gray-50';
                icon.innerHTML = '<span class="text-[8px] text-gray-400 text-center font-bold leading-none uppercase px-1">Sem<br/>foto</span>';
                parent.appendChild(icon);
              }
            }}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50">
            <span className="text-[8px] text-gray-400 text-center font-bold leading-none uppercase px-1">Sem<br/>foto</span>
          </div>
        )}
      </div>
      <div className="flex flex-col min-w-0 flex-1">
        <span className="text-sm font-bold text-[#1a1a1a] leading-tight mb-0.5">{equipmentName}</span>
        {equipmentDescription && (
          <span className="text-[10px] text-[#666666] leading-snug line-clamp-2">
            {equipmentDescription}
          </span>
        )}
      </div>
    </div>
  );
};


// Cores base para o estilo clássico/corporativo
const CLASSIC_COLORS = {
  text: "#1a1a1a",
  textMuted: "#666666",
  border: "#e5e5e5",
  blue: "#1E88E5",
};

interface DocumentContainerProps {
  children: React.ReactNode;
  className?: string;
}

export const DocumentContainer = ({ children, className }: DocumentContainerProps) => {
  return (
    <div 
      className={cn(
        "document-print-root",
        "bg-white text-[#1a1a1a] p-10 mx-auto shadow-sm print:shadow-none print:p-8",
        "w-full max-w-[210mm] min-h-[297mm] flex flex-col gap-4",
        "print:min-h-0",
        "font-sans leading-normal",
        "print:m-0 print:w-full",
        className
      )}
      style={{
        boxSizing: 'border-box',
        WebkitPrintColorAdjust: 'exact',
        printColorAdjust: 'exact'
      } as any}
    >
      {children}
    </div>
  );
};

interface DocumentHeaderProps {
  title: string;
  documentNumber: string;
  date: string;
  subtitle?: string;
  responsible?: string;
  onResponsibleChange?: (value: string) => void;
  companyInfo?: {
    name: string;
    cnpj: string;
    address: string;
  };
}

export const DocumentHeader = ({ title, documentNumber, date, subtitle, companyInfo, responsible, onResponsibleChange }: DocumentHeaderProps) => {
  const { companySettings } = useStore();
  
  const displayCnpj = companyInfo?.cnpj || companySettings?.cnpj || "44.740.821/0001-30";
  const displayCompanyName = companyInfo?.name || companySettings?.name || "TECH4RENT";

  return (
    <div className="flex flex-col gap-4">
      {/* Cabeçalho superior: Logo e Nome/CNPJ da Empresa */}
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3">
          <CompanyLogo isDark={false} className="h-10 w-auto" />
          <div className="flex flex-col">
            <span className="text-xl font-bold tracking-tight text-[#1a1a1a] uppercase">{displayCompanyName}</span>
            <span className="text-[10px] text-[#666666] font-medium uppercase">CNPJ: {displayCnpj}</span>
            <span className="text-[10px] text-[#666666] font-medium uppercase">TEL: {companySettings?.phone || "(19) 97107-6928"}</span>
          </div>
        </div>

        <div className="flex flex-col items-end text-right">
          <span className="text-xs text-[#666666] uppercase font-bold">Responsável pelo Orçamento</span>
          {onResponsibleChange ? (
            <input 
              type="text"
              value={responsible || ""}
              onChange={(e) => onResponsibleChange(e.target.value)}
              placeholder="Digite o nome..."
              className="border-b border-[#e5e5e5] w-48 mt-1 text-xs text-right bg-transparent focus:outline-none focus:border-[#1a1a1a] print:placeholder:text-transparent"
            />
          ) : (
            <div className="border-b border-[#e5e5e5] w-48 mt-4 text-xs font-bold text-[#1a1a1a]">
              {responsible}
            </div>
          )}
        </div>
      </div>
      
      {/* Título do documento centralizado abaixo do cabeçalho */}
      <div className="flex flex-col items-center mt-2 mb-1">
        <h2 className="text-xl font-bold text-[#1a1a1a] uppercase">{title} - {documentNumber}</h2>
        <p className="text-[11px] text-[#666666] mt-0.5">{subtitle || `Data: ${date}`}</p>
      </div>

      {/* Linha divisória discreta */}
      <div className="border-b border-[#e5e5e5] w-full mb-2"></div>
      
      {/* Informação opcional (usada em orçamentos, mas evitada em contratos para evitar duplicidade) */}
      {companyInfo && (
        <div className="flex flex-col gap-1 text-sm text-[#333333] mb-4">
          <span className="font-bold text-[#1a1a1a] uppercase">{companyInfo.name}</span>
          <span>CNPJ: {companyInfo.cnpj}</span>
          <span>{companyInfo.address}</span>
        </div>
      )}
    </div>
  );
};

interface DocumentSectionProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export const DocumentSection = ({ title, children, className }: DocumentSectionProps) => {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <h3 className="text-sm font-bold uppercase tracking-wider text-[#1a1a1a] border-b border-[#e5e5e5] pb-0.5">
        {title}
      </h3>
      <div className="px-1 text-sm text-[#333333]">
        {children}
      </div>
    </div>
  );
};

interface DocumentTableProps {
  headers: string[];
  rows: React.ReactNode[][];
  alignments?: ("left" | "center" | "right")[];
}

export const DocumentTable = ({ headers, rows, alignments = [] }: DocumentTableProps) => {
  return (
    <div className="w-full mt-2">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-[#1a1a1a]">
            {headers.map((header, i) => (
              <th 
                key={i} 
                className={cn(
                  "py-2 text-xs font-bold text-[#1a1a1a] uppercase tracking-wider",
                  alignments[i] === "center" ? "text-center" : alignments[i] === "right" ? "text-right" : "text-left"
                )}
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-[#e5e5e5] last:border-b-[#1a1a1a] print:break-inside-avoid">
              {row.map((cell, j) => (
                <td 
                  key={j} 
                  className={cn(
                    "py-2 text-sm text-[#1a1a1a]",
                    alignments[j] === "center" ? "text-center" : alignments[j] === "right" ? "text-right" : "text-left"
                  )}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

interface DocumentSummaryProps {
  items: { label: string; value: string; isTotal?: boolean }[];
}

export const DocumentSummary = ({ items }: DocumentSummaryProps) => {
  return (
    <div className="flex flex-col items-end gap-1 mt-2 print:mt-1 ml-auto w-full max-w-xs">
      {items.map((item, i) => (
        <div 
          key={i} 
          className={cn(
            "flex justify-between w-full py-1",
            item.isTotal && "border-t border-[#1a1a1a] mt-2 pt-2"
          )}
        >
          <span className={cn("text-sm font-bold", item.isTotal ? "text-[#1a1a1a]" : "text-[#666666]")}>
            {item.label}
          </span>
          <span className={cn("text-sm font-bold text-[#1a1a1a]", item.isTotal && "text-base")}>
            {item.value}
          </span>
        </div>
      ))}
    </div>
  );
};

export const SignatureBlock = ({ clientName }: { clientName?: string }) => {
  const { companySettings } = useStore();
  const displayCompanyName = companySettings?.name || "TECH4RENT";

  return (
    <div className="grid grid-cols-2 gap-16 mt-12 print:mt-6 print:break-inside-avoid">
      <div className="flex flex-col items-center gap-2">
        <div className="w-full border-b border-[#1a1a1a]"></div>
        <span className="text-[10px] font-bold uppercase text-[#1a1a1a]">{displayCompanyName}</span>
        <span className="text-[10px] text-[#666666]">(Assinatura do Locador/Entregador)</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <div className="w-full border-b border-[#1a1a1a]"></div>
        <span className="text-[10px] font-bold uppercase text-[#1a1a1a] text-center">
          {clientName || "NOME DO CLIENTE / EMPRESA"}
        </span>
        <span className="text-[10px] text-[#666666]">(Assinatura do Locatário/Recebedor)</span>
      </div>
    </div>
  );
};

export const DocumentFooter = ({ text }: { text?: string }) => {
  return (
    <div className="mt-auto pt-6 text-[10px] text-[#999999] leading-relaxed text-center print:hidden">
      {text || "Este orçamento é válido por 15 dias. Os valores podem ser alterados sem aviso prévio após este período."}
    </div>
  );
};