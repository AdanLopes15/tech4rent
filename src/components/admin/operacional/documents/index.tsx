
import React from "react";
import { cn } from "@/lib/utils";

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
        "font-sans leading-relaxed",
        className
      )}
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
    <div className="flex justify-between items-start border-b-2 border-primary/20 pb-6 mb-2">
      <div className="flex flex-col">
        <h1 className="text-3xl font-black tracking-tighter text-primary italic">
          TECH4<span className="text-zinc-800">RENT</span>
        </h1>
        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mt-1">
          Locação de Equipamentos de TI
        </p>
      </div>
      <div className="text-right flex flex-col gap-1">
        <h2 className="text-xl font-bold text-zinc-800 uppercase tracking-tight">{title}</h2>
        <div className="flex flex-col text-sm text-zinc-600">
          <span><span className="font-semibold text-zinc-800 uppercase text-[10px]">Nº Documento:</span> {documentNumber}</span>
          <span><span className="font-semibold text-zinc-800 uppercase text-[10px]">Data de Emissão:</span> {date}</span>
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
      <h3 className="text-xs font-bold uppercase tracking-widest text-primary/80 border-l-4 border-primary pl-3 py-0.5 bg-primary/5">
        {title}
      </h3>
      <div className={cn(
        "grid gap-4 p-4 rounded-lg bg-zinc-50/50 border border-zinc-100",
        columns === 2 ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"
      )}>
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
    <div className="border border-zinc-200 rounded-lg overflow-hidden mt-2 shadow-sm">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-zinc-100/80 border-b border-zinc-200">
            {headers.map((header, i) => (
              <th 
                key={i} 
                className={cn(
                  "px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-zinc-600",
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
            <tr key={i} className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50/50 transition-colors">
              {row.map((cell, j) => (
                <td 
                  key={j} 
                  className={cn(
                    "px-4 py-3 text-xs text-zinc-800",
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
    <div className="flex flex-col items-end gap-2 mt-4 ml-auto w-full max-w-xs">
      {items.map((item, i) => (
        <div 
          key={i} 
          className={cn(
            "flex justify-between w-full px-4 py-2",
            item.isTotal 
              ? "bg-primary text-white rounded-lg shadow-md mt-2 py-3" 
              : "text-zinc-600 border-b border-zinc-100"
          )}
        >
          <span className={cn("text-xs font-semibold uppercase tracking-wider", item.isTotal && "text-white/90")}>
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
        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 uppercase">A CONTRATAR</span>
        <span className="text-[9px] text-zinc-400">CONTRATANTE</span>
      </div>
    </div>
  );
};

export const DocumentFooter = () => {
  return (
    <div className="mt-auto pt-8 border-t border-zinc-100 flex justify-between items-center text-[9px] text-zinc-400 uppercase tracking-widest">
      <div>TECH4RENT - LOCAÇÃO DE EQUIPAMENTOS DE TI</div>
      <div className="flex gap-4">
        <span>WWW.TECH4RENT.COM.BR</span>
        <span>PAGINA 1 / 1</span>
      </div>
    </div>
  );
};
