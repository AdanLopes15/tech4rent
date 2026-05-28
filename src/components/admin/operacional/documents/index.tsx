import React from "react";
import { cn } from "@/lib/utils";
import { CompanyLogo } from "../../CompanyLogo";
import { useStore } from "@/store";

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
        "bg-white text-[#1a1a1a] p-10 mx-auto shadow-sm print:shadow-none print:p-0",
        "w-full max-w-[210mm] min-h-[297mm] flex flex-col gap-6",
        "font-sans leading-normal print:leading-normal",
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
  companyInfo?: {
    name: string;
    cnpj: string;
    address: string;
  };
}

export const DocumentHeader = ({ title, documentNumber, date, subtitle, companyInfo }: DocumentHeaderProps) => {
  const { companySettings } = useStore();
  
  const displayCnpj = companyInfo?.cnpj || companySettings?.cnpj || "44.740.821/0001-30";
  const displayCompanyName = companyInfo?.name || companySettings?.name || "TECH4RENT";

  return (
    <div className="flex flex-col gap-4">
      {/* Cabeçalho superior: Logo e Nome/CNPJ da Empresa */}
      <div className="flex items-center gap-3">
        <CompanyLogo isDark={false} className="h-10 w-auto" />
        <div className="flex flex-col">
          <span className="text-xl font-bold tracking-tight text-[#1a1a1a] uppercase">{displayCompanyName}</span>
          <span className="text-[10px] text-[#666666] font-medium uppercase">CNPJ: {displayCnpj}</span>
        </div>
      </div>
      
      {/* Título do documento centralizado abaixo do cabeçalho */}
      <div className="flex flex-col items-center mt-6 mb-2">
        <h2 className="text-2xl font-bold text-[#1a1a1a] uppercase">{title} - {documentNumber}</h2>
        <p className="text-[11px] text-[#666666] mt-1">{subtitle || `Data: ${date}`}</p>
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
    <div className={cn("flex flex-col gap-3", className)}>
      <h3 className="text-sm font-bold uppercase tracking-wider text-[#1a1a1a] border-b border-[#e5e5e5] pb-1">
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
                    "py-3 text-sm text-[#1a1a1a]",
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
    <div className="flex flex-col items-end gap-1 mt-4 ml-auto w-full max-w-xs">
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
    <div className="grid grid-cols-2 gap-16 mt-20 print:break-inside-avoid">
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