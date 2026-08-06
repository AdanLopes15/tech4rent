
import { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";

import { 
  Tabs, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  AlertCircle, 
  CheckCircle2, 
  AlertTriangle, 
  Download,
  Loader2,
  Filter
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useStore } from "@/store";
import { toast } from "sonner";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

interface ImportPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: any[];
  fileName: string;
  onConfirm: (validItems: any[]) => Promise<void>;
}

export const ImportPreviewModal = ({ 
  isOpen, 
  onClose, 
  data, 
  fileName,
  onConfirm 
}: ImportPreviewModalProps) => {
  const [filter, setFilter] = useState("all");
  const [isSaving, setIsSaving] = useState(false);
  const [showConfirmAlert, setShowConfirmAlert] = useState(false);


  const stats = {
    total: data.length,
    revenues: data.filter(item => item.type === "receita").length,
    expenses: data.filter(item => item.type === "despesa").length,
    valid: data.filter(item => item.status === "valid").length,
    error: data.filter(item => item.status === "error").length,
    duplicate: data.filter(item => item.status === "duplicate").length,
  };

  const filteredData = data.filter(item => {
    if (filter === "all") return true;
    if (filter === "valid") return item.status === "valid";
    if (filter === "error") return item.status === "error";
    if (filter === "duplicate") return item.status === "duplicate";
    if (filter === "receita") return item.type === "receita";
    if (filter === "despesa") return item.type === "despesa";
    return true;
  });

  const handleDownloadErrors = async () => {
    const errorItems = data.filter(item => item.status === "error" || item.status === "duplicate");
    if (errorItems.length === 0) return;

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Erros de Importação");

    const headers = Object.keys(errorItems[0].originalData);
    worksheet.addRow([...headers, "Motivo do Erro"]);

    errorItems.forEach(item => {
      const row = headers.map(h => item.originalData[h]);
      worksheet.addRow([...row, item.message]);
    });

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), `Erros-Importacao-${fileName}`);
  };

  const handleConfirm = async () => {
    const validItems = data.filter(item => item.status === "valid" || (item.status === "duplicate" && item.confirmed));
    if (validItems.length === 0) {
      toast.error("Não há itens válidos para importar.");
      return;
    }

    setShowConfirmAlert(true);
  };

  const handleFinalConfirm = async () => {
    const validItems = data.filter(item => item.status === "valid" || (item.status === "duplicate" && item.confirmed));
    setIsSaving(true);
    setShowConfirmAlert(false);
    try {
      await onConfirm(validItems);
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };


  return (
    <Dialog open={isOpen} onOpenChange={(open) => !isSaving && !open && onClose()}>
      <DialogContent className="max-w-[95vw] w-[1200px] max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="text-xl flex items-center gap-2">
            Pré-visualização da Importação: <span className="font-normal text-muted-foreground">{fileName}</span>
          </DialogTitle>
          <DialogDescription>
            Revise os dados antes de confirmar a gravação no sistema.
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 py-2 grid grid-cols-2 md:grid-cols-6 gap-2">
          <div className="bg-muted/50 p-2 rounded-md text-center">
            <p className="text-xs text-muted-foreground uppercase font-bold">Total</p>
            <p className="text-xl font-bold">{stats.total}</p>
          </div>
          <div className="bg-success/10 p-2 rounded-md text-center text-success">
            <p className="text-xs uppercase font-bold">Receitas</p>
            <p className="text-xl font-bold">{stats.revenues}</p>
          </div>
          <div className="bg-destructive/10 p-2 rounded-md text-center text-destructive">
            <p className="text-xs uppercase font-bold">Despesas</p>
            <p className="text-xl font-bold">{stats.expenses}</p>
          </div>
          <div className="bg-success/20 p-2 rounded-md text-center text-success-foreground border border-success/30">
            <p className="text-xs uppercase font-bold">Válidas</p>
            <p className="text-xl font-bold">{stats.valid}</p>
          </div>
          <div className="bg-destructive/20 p-2 rounded-md text-center text-destructive-foreground border border-destructive/30">
            <p className="text-xs uppercase font-bold">Com Erro</p>
            <p className="text-xl font-bold">{stats.error}</p>
          </div>
          <div className="bg-warning/20 p-2 rounded-md text-center text-warning-foreground border border-warning/30">
            <p className="text-xs uppercase font-bold">Duplicatas</p>
            <p className="text-xl font-bold">{stats.duplicate}</p>
          </div>
        </div>

        <div className="px-6 py-2 flex items-center justify-between gap-4">
          <Tabs value={filter} onValueChange={setFilter} className="w-full">
            <TabsList className="w-full md:w-auto h-9">
              <TabsTrigger value="all" className="text-xs">Todas</TabsTrigger>
              <TabsTrigger value="valid" className="text-xs">Válidas</TabsTrigger>
              <TabsTrigger value="error" className="text-xs">Com Erro</TabsTrigger>
              <TabsTrigger value="duplicate" className="text-xs">Duplicadas</TabsTrigger>
              <TabsTrigger value="receita" className="text-xs">Receitas</TabsTrigger>
              <TabsTrigger value="despesa" className="text-xs">Despesas</TabsTrigger>
            </TabsList>
          </Tabs>

          {stats.error + stats.duplicate > 0 && (
            <Button variant="ghost" size="sm" onClick={handleDownloadErrors} className="gap-2 text-xs shrink-0">
              <Download className="h-3.5 w-3.5" />
              Baixar Erros
            </Button>
          )}
        </div>

        <ScrollArea className="flex-1 border-y">
          <div className="p-0">
            <Table>
              <TableHeader className="sticky top-0 bg-background z-10 shadow-sm">
                <TableRow>
                  <TableHead className="w-[60px] text-center">Linha</TableHead>
                  <TableHead className="w-[100px]">Status</TableHead>
                  <TableHead className="w-[80px]">Tipo</TableHead>
                  <TableHead className="min-w-[200px]">Descrição</TableHead>
                  <TableHead className="min-w-[150px]">Entidade</TableHead>
                  <TableHead className="w-[120px] text-right">Valor</TableHead>
                  <TableHead className="w-[100px]">Vencimento</TableHead>
                  <TableHead className="w-[100px]">Competência</TableHead>
                  <TableHead>Mensagem / Validação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.map((item, index) => (
                  <TableRow key={index} className={item.status === 'error' ? 'bg-destructive/5' : item.status === 'duplicate' ? 'bg-warning/5' : ''}>
                    <TableCell className="text-center font-mono text-xs">{item.rowNumber}</TableCell>
                    <TableCell>
                      {item.status === "valid" && (
                        <Badge variant="outline" className="bg-success/10 text-success border-success/20 gap-1 px-1.5">
                          <CheckCircle2 className="h-3 w-3" /> Válida
                        </Badge>
                      )}
                      {item.status === "error" && (
                        <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 gap-1 px-1.5">
                          <AlertCircle className="h-3 w-3" /> Erro
                        </Badge>
                      )}
                      {item.status === "duplicate" && (
                        <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20 gap-1 px-1.5">
                          <AlertTriangle className="h-3 w-3" /> Duplicada
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={item.type === 'receita' ? 'bg-success/10 text-success border-none' : 'bg-destructive/10 text-destructive border-none'}>
                        {item.type === 'receita' ? 'Receita' : 'Despesa'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs max-w-[250px] truncate" title={item.description}>
                      {item.description}
                    </TableCell>
                    <TableCell className="text-xs" title={item.entityName}>
                      {item.entityName || "-"}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs">
                      {formatCurrency(item.valorTotal)}
                    </TableCell>
                    <TableCell className="text-xs">{item.dueDateStr}</TableCell>
                    <TableCell className="text-xs">{item.competenceStr}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {item.status === 'duplicate' ? (
                        <div className="flex items-center gap-2">
                          <span className="text-warning font-semibold">Duplicidade detectada.</span>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className={`h-7 px-2 text-[10px] ${item.confirmed ? 'bg-success/10 text-success' : ''}`}
                            onClick={() => item.onToggleConfirm && item.onToggleConfirm(item.rowNumber)}
                          >
                            {item.confirmed ? 'Confirmado' : 'Confirmar Importação'}
                          </Button>
                        </div>
                      ) : (
                        <span className={item.status === 'error' ? 'text-destructive font-semibold' : ''}>
                          {item.message}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </ScrollArea>

        <DialogFooter className="p-6 pt-4 flex sm:justify-between items-center gap-4">
          <div className="text-xs text-muted-foreground hidden md:block">
            * Apenas linhas válidas e duplicidades confirmadas serão importadas.
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button variant="outline" onClick={onClose} disabled={isSaving} className="flex-1 sm:flex-none">
              Cancelar
            </Button>
            <Button 
              onClick={handleConfirm} 
              disabled={isSaving || (stats.valid === 0 && !data.some(i => i.status === 'duplicate' && i.confirmed))}
              className="flex-1 sm:flex-none"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Gravando...
                </>
              ) : (
                `Confirmar Importação (${data.filter(i => i.status === 'valid' || (i.status === 'duplicate' && i.confirmed)).length})`
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>

      <AlertDialog open={showConfirmAlert} onOpenChange={setShowConfirmAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Importação</AlertDialogTitle>
            <AlertDialogDescription>
              Serão importadas {data.filter(i => (i.status === 'valid' || (i.status === 'duplicate' && i.confirmed)) && i.type === 'receita').length} receitas e {data.filter(i => (i.status === 'valid' || (i.status === 'duplicate' && i.confirmed)) && i.type === 'despesa').length} despesas. Linhas com erro ou ignoradas não serão importadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleFinalConfirm}>Confirmar e Gravar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
};

