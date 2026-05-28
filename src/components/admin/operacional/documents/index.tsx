
import React from "react";
import { cn } from "@/lib/utils";

// Definindo as cores da marca para uso direto (garante fidelidade em qualquer ambiente)
const BRAND_COLORS = {
  blue: "#1E88E5",
  green: "#43B02A",
  orange: "#FF9A00",
  text: "#0D1B2A",
  gray: "#F5F7FA"
};

interface DocumentContainerProps {
  children: React.ReactNode;
  className?: string;
}

export const DocumentContainer = ({ children, className }: DocumentContainerProps) => {
  return (
    <div 
      className={cn(
        "bg-white text-zinc-900 p-8 mx-auto shadow-sm print:shadow-none print:p-0",
        "w-full max-w-[210mm] min-h-[297mm] flex flex-col gap-6",
        "font-sans leading-normal print:leading-normal", // Garante line-height consistente
        className
      )}
      style={{
        boxSizing: 'border-box',
        color: BRAND_COLORS.text
      }}
    >
      {children}
    </div>
  );
};

interface DocumentHeaderProps {
  title: string;
  documentNumber: string;
  date: string;
  type?: "orcamento" | "contrato";
}

export const DocumentHeader = ({ title, documentNumber, date, type = "orcamento" }: DocumentHeaderProps) => {
  return (
    <div 
      className="flex justify-between items-start border-b-2 pb-6 mb-2"
      style={{ borderBottomColor: `${BRAND_COLORS.blue}33` }} // 20% opacity of primary blue
    >
      <div className="flex flex-col">
        <img 
          src="/logo-tech4rent.png" 
          alt="Tech4Rent" 
          className="h-12 w-auto object-contain mb-1"
          style={{ maxWidth: '200px' }}
        />
        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">
          Locação de Equipamentos de TI
        </p>
      </div>
      <div className="text-right flex flex-col gap-1">
        <h2 className="text-xl font-bold uppercase tracking-tight" style={{ color: BRAND_COLORS.text }}>{title}</h2>
        <div className="flex flex-col text-[11px] text-zinc-600">
          <span>
            <span className="font-bold uppercase text-[9px]" style={{ color: BRAND_COLORS.blue }}>Nº Documento:</span> {documentNumber}
          </span>
          <span>
            <span className="font-bold uppercase text-[9px]" style={{ color: BRAND_COLORS.blue }}>Data de Emissão:</span> {date}
          </span>
        </div>
      </div>
    </div>
  );
};

interface DocumentSectionProps {
  title: string;
  children: React.ReactNode;
  className?: string;
  columns?: 1 | 2;
}

export const DocumentSection = ({ title, children, className, columns = 1 }: DocumentSectionProps) => {
  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <h3 
        className="text-[10px] font-bold uppercase tracking-widest border-l-4 pl-3 py-1"
        style={{ 
          color: BRAND_COLORS.blue, 
          borderLeftColor: BRAND_COLORS.orange,
          backgroundColor: `${BRAND_COLORS.blue}08` // 5% opacity
        }}
      >
        {title}
      </h3>
      <div className={cn(
        "grid gap-4 p-4 rounded-lg border",
        columns === 2 ? "grid-cols-2" : "grid-cols-1" // Forçamos 2 colunas no print também
      )}
      style={{ 
        backgroundColor: BRAND_COLORS.gray,
        borderColor: '#e5e7eb'
      }}>
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
    <div className="border border-zinc-200 rounded-lg overflow-hidden mt-2">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-zinc-100/80 border-b border-zinc-200">
            {headers.map((header, i) => (
              <th 
                key={i} 
                className={cn(
                  "px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-zinc-600 whitespace-nowrap",
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
            <tr key={i} className="border-b border-zinc-100 last:border-0">
              {row.map((cell, j) => (
                <td 
                  key={j} 
                  className={cn(
                    "px-4 py-3 text-[11px] text-zinc-800",
                    alignments[j] === "center" ? "text-center" : alignments[j] === "right" ? "text-right" : "text-left"
                  )}
                  style={{ lineHeight: '1.4' }}
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
    <div className="flex flex-col items-end gap-2 mt-4 ml-auto w-full max-w-xs">
      {items.map((item, i) => (
        <div 
          key={i} 
          className={cn(
            "flex justify-between w-full px-4 py-2",
            item.isTotal 
              ? "rounded-lg mt-2 py-3 shadow-sm" 
              : "text-zinc-600 border-b border-zinc-100"
          )}
          style={item.isTotal ? { 
            backgroundColor: BRAND_COLORS.blue,
            color: '#ffffff'
          } : {}}
        >
          <span className={cn("text-[10px] font-bold uppercase tracking-wider", item.isTotal ? "text-white" : "text-zinc-500")}>
            {item.label}
          </span>
          <span className={cn("font-bold", item.isTotal ? "text-lg" : "text-zinc-800")}>
            {item.value}
          </span>
        </div>
      ))}
    </div>
  );
};

export const SignatureBlock = () => {
  return (
    <div className="grid grid-cols-2 gap-12 mt-16 pt-8 border-t border-zinc-100">
      <div className="flex flex-col items-center gap-2">
        <div className="w-full border-b border-zinc-400 h-10"></div>
        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">TECH4RENT LTDA</span>
        <span className="text-[9px] text-zinc-400">CONTRATADA</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <div className="w-full border-b border-zinc-400 h-10"></div>
        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">CONTRATANTE</span>
        <span className="text-[9px] text-zinc-400">CLIENTE</span>
      </div>
    </div>
  );
};

export const DocumentFooter = () => {
  return (
    <div className="mt-auto pt-8 border-t border-zinc-100 flex justify-between items-center text-[9px] text-zinc-400 uppercase tracking-widest">
      <div className="font-bold" style={{ color: BRAND_COLORS.blue }}>TECH4RENT - LOCAÇÃO DE EQUIPAMENTOS DE TI</div>
      <div className="flex gap-4">
        <span>WWW.TECH4RENT.COM.BR</span>
        <span>PÁGINA 1 / 1</span>
      </div>
    </div>
  );
};

