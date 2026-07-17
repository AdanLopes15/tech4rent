//src/pages/admin/Orcamentos.tsx

import { useMemo, useState, useEffect, useCallback, useRef } from "react";
import { format } from "date-fns";
import { useStore } from "@/store";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, cn, formatAddress } from "@/lib/utils";
import { formatPhoneBR } from "@/lib/contact";
import { generateQuotePDF } from "@/lib/pdf-utils";
import html2pdf from "html2pdf.js";
import { 
  DocumentContainer, 
  DocumentHeader, 
  DocumentSection, 
  DocumentTable, 
  DocumentSummary, 
  SignatureBlock, 
  DocumentFooter,
  DocumentItemRow
} from "@/components/admin/operacional/documents";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

import {
  PlusCircle,
  MoreHorizontal,
  Pencil,
  Trash2,
  Eye,
  FileCheck,
  ShoppingCart,
  RefreshCw,
  ChevronUp,
  CalendarIcon,
  FileDown,
  Copy,
} from "lucide-react";

import { AddQuoteDialog } from "@/components/orcamentos/AddQuoteDialog";

const statusColors: Record<string, string> = {
  Pendente: "bg-amber-400 hover:bg-amber-500 text-white",
  Aprovado: "bg-green-600 hover:bg-green-700 text-white",
  Reprovado: "bg-red-600 hover:bg-red-700 text-white",
  Recusado: "bg-red-600 hover:bg-red-700 text-white",
  Cancelado: "bg-muted text-muted-foreground",
};

export default function Orcamentos() {
  const { quotes, equipments, clients, loading, fetchAllData, deleteQuote, updateQuote, convertQuoteToContract, addSale, companySettings } = useStore();
  const { can } = useAuth();

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const { toast } = useToast();
  const quoteDownloadRef = useRef<HTMLDivElement>(null);
  const contractPrintRef = useRef<HTMLDivElement>(null);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingQuote, setEditingQuote] = useState<any>(null);
  const [viewingQuote, setViewingQuote] = useState<any>(null);
  const [quoteResponsible, setQuoteResponsible] = useState("");
  const [quoteForDownload, setQuoteForDownload] = useState<any>(null);
  const [quoteForApproval, setQuoteForApproval] = useState<any>(null);
  const [isContractGenerated, setIsContractGenerated] = useState(false);

  useEffect(() => {
    const active = viewingQuote || quoteForDownload || quoteForApproval;
    if (active) setQuoteResponsible(active.quoteResponsible || "");
  }, [viewingQuote, quoteForDownload, quoteForApproval]);



  const [clientFilter, setClientFilter] = useState("todos");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});

  const [locacaoOpen, setLocacaoOpen] = useState(true);
  const [vendaOpen, setVendaOpen] = useState(true);
  const blobToDataUrl = (blob: Blob) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

  // fetch com timeout via AbortController para nunca travar o fluxo
  const fetchWithTimeout = async (url: string, ms = 5000): Promise<Response> => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), ms);
    try {
      return await fetch(url, { mode: "cors", signal: controller.signal });
    } finally {
      clearTimeout(timer);
    }
  };

  // Tenta converter para base64; retorna null em qualquer falha (nunca lança/trava)
  const fetchAsDataUrl = async (src: string): Promise<string | null> => {
    // 1ª tentativa: download direto (servidor com headers de CORS)
    try {
      const res = await fetchWithTimeout(src, 5000);
      if (res.ok) {
        const blob = await res.blob();
        if (blob.size > 0) return await blobToDataUrl(blob);
      }
    } catch (e) {
      console.warn("Falha no download direto da imagem, tentando proxy:", src);
    }

    // 2ª tentativa: proxy com CORS habilitado (imagens externas sem CORS)
    try {
      const proxied = `https://images.weserv.nl/?url=${encodeURIComponent(
        src.replace(/^https?:\/\//, ""),
      )}`;
      const res = await fetchWithTimeout(proxied, 5000);
      if (res.ok) {
        const blob = await res.blob();
        if (blob.size > 0) return await blobToDataUrl(blob);
      }
    } catch (e) {
      console.warn("Falha ao converter imagem via proxy:", src);
    }

    return null;
  };

  const inlineImagesAsBase64 = async (root: HTMLElement) => {
    const imgs = Array.from(root.querySelectorAll("img"));
    await Promise.all(
      imgs.map(async (img) => {
        const src = img.getAttribute("src");
        if (!src || src.startsWith("data:")) return;
        try {
          const dataUrl = await fetchAsDataUrl(src);
          if (dataUrl && dataUrl.startsWith("data:")) {
            img.setAttribute("src", dataUrl);
            img.removeAttribute("crossorigin");
          }
          // Se falhar, mantém a URL original (html2canvas tenta via useCORS)
        } catch (e) {
          console.warn("Não foi possível converter imagem para base64:", src, e);
        }
      }),
    );
  };

  // Aguarda imagens carregarem, com timeout por imagem para não travar
  const waitForImages = async (root: HTMLElement, ms = 5000) => {
    const imgs = Array.from(root.querySelectorAll("img"));
    await Promise.all(
      imgs.map(
        (img) =>
          new Promise<void>((resolve) => {
            if (img.complete) return resolve();
            const done = () => resolve();
            const timer = setTimeout(done, ms);
            img.onload = () => {
              clearTimeout(timer);
              done();
            };
            img.onerror = () => {
              clearTimeout(timer);
              done();
            };
          }),
      ),
    );
  };


  const handleDownloadPDFAsFile = async (ref: React.RefObject<HTMLDivElement>, filename: string) => {
    if (!ref.current) return;

    const element = ref.current;
    const docRoot = element.querySelector<HTMLElement>(".document-print-root") || element;

    // Remove temporariamente a altura mínima de 1 página A4 para evitar página em branco extra
    const prevMinHeight = docRoot.style.minHeight;
    const prevHeight = docRoot.style.height;
    docRoot.style.minHeight = "auto";
    docRoot.style.height = "auto";

    const opt = {
      margin: 8,
      filename: `${filename}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { 
        scale: 2, 
        useCORS: true, 
        letterRendering: true,
        backgroundColor: '#ffffff',
        scrollX: 0,
        scrollY: 0,
        windowWidth: docRoot.scrollWidth || 794
      },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] as any },
      jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const }
    };


    try {
      toast({ title: "Gerando PDF...", description: "Por favor, aguarde um momento." });
      // Prepara imagens com proteção global de tempo: nunca trava a geração do PDF
      const prepareImages = (async () => {
        await inlineImagesAsBase64(docRoot);
        await waitForImages(docRoot);
      })();
      const globalGuard = new Promise<void>((resolve) => setTimeout(resolve, 12000));
      await Promise.race([prepareImages, globalGuard]);
      // Gera e baixa o PDF mesmo que alguma imagem não tenha sido preparada a tempo
      await html2pdf().set(opt).from(docRoot).save();
      toast({ title: "PDF gerado com sucesso!" });
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      toast({ 
        title: "Erro ao gerar PDF", 
        description: "Houve um problema ao gerar o arquivo. Tente usar a opção de imprimir.",
        variant: "destructive" 
      });
    } finally {
      docRoot.style.minHeight = prevMinHeight;
      docRoot.style.height = prevHeight;
    }
  };

  const handlePrintDocument = async (ref: React.RefObject<HTMLDivElement>) => {
    if (!ref.current) return;

    const docRoot = ref.current.querySelector<HTMLElement>(".document-print-root") || ref.current;

    try {
      const prepare = (async () => {
        await inlineImagesAsBase64(docRoot);
        await waitForImages(docRoot);
      })();
      const guard = new Promise<void>((resolve) => setTimeout(resolve, 12000));
      await Promise.race([prepare, guard]);
    } catch (e) {
      console.warn("Falha ao preparar imagens para impressão:", e);
    }

    const content = ref.current.innerHTML;
    const printWindow = window.open("", "_blank");

    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Tech4Rent - Documento</title>
            <script src="https://cdn.tailwindcss.com"></script>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
            <style>
              body { 
                font-family: 'Inter', sans-serif;
                margin: 0;
                padding: 0;
                background-color: white !important;
                color: #1a1a1a !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }

              
              @page {
                size: A4;
                margin: 8mm;
              }

              @media print {
                .no-print { display: none !important; }
                body { margin: 0; }
                /* Garante que cores de fundo e bordas apareçam */
                * {
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                }
                /* Impede que o container force a altura total de uma página A4,
                   evitando a geração de uma segunda página em branco */
                .print-container > div,
                .document-print-root {
                  min-height: 0 !important;
                  height: auto !important;
                }
              }

              /* Ajustes para evitar cortes de letras */
              * {
                box-sizing: border-box;
                overflow: visible !important;
              }
              
              table {
                width: 100% !important;
                border-collapse: collapse !important;
              }
              
              img {
                max-width: 100%;
              }
            </style>
          </head>
          <body>
            <div class="print-container">
              ${content}
            </div>
            <script>
              window.onload = function() {
                // Pequeno delay para garantir que imagens e fontes carreguem
                setTimeout(() => {
                  window.print();
                  window.onafterprint = function() { window.close(); };
                }, 800);
              };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    } else {
      toast({
        title: "Pop-up bloqueado",
        description: "Por favor, permita pop-ups para este site para poder imprimir.",
        variant: "destructive",
      });
    }
  };



  const normalizeStatus = (status?: string) => {
    if (!status) return "Pendente";
    if (status === "Recusado") return "Reprovado";
    return status;
  };

  const formatDate = (date: any) => {
    if (!date) return "—";

    try {
      const parsed = typeof date?.toDate === "function" ? date.toDate() : new Date(date);

      if (isNaN(parsed.getTime())) return "—";

      return format(parsed, "dd/MM/yyyy");
    } catch {
      return "—";
    }
  };

  // Resolve a melhor fonte de data do orçamento, cobrindo registros antigos
  // que podem ter salvo a data em campos diferentes.
  const getQuoteDate = (quote: any) =>
    quote?.createdAt ??
    quote?.created_at ??
    quote?.dataOrcamento ??
    quote?.quoteDate ??
    quote?.createdDate ??
    quote?.data ??
    quote?.date ??
    quote?.saleDate ??
    null;

  const formatQuoteDate = (quote: any) => formatDate(getQuoteDate(quote));



  const getClientName = (clientId: string, fallbackName?: string) => {
    const client = clients.find((c: any) => c.id === clientId);
    return client?.razaoSocial || client?.name || fallbackName || "N/A";
  };

  const filteredQuotes = useMemo(() => {
    if (!quotes || !Array.isArray(quotes)) return [];

    return quotes.filter((quote: any) => {
      // 1. Status Filter
      const normalizedQuoteStatus = normalizeStatus(quote.status);
      const matchesStatus = statusFilter === "todos" || normalizedQuoteStatus === statusFilter;
      if (!matchesStatus) return false;

      // 2. Client Filter
      const matchesClient = clientFilter === "todos" || quote.clientId === clientFilter;
      if (!matchesClient) return false;

      // 3. Date Filter
      if (dateRange?.from || dateRange?.to) {
        const quoteDate = quote.createdAt
          ? typeof quote.createdAt?.toDate === "function"
            ? quote.createdAt.toDate()
            : new Date(quote.createdAt)
          : null;

        if (quoteDate && !isNaN(quoteDate.getTime())) {
          if (dateRange.from && quoteDate < dateRange.from) return false;
          if (dateRange.to) {
            const endOfDay = new Date(dateRange.to);
            endOfDay.setHours(23, 59, 59, 999);
            if (quoteDate > endOfDay) return false;
          }
        } else {
          // If a date filter is applied but the quote has no valid date, hide it
          return false;
        }
      }

      return true;
    });
  }, [quotes, clientFilter, statusFilter, dateRange]);

  const locacaoQuotes = useMemo(() => 
    filteredQuotes.filter((quote: any) => quote.budgetType === "locacao"),
    [filteredQuotes]
  );

  const vendaQuotes = useMemo(() => 
    filteredQuotes.filter((quote: any) => quote.budgetType === "venda"),
    [filteredQuotes]
  );

  const handleAddNew = () => {
    setEditingQuote(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (quote: any) => {
    setEditingQuote(quote);
    setIsDialogOpen(true);
  };

  const handleDuplicate = (quote: any) => {
    // Clone but remove IDs and reset status
    const { id, ...rest } = quote;
    const duplicatedQuote = {
      ...rest,
      status: "Pendente",
      createdAt: new Date(),
      // We keep items, client, etc.
    };
    
    // Pass as editing but we'll change AddQuoteDialog to handle objects without ID as "New"
    setEditingQuote(duplicatedQuote);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = (open: boolean) => {
    if (!open) {
      setEditingQuote(null);
    }
    setIsDialogOpen(open);
  };

  const handleView = (quote: any) => {
    setViewingQuote(quote);
  };

  const handleDelete = async (quoteId: string) => {
    try {
      await deleteQuote(quoteId);
      toast({ title: "Orçamento excluído com sucesso!" });
    } catch (error: any) {
      toast({
        title: "Erro ao excluir orçamento",
        description: error?.message || "Não foi possível excluir.",
        variant: "destructive",
      });
    }
  };

  const handleChangeStatus = async (quoteId: string, newStatus: string) => {
    try {
      await updateQuote({ id: quoteId, status: newStatus });
      toast({ title: `Status alterado para ${newStatus}` });
    } catch (error: any) {
      toast({
        title: "Erro ao alterar status",
        description: error?.message || "Não foi possível alterar o status.",
        variant: "destructive",
      });
    }
  };

  const handleConvertToContract = (quote: any) => {
    setIsContractGenerated(false);
    setQuoteForApproval(quote);
  };

  const confirmConvertToContract = async (quoteId: string) => {
    try {
      await convertQuoteToContract(quoteId);
      setIsContractGenerated(true);
      toast({ title: "Contrato gerado com sucesso!" });
    } catch (error: any) {
      toast({
        title: "Erro ao gerar contrato",
        description: error?.message || "Não foi possível converter o orçamento.",
        variant: "destructive",
      });
    }
  };

  const handleConvertToSale = async (quote: any) => {
    try {
      const saleData = {
        clientId: quote.clientId,
        clientName: quote.clientName || getClientName(quote.clientId),
        items: quote.items || [],
        paymentMethods: quote.paymentMethods || [],
        quoteId: quote.id,
        costCenterId: quote.costCenterId || "",
        chartOfAccountId: quote.chartOfAccountId || "",
        bankAccountId: quote.bankAccountId || "",
        totalValue: quote.totalValue || 0,
        saleDate: quote.saleDate || new Date().toISOString(),
      };

      await addSale(saleData);
      await updateQuote({ id: quote.id, status: "Aprovado" });

      toast({ title: "Venda criada a partir do orçamento!" });
    } catch (error: any) {
      toast({
        title: "Erro ao criar venda",
        description: error?.message || "Não foi possível criar a venda.",
        variant: "destructive",
      });
    }
  };

  const handleDownloadPDF = (quote: any) => {
    setQuoteForDownload(quote);
    setTimeout(() => {
      handleDownloadPDFAsFile(quoteDownloadRef, `Orcamento_${quote.id}`);
    }, 500);
  };

  const renderQuoteTable = (quotesList: any[], type: "locacao" | "venda") => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="text-primary">Orçamento</TableHead>
          <TableHead className="text-primary">Cliente</TableHead>
          <TableHead className="text-primary">Data</TableHead>
          <TableHead className="text-primary">{type === "locacao" ? "Valor Total Mensal" : "Valor Total"}</TableHead>
          <TableHead className="text-primary">Status</TableHead>
          <TableHead className="text-right text-primary">Ações</TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        {loading ? (
          <TableRow>
            <TableCell colSpan={6} className="text-center py-10">
              <RefreshCw className="h-6 w-6 animate-spin mx-auto text-primary mb-2" />
              <p className="text-sm text-muted-foreground">Carregando orçamentos...</p>
            </TableCell>
          </TableRow>
        ) : quotesList.length > 0 ? (
          quotesList.map((quote: any) => {
            const displayStatus = normalizeStatus(quote.status);

            return (
              <TableRow key={quote.id}>
                <TableCell className="font-medium">{quote.id}</TableCell>
                <TableCell>{getClientName(quote.clientId, quote.clientName)}</TableCell>
                <TableCell>{formatQuoteDate(quote)}</TableCell>
                <TableCell>{formatCurrency(Number(quote.totalValue || 0))}</TableCell>
                <TableCell>
                  <Badge className={statusColors[displayStatus] || "bg-muted"}>{displayStatus}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleView(quote)}>
                        <Eye className="mr-2 h-4 w-4" />
                        Ver Detalhes
                      </DropdownMenuItem>

                      {can("orcamentos.edit") && (
                        <DropdownMenuItem onClick={() => handleEdit(quote)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                      )}

                      {can("orcamentos.duplicate") && (
                        <DropdownMenuItem onClick={() => handleDuplicate(quote)}>
                          <Copy className="mr-2 h-4 w-4" />
                          Duplicar
                        </DropdownMenuItem>
                      )}

                      {can("orcamentos.pdf") && (
                        <DropdownMenuItem onClick={() => handleDownloadPDF(quote)}>
                          <FileDown className="mr-2 h-4 w-4" />
                          Baixar PDF
                        </DropdownMenuItem>
                      )}

                      {can("orcamentos.convert") && type === "locacao" && displayStatus === "Pendente" && (
                        <DropdownMenuItem onClick={() => handleConvertToContract(quote)}>
                          <FileCheck className="mr-2 h-4 w-4" />
                          Aprovar e Gerar Contrato
                        </DropdownMenuItem>
                      )}

                      {can("orcamentos.convert") && type === "venda" && displayStatus === "Pendente" && (
                        <DropdownMenuItem onClick={() => handleConvertToSale(quote)}>
                          <ShoppingCart className="mr-2 h-4 w-4" />
                          Criar Venda a Partir do Orçamento
                        </DropdownMenuItem>
                      )}

                      {can("orcamentos.approve") && (
                        <DropdownMenuSub>
                          <DropdownMenuSubTrigger>
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Mudar Status
                          </DropdownMenuSubTrigger>

                          <DropdownMenuPortal>
                            <DropdownMenuSubContent>
                              {["Pendente", "Aprovado", "Reprovado", "Cancelado"].map((status) => (
                                <DropdownMenuItem key={status} onClick={() => handleChangeStatus(quote.id, status)}>
                                  {status}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuSubContent>
                          </DropdownMenuPortal>
                        </DropdownMenuSub>
                      )}

                      {can("orcamentos.delete") && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem className="text-destructive" onSelect={(e) => e.preventDefault()}>
                              <Trash2 className="mr-2 h-4 w-4" />
                              Excluir
                            </DropdownMenuItem>
                          </AlertDialogTrigger>

                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Essa ação não pode ser desfeita. Isso excluirá permanentemente o orçamento.
                              </AlertDialogDescription>
                            </AlertDialogHeader>

                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(quote.id)}>Continuar</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })
        ) : (
          <TableRow>
            <TableCell colSpan={6} className="text-center text-muted-foreground h-20">
              Nenhum orçamento encontrado.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Filtros de Orçamentos</CardTitle>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Período de Criação</label>

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dateRange.from && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange.from
                      ? dateRange.to
                        ? `${format(dateRange.from, "dd/MM/yyyy")} - ${format(dateRange.to, "dd/MM/yyyy")}`
                        : format(dateRange.from, "dd/MM/yyyy")
                      : "Selecione"}
                  </Button>
                </PopoverTrigger>

                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="range"
                    selected={dateRange.from ? { from: dateRange.from, to: dateRange.to } : undefined}
                    onSelect={(range) =>
                      setDateRange({
                        from: range?.from,
                        to: range?.to,
                      })
                    }
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Cliente</label>

              <Select value={clientFilter} onValueChange={setClientFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os Clientes" />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="todos">Todos os Clientes</SelectItem>
                  {clients.map((client: any) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.razaoSocial || client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Status</label>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os Status" />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="todos">Todos os Status</SelectItem>
                  <SelectItem value="Pendente">Pendente</SelectItem>
                  <SelectItem value="Aprovado">Aprovado</SelectItem>
                  <SelectItem value="Reprovado">Reprovado</SelectItem>
                  <SelectItem value="Cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {can("orcamentos.create") && (
        <div className="flex justify-end">
          <Button variant="outline" onClick={handleAddNew}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Novo Orçamento Interno
          </Button>
        </div>
      )}

      <Collapsible open={locacaoOpen} onOpenChange={setLocacaoOpen}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">Orçamentos de Locação</CardTitle>
              <ChevronUp className={cn("h-5 w-5 transition-transform", !locacaoOpen && "rotate-180")} />
            </CardHeader>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <CardContent className="pt-0">{renderQuoteTable(locacaoQuotes, "locacao")}</CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      <Collapsible open={vendaOpen} onOpenChange={setVendaOpen}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">Orçamentos de Venda</CardTitle>
              <ChevronUp className={cn("h-5 w-5 transition-transform", !vendaOpen && "rotate-180")} />
            </CardHeader>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <CardContent className="pt-0">{renderQuoteTable(vendaQuotes, "venda")}</CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      <AddQuoteDialog
        open={isDialogOpen}
        onOpenChange={handleCloseDialog}
        quote={editingQuote}
        onCreated={(created) => setViewingQuote(created)}
      />

      {viewingQuote && (
        <AlertDialog open={!!viewingQuote} onOpenChange={() => setViewingQuote(null)}>
          <AlertDialogContent className="max-w-4xl p-0 overflow-hidden border-none">
            <AlertDialogHeader className="bg-[#333333] p-4">
              <AlertDialogTitle className="text-white">Visualizar Orçamento - {viewingQuote.id}</AlertDialogTitle>
              <AlertDialogDescription className="sr-only">Visualização detalhada do orçamento.</AlertDialogDescription>
            </AlertDialogHeader>

            <div className="max-h-[70vh] overflow-y-auto bg-[#333333] p-4 md:p-12">
              <DocumentContainer>
                <DocumentHeader 
                  title="ORÇAMENTO" 
                  documentNumber={viewingQuote.id} 
                  date={formatQuoteDate(viewingQuote)} 
                  responsible={quoteResponsible}
                  onResponsibleChange={setQuoteResponsible}
                />

                <DocumentSection title="CLIENTE">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-12">
                    <div className="flex flex-col">
                      <span className="text-xs text-[#666666] uppercase">Razão Social</span>
                      <span className="text-sm font-bold text-[#1a1a1a]">
                        {getClientName(viewingQuote.clientId, viewingQuote.clientName)}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs text-[#666666] uppercase">CNPJ/CPF</span>
                      <span className="text-sm font-bold text-[#1a1a1a]">
                        {clients.find((c: any) => c.id === viewingQuote.clientId)?.cnpj || 
                         clients.find((c: any) => c.id === viewingQuote.clientId)?.cpf || 
                         "—"}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs text-[#666666] uppercase">Pessoa de Contato</span>
                      <span className="text-sm font-bold text-[#1a1a1a]">
                        {clients.find((c: any) => c.id === viewingQuote.clientId)?.contato || 
                         clients.find((c: any) => c.id === viewingQuote.clientId)?.contactPerson || 
                         "—"}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs text-[#666666] uppercase">Telefone / WhatsApp</span>
                      <span className="text-sm font-bold text-[#1a1a1a]">
                        {formatPhoneBR(clients.find((c: any) => c.id === viewingQuote.clientId)?.telefone || 
                         clients.find((c: any) => c.id === viewingQuote.clientId)?.phone || 
                         clients.find((c: any) => c.id === viewingQuote.clientId)?.whatsapp) || 
                         "—"}

                      </span>
                    </div>
                  </div>
                </DocumentSection>

                <DocumentSection title="ITENS DO ORÇAMENTO">
                  <DocumentTable 
                    headers={["Equipamento", "Qtd.", "Vl. Unit.", "Total"]}
                    alignments={["left", "center", "right", "right"]}
                    rows={(viewingQuote.items || []).map((item: any) => {
                      return [
                        <DocumentItemRow key={item.equipmentId} item={item} equipments={equipments} />,
                        item.quantity.toString(),
                        formatCurrency(Number(item.unitPrice || 0)),
                        <span key="total" className="font-bold">{formatCurrency(Number(item.quantity || 0) * Number(item.unitPrice || 0))}</span>
                      ];
                    })}
                  />
                  
                  <div className="flex justify-end mt-4">
                    <div className="flex flex-col items-end gap-1">
                      <div className="flex justify-between w-64">
                        <span className="text-sm font-bold text-[#666666]">
                          {viewingQuote.budgetType === "locacao" ? "Total Mensal do Orçamento" : "Total do Orçamento"}
                        </span>
                        <span className="text-base font-bold text-[#1a1a1a]">{formatCurrency(Number(viewingQuote.totalValue || 0))}</span>
                      </div>
                    </div>
                  </div>
                </DocumentSection>

                <DocumentSection title="TERMOS E CONDIÇÕES">
                  <div className="flex flex-col gap-2 print:gap-1">
                    <div>
                      <p className="font-bold text-[#1a1a1a] mb-1 text-sm">{viewingQuote.budgetType === "locacao" ? "Período de locação:" : "Prazo de entrega:"}</p>
                      <p className="text-sm text-[#333333]">
                        {viewingQuote.budgetType === "locacao" 
                          ? `${formatDate(viewingQuote.startDate)} a ${formatDate(viewingQuote.endDate)}.` 
                          : viewingQuote.prazoEntrega || "Prazo imediato."}
                      </p>

                    </div>
                    
                    <div>
                      <p className="font-bold text-[#1a1a1a] mb-1 text-sm">Informações Fiscais:</p>
                      <p className="text-sm text-[#333333]">
                        {viewingQuote.informacoesFiscais || viewingQuote.fiscalInfo || "Nenhuma informação fiscal fornecida."}
                      </p>
                    </div>

                    <div>
                      <p className="font-bold text-[#1a1a1a] mb-1 text-sm">Observações Gerais:</p>
                      <p className="text-sm text-[#333333]">
                        {viewingQuote.observations || "Nenhuma observação fornecida."}
                      </p>
                    </div>
                  </div>
                </DocumentSection>

                <DocumentFooter />
              </DocumentContainer>
            </div>

            <AlertDialogFooter className="bg-[#f5f5f5] p-4 flex flex-row gap-2 justify-end">
              <Button 
                variant="outline" 
                type="button" 
                onClick={() => {
                  setQuoteForDownload(viewingQuote);
                  setTimeout(() => {
                    handlePrintDocument(quoteDownloadRef);
                  }, 500);
                }}
              >
                Imprimir / Salvar PDF
              </Button>
              <AlertDialogCancel className="mt-0" onClick={() => setViewingQuote(null)}>Fechar</AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* Ref para download direto de PDF (off-screen, mas com tamanho real para o html2canvas) */}
      <div style={{ position: "fixed", left: "-10000px", top: 0, width: "800px", pointerEvents: "none", zIndex: -1 }} aria-hidden="true">
        <div ref={quoteDownloadRef}>
          {quoteForDownload && (
            <DocumentContainer>
              <DocumentHeader 
                title="ORÇAMENTO" 
                documentNumber={quoteForDownload.id} 
                date={formatQuoteDate(quoteForDownload)} 
                responsible={quoteResponsible}
              />

              <DocumentSection title="CLIENTE">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-12">
                  <div className="flex flex-col">
                    <span className="text-xs text-[#666666] uppercase">Razão Social</span>
                    <span className="text-sm font-bold text-[#1a1a1a]">
                      {getClientName(quoteForDownload.clientId, quoteForDownload.clientName)}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-[#666666] uppercase">CNPJ/CPF</span>
                    <span className="text-sm font-bold text-[#1a1a1a]">
                      {clients.find((c: any) => c.id === quoteForDownload.clientId)?.cnpj || 
                       clients.find((c: any) => c.id === quoteForDownload.clientId)?.cpf || 
                       "—"}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-[#666666] uppercase">Pessoa de Contato</span>
                    <span className="text-sm font-bold text-[#1a1a1a]">
                      {clients.find((c: any) => c.id === quoteForDownload.clientId)?.contato || 
                       clients.find((c: any) => c.id === quoteForDownload.clientId)?.contactPerson || 
                       "—"}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-[#666666] uppercase">Telefone / WhatsApp</span>
                    <span className="text-sm font-bold text-[#1a1a1a]">
                      {formatPhoneBR(clients.find((c: any) => c.id === quoteForDownload.clientId)?.telefone || 
                       clients.find((c: any) => c.id === quoteForDownload.clientId)?.phone || 
                       clients.find((c: any) => c.id === quoteForDownload.clientId)?.whatsapp) || 
                       "—"}

                    </span>
                  </div>
                </div>
              </DocumentSection>

              <DocumentSection title="ITENS DO ORÇAMENTO">
                <DocumentTable 
                  headers={["Equipamento", "Qtd.", "Vl. Unit.", "Total"]}
                  alignments={["left", "center", "right", "right"]}
                  rows={(quoteForDownload.items || []).map((item: any) => {
                    return [
                      <DocumentItemRow key={item.equipmentId} item={item} equipments={equipments} pdfMode />,
                      item.quantity.toString(),
                      formatCurrency(Number(item.unitPrice || 0)),
                      <span key="total" className="font-bold">{formatCurrency(Number(item.quantity || 0) * Number(item.unitPrice || 0))}</span>
                    ];
                  })}
                />
                
                <div className="flex justify-end mt-4">
                  <div className="flex flex-col items-end gap-1">
                    <div className="flex justify-between w-64">
                      <span className="text-sm font-bold text-[#666666]">
                        {quoteForDownload.budgetType === "locacao" ? "Total Mensal do Orçamento" : "Total do Orçamento"}
                      </span>
                      <span className="text-base font-bold text-[#1a1a1a]">{formatCurrency(Number(quoteForDownload.totalValue || 0))}</span>
                    </div>
                  </div>
                </div>
              </DocumentSection>

              <DocumentSection title="TERMOS E CONDIÇÕES">
                <div className="flex flex-col gap-2 print:gap-1">
                  <div>
                    <p className="font-bold text-[#1a1a1a] mb-1 text-sm">{quoteForDownload.budgetType === "locacao" ? "Período de locação:" : "Prazo de entrega:"}</p>
                    <p className="text-sm text-[#333333]">
                      {quoteForDownload.budgetType === "locacao" 
                        ? `${formatDate(quoteForDownload.startDate)} a ${formatDate(quoteForDownload.endDate)}.` 
                        : quoteForDownload.prazoEntrega || "Prazo imediato."}
                    </p>

                  </div>
                  
                  <div>
                    <p className="font-bold text-[#1a1a1a] mb-1 text-sm">Informações Fiscais:</p>
                    <p className="text-sm text-[#333333]">
                      {quoteForDownload.informacoesFiscais || quoteForDownload.fiscalInfo || "Nenhuma informação fiscal fornecida."}
                    </p>
                  </div>

                  <div>
                    <p className="font-bold text-[#1a1a1a] mb-1 text-sm">Observações Gerais:</p>
                    <p className="text-sm text-[#333333]">
                      {quoteForDownload.observations || "Nenhuma observação fornecida."}
                    </p>
                  </div>
                </div>
              </DocumentSection>

              <DocumentFooter />
            </DocumentContainer>
          )}
        </div>
      </div>

      {quoteForApproval && (
        <AlertDialog open={!!quoteForApproval} onOpenChange={(open) => {
          if (!open) {
            setQuoteForApproval(null);
            setIsContractGenerated(false);
          }
        }}>
          <AlertDialogContent className="max-w-4xl p-0 overflow-hidden border-none">
            <AlertDialogHeader className="bg-[#333333] p-4">
              <AlertDialogTitle className="text-white">Aprovação e Geração de Contrato - {quoteForApproval.id}</AlertDialogTitle>
              <AlertDialogDescription className="sr-only">
                Revise os termos do contrato abaixo antes de confirmar a aprovação.
              </AlertDialogDescription>
            </AlertDialogHeader>

            <div ref={contractPrintRef} className="max-h-[70vh] overflow-y-auto bg-[#333333] p-4 md:p-12">
              <DocumentContainer>
                <DocumentHeader 
                  title="Contrato de Locação" 
                  documentNumber={quoteForApproval.id.replace('ORC-', 'CTR-')} 
                  date={formatDate(new Date())}
                  subtitle={`Gerado em ${format(new Date(), "dd/MM/yyyy")} às ${format(new Date(), "HH:mm")}. Válido mediante assinatura.`}
                />

                <div className="space-y-8 mt-4">
                  <DocumentSection title="LOCADOR/VENDEDOR">
                    <div className="flex flex-col gap-1">
                      <span className="font-bold text-[#1a1a1a] uppercase">{companySettings?.name || "TECH4RENT"}</span>
                      <span>CNPJ: {companySettings?.cnpj || "44.740.821/0001-30"}</span>
                      <span>
                        {companySettings?.address 
                          ? `${companySettings.address.logradouro}, ${companySettings.address.numero}${companySettings.address.complemento ? ` - ${companySettings.address.complemento}` : ''} - ${companySettings.address.bairro}, ${companySettings.address.localidade} - ${companySettings.address.uf}`
                          : "Avenida 44 A, 499 - Vila Nova, Rio Claro - SP"}
                      </span>
                    </div>
                  </DocumentSection>

                  <DocumentSection title="LOCATÁRIO/COMPRADOR (CLIENTE)">
                    <div className="flex flex-col gap-1">
                      <span className="font-bold text-[#1a1a1a]">
                        {getClientName(quoteForApproval.clientId, quoteForApproval.clientName)}
                      </span>
                      {(() => {
                        const client = clients.find((c: any) => c.id === quoteForApproval.clientId);
                        return (
                          <>
                            <span>Documento: {client?.cnpj || client?.cpf || "—"}</span>
                            <span>{formatAddress(client?.address || client?.endereco)}</span>
                          </>
                        );
                      })()}
                    </div>
                  </DocumentSection>

                  <DocumentSection title="OBJETO DO DOCUMENTO">
                    <p className="mb-4 text-[#333333]">
                      O presente documento tem como objeto a locação do(s) seguinte(s) equipamento(s), totalizando {quoteForApproval.items?.reduce((acc: number, item: any) => acc + item.quantity, 0) || 0} itens:
                    </p>
                    <DocumentTable 
                      headers={["Equipamento", "Qtd.", "Vl. Unit. (Mês)", "Total"]}
                      alignments={["left", "center", "right", "right"]}
                      rows={(quoteForApproval.items || []).map((item: any) => {
                        return [
                          <DocumentItemRow key={item.equipmentId} item={item} equipments={equipments} />,
                          item.quantity.toString(),
                          formatCurrency(Number(item.unitPrice || 0)),
                          <span key="total" className="font-bold">{formatCurrency(Number(item.quantity || 0) * Number(item.unitPrice || 0))}</span>
                        ];
                      })}
                    />
                  </DocumentSection>

                  <DocumentSection title="PERÍODO">
                    <div className="flex flex-col gap-1">
                      <p><span className="font-bold">Retirada:</span> {formatDate(quoteForApproval.startDate)}</p>
                      <p><span className="font-bold">Devolução:</span> {formatDate(quoteForApproval.endDate)}</p>
                    </div>
                  </DocumentSection>

                  <DocumentSection title="VALOR E CONDIÇÕES">
                    <div className="flex flex-col gap-2">
                      <p>
                        O valor total mensal da locação é de <span className="font-bold">{formatCurrency(Number(quoteForApproval.totalValue || 0))}</span>, a ser pago em <span className="font-bold">{quoteForApproval.paymentMethods?.[0]?.installments || 1} parcela(s)</span> de <span className="font-bold">{formatCurrency(Number(quoteForApproval.totalValue || 0) / (quoteForApproval.paymentMethods?.[0]?.installments || 1))}</span>.
                      </p>
                      <div className="text-xs text-[#666666]">
                        <p>Primeiro vencimento em: {formatDate(quoteForApproval.startDate)}</p>
                        <p>Último vencimento em: {formatDate(quoteForApproval.endDate)}</p>
                      </div>
                    </div>
                  </DocumentSection>

                  <div className="print:break-before-page pt-8">
                    <h3 className="text-lg font-bold uppercase text-[#1a1a1a] border-b border-[#e5e5e5] pb-2 mb-6">
                      CLÁUSULAS CONTRATUAIS DE LOCAÇÃO
                    </h3>
                    
                    <div className="space-y-6 text-sm text-[#333333] leading-relaxed">
                      <div>
                        <p className="font-bold mb-2">1. CLÁUSULA PRIMEIRA – OBJETO DO CONTRATO</p>
                        <p className="text-justify">1.1. Parágrafo primeiro — A LOCADORA afirma que os equipamentos descritos estão em perfeitas condições de uso, sem apresentar defeitos aparentes ou ocultos que possam comprometer ou impedir sua utilização regular.</p>
                        <p className="text-justify mt-2">1.2. Parágrafo segundo — A partir do momento em que os equipamentos forem entregues, a LOCATÁRIA se compromete a cuidar e conservar adequadamente os bens sob sua responsabilidade. Caso haja danos decorrentes de uso inadequado, será de inteira responsabilidade da LOCATÁRIA indenizar a LOCADORA pelos prejuízos causados, conforme previsto na legislação vigente.</p>
                      </div>

                      <div>
                        <p className="font-bold mb-2">2. CLÁUSULA SEGUNDA – PRAZO DA LOCAÇÃO</p>
                        <p className="text-justify">2.1. A locação terá o prazo definido no campo "PERÍODO" deste documento. Ao término da locação, os bens deverão ser devolvidos nas mesmas condições em que foram entregues.</p>
                      </div>

                      <div>
                        <p className="font-bold mb-2">3. CLÁUSULA TERCEIRA – VALOR E FORMA DE PAGAMENTO</p>
                        <p className="text-justify">3.1. A LOCATÁRIA se compromete a pagar à LOCADORA o valor total estipulado neste contrato conforme as condições acordadas.</p>
                      </div>

                      <div>
                        <p className="font-bold mb-2">4. CLÁUSULA QUARTA – DO ATRASO NO PAGAMENTO</p>
                        <p className="text-justify">4.1. Pagamentos em atraso serão corrigidos com multa de 2% e juros de 1% ao mês.</p>
                      </div>

                      <div>
                        <p className="font-bold mb-2">5. CLÁUSULA QUINTA – ENTREGA DOS EQUIPAMENTOS</p>
                        <p className="text-justify">5.1. Os equipamentos serão entregues no endereço acordado, devendo a LOCATÁRIA conferir o funcionamento no ato do recebimento.</p>
                      </div>

                      <div>
                        <p className="font-bold mb-2">6. CLÁUSULA SEXTA – RESPONSABILIDADES DAS PARTES</p>
                        <p className="text-justify">6.1. LOCADORA: entregar e manter os equipamentos em perfeito estado.</p>
                        <p className="text-justify">6.2. LOCATÁRIA: pagar pontualmente, zelar pelo equipamento e não sublocar sem autorização.</p>
                      </div>

                      <div>
                        <p className="font-bold mb-2">7. CLÁUSULA SÉTIMA – CESSÃO DE DIREITOS</p>
                        <p className="text-justify">7.1. É vedada a transferência dos direitos e deveres deste contrato a terceiros sem autorização expressa.</p>
                      </div>

                      <div>
                        <p className="font-bold mb-2">8. CLÁUSULA OITAVA – MULTA CONTRATUAL</p>
                        <p className="text-justify">8.1. A rescisão imotivada do contrato pela LOCATÁRIA ensejará o pagamento de multa conforme acordado entre as partes.</p>
                      </div>

                      <div>
                        <p className="font-bold mb-2">9. CLÁUSULA NONA – MULTA POR ATRASO NA DEVOLUÇÃO</p>
                        <p className="text-justify">9.1. O atraso na devolução incidirá multa diária até a efetiva entrega dos equipamentos.</p>
                      </div>

                      <div>
                        <p className="font-bold mb-2">10. CLÁUSULA DÉCIMA – FALÊNCIA OU RECUPERAÇÃO JUDICIAL</p>
                        <p className="text-justify">10.1. Caso a LOCATÁRIA entre em falência ou recuperação judicial, o contrato será rescindido de pleno direito, cabendo à massa a devolução dos equipamentos.</p>
                      </div>

                      <div>
                        <p className="font-bold mb-2">11. CLÁUSULA DÉCIMA PRIMEIRA – FORO</p>
                        <p className="text-justify">11.1. Fica eleito o foro da comarca de Rio Claro/SP para dirimir quaisquer questões oriundas deste contrato, com renúncia a qualquer outro. ASSINATURAS por estarem justas e contratadas, firmam o presente instrumento em 2 (duas) vias de igual teor e forma.</p>
                      </div>
                    </div>

                    <SignatureBlock clientName={getClientName(quoteForApproval.clientId, quoteForApproval.clientName)} />
                  </div>
                </div>

                <DocumentFooter text="Válido mediante assinatura das partes." />
              </DocumentContainer>
            </div>

            <AlertDialogFooter className="bg-[#f5f5f5] p-4 flex flex-row gap-3 justify-end sm:justify-end border-t border-[#e5e5e5]">
              {isContractGenerated ? (
                <>
                  <Button 
                    variant="outline" 
                    type="button" 
                    className="h-10 px-6 font-medium"
                    onClick={() => handlePrintDocument(contractPrintRef)}
                  >
                    Imprimir / Salvar PDF
                  </Button>
                  <Button 
                    variant="default" 
                    type="button" 
                    className="h-10 px-6 font-medium bg-[#1a1a1a] hover:bg-black text-white"
                    onClick={() => {
                      setQuoteForApproval(null);
                      setIsContractGenerated(false);
                    }}
                  >
                    Fechar
                  </Button>
                </>
              ) : (
                <>
                  <Button 
                    variant="outline"
                    className="h-11 px-8 font-semibold border-[#e5e5e5] text-[#666666] hover:bg-gray-50"
                    type="button" 
                    onClick={() => {
                      setQuoteForApproval(null);
                      setIsContractGenerated(false);
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="button"
                    className="h-11 px-8 font-semibold bg-[#22c55e] hover:bg-[#16a34a] text-white flex items-center gap-2" 
                    onClick={() => confirmConvertToContract(quoteForApproval.id)}
                  >
                    <FileCheck className="h-5 w-5" />
                    Confirmar Aprovação e Gerar Contrato
                  </Button>
                </>
              )}
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
      {/* Ref para download direto de PDF (off-screen, mas com tamanho real para o html2canvas) */}
      <div style={{ position: "fixed", left: "-10000px", top: 0, width: "800px", pointerEvents: "none", zIndex: -1 }} aria-hidden="true">
        <div ref={quoteDownloadRef}>
          {quoteForDownload && (
            <DocumentContainer>
              <DocumentHeader 
                title="ORÇAMENTO" 
                documentNumber={quoteForDownload.id} 
                date={formatQuoteDate(quoteForDownload)} 
                responsible={quoteResponsible}
              />

              <DocumentSection title="CLIENTE">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-12">
                  <div className="flex flex-col">
                    <span className="text-xs text-[#666666] uppercase">Razão Social</span>
                    <span className="text-sm font-bold text-[#1a1a1a]">
                      {getClientName(quoteForDownload.clientId, quoteForDownload.clientName)}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-[#666666] uppercase">CNPJ/CPF</span>
                    <span className="text-sm font-bold text-[#1a1a1a]">
                      {clients.find((c: any) => c.id === quoteForDownload.clientId)?.cnpj || 
                       clients.find((c: any) => c.id === quoteForDownload.clientId)?.cpf || 
                       "—"}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-[#666666] uppercase">Pessoa de Contato</span>
                    <span className="text-sm font-bold text-[#1a1a1a]">
                      {clients.find((c: any) => c.id === quoteForDownload.clientId)?.contato || 
                       clients.find((c: any) => c.id === quoteForDownload.clientId)?.contactPerson || 
                       "—"}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-[#666666] uppercase">Telefone / WhatsApp</span>
                    <span className="text-sm font-bold text-[#1a1a1a]">
                      {formatPhoneBR(clients.find((c: any) => c.id === quoteForDownload.clientId)?.telefone || 
                       clients.find((c: any) => c.id === quoteForDownload.clientId)?.phone || 
                       clients.find((c: any) => c.id === quoteForDownload.clientId)?.whatsapp) || 
                       "—"}

                    </span>
                  </div>
                </div>
              </DocumentSection>

              <DocumentSection title="ITENS DO ORÇAMENTO">
                <DocumentTable 
                  headers={["Equipamento", "Qtd.", "Vl. Unit.", "Total"]}
                  alignments={["left", "center", "right", "right"]}
                  rows={(quoteForDownload.items || []).map((item: any) => {
                    return [
                      <DocumentItemRow key={item.equipmentId} item={item} equipments={equipments} pdfMode />,
                      item.quantity.toString(),
                      formatCurrency(Number(item.unitPrice || 0)),
                      <span key="total" className="font-bold">{formatCurrency(Number(item.quantity || 0) * Number(item.unitPrice || 0))}</span>
                    ];
                  })}
                />
                
                <div className="flex justify-end mt-4">
                  <div className="flex flex-col items-end gap-1">
                    <div className="flex justify-between w-64">
                      <span className="text-sm font-bold text-[#666666]">
                        {quoteForDownload.budgetType === "locacao" ? "Total Mensal do Orçamento" : "Total do Orçamento"}
                      </span>
                      <span className="text-base font-bold text-[#1a1a1a]">{formatCurrency(Number(quoteForDownload.totalValue || 0))}</span>
                    </div>
                  </div>
                </div>
              </DocumentSection>

              <DocumentSection title="TERMOS E CONDIÇÕES">
                <div className="flex flex-col gap-2">
                  <div>
                    <p className="font-bold text-[#1a1a1a] mb-1 text-sm">{quoteForDownload.budgetType === "locacao" ? "Período de locação:" : "Prazo de entrega:"}</p>
                    <p className="text-sm text-[#333333]">
                      {quoteForDownload.budgetType === "locacao" 
                        ? `${formatDate(quoteForDownload.startDate)} a ${formatDate(quoteForDownload.endDate)}.` 
                        : quoteForDownload.prazoEntrega || "Prazo imediato."}
                    </p>

                  </div>
                  
                  <div>
                    <p className="font-bold text-[#1a1a1a] mb-1 text-sm">Informações Fiscais:</p>
                    <p className="text-sm text-[#333333]">
                      {quoteForDownload.informacoesFiscais || quoteForDownload.fiscalInfo || "Nenhuma informação fiscal fornecida."}
                    </p>
                  </div>

                  <div>
                    <p className="font-bold text-[#1a1a1a] mb-1 text-sm">Observações Gerais:</p>
                    <p className="text-sm text-[#333333]">
                      {quoteForDownload.observations || "Nenhuma observação fornecida."}
                    </p>
                  </div>
                </div>
              </DocumentSection>

              <DocumentFooter />
            </DocumentContainer>
          )}
        </div>
      </div>
    </div>
  );
}
