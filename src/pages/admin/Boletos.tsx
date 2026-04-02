//src/pages/admin/Boletos.tsx

import { useState, useMemo, useEffect, useRef } from "react";
import { useStore } from "@/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, Paperclip, MoreHorizontal, Trash2, ExternalLink } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { toast } from "sonner";

const Boletos = () => {
  const { revenues, contracts, loading, fetchAllData, attachBoletoToRevenue, deleteBoletoFromRevenue } = useStore();

  const [showAttachDialog, setShowAttachDialog] = useState(false);
  const [selectedContractId, setSelectedContractId] = useState("");
  const [selectedRevenueId, setSelectedRevenueId] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inlineFileRef = useRef<HTMLInputElement>(null);
  const [inlineAttachId, setInlineAttachId] = useState<string | null>(null);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Get all revenues from contracts (installments)
  const contractRevenues = useMemo(() => {
    return revenues
      .filter((r: any) => r.contractId)
      .sort((a: any, b: any) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }, [revenues]);

  // Active contracts for the dialog
  const activeContracts = useMemo(() => contracts.filter((c: any) => c.status === "Em Andamento"), [contracts]);

  // Pending revenues for selected contract
  const pendingRevenues = useMemo(() => {
    if (!selectedContractId) return [];
    return revenues.filter((r: any) => r.contractId === selectedContractId && r.status !== "recebido");
  }, [revenues, selectedContractId]);

  const handleSaveAttach = async () => {
    if (!selectedRevenueId || !selectedFile) {
      toast.error("Selecione o contrato, a parcela e o arquivo.");
      return;
    }
    setSaving(true);
    try {
      await attachBoletoToRevenue(selectedRevenueId, selectedFile);
      toast.success("Boleto anexado!");
      setShowAttachDialog(false);
      resetDialog();
    } catch (err: any) {
      toast.error(err.message || "Erro ao anexar boleto.");
    } finally {
      setSaving(false);
    }
  };

  const handleInlineAttach = (revenueId: string) => {
    setInlineAttachId(revenueId);
    inlineFileRef.current?.click();
  };

  const handleInlineFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !inlineAttachId) return;
    try {
      await attachBoletoToRevenue(inlineAttachId, file);
      toast.success("Boleto anexado!");
    } catch {
      toast.error("Erro ao anexar.");
    } finally {
      setInlineAttachId(null);
      if (inlineFileRef.current) inlineFileRef.current.value = "";
    }
  };

  const handleDeleteBoleto = async (revenueId: string) => {
    try {
      await deleteBoletoFromRevenue(revenueId);
      toast.success("Boleto removido!");
    } catch {
      toast.error("Erro ao remover.");
    }
  };

  const resetDialog = () => {
    setSelectedContractId("");
    setSelectedRevenueId("");
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="space-y-6">
      <input ref={inlineFileRef} type="file" className="hidden" accept=".pdf" onChange={handleInlineFileChange} />

      <Card className="border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Gestão de Boletos</CardTitle>
              <p className="text-xs text-muted-foreground">Anexe e gerencie os boletos das parcelas de contratos.</p>
            </div>
            <Button
              size="sm"
              className="gap-2"
              onClick={() => {
                resetDialog();
                setShowAttachDialog(true);
              }}
            >
              <Plus className="h-4 w-4" /> Anexar Boleto
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Contrato</TableHead>
                <TableHead>Parcela</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Boleto</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contractRevenues.length > 0 ? (
                contractRevenues.map((r: any) => (
                  <TableRow key={r.id}>
                    <TableCell className="text-sm font-medium">{r.contractId}</TableCell>
                    <TableCell className="text-sm">{r.description || "-"}</TableCell>
                    <TableCell className="text-sm">
                      {r.dueDate ? format(new Date(r.dueDate), "dd/MM/yyyy") : "-"}
                    </TableCell>
                    <TableCell className="text-sm">{formatCurrency(r.valorTotal || 0)}</TableCell>
                    <TableCell>
                      {r.boletoUrl ? (
                        <a href={r.boletoUrl} target="_blank" rel="noopener noreferrer">
                          <Badge className="bg-success/20 text-success border-0 gap-1 cursor-pointer">
                            <ExternalLink className="h-3 w-3" /> Ver Boleto
                          </Badge>
                        </a>
                      ) : (
                        <Badge className="bg-muted text-muted-foreground border-0 gap-1">
                          <Paperclip className="h-3 w-3" /> Pendente
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleInlineAttach(r.id)}>
                            <Paperclip className="h-4 w-4 mr-2" /> Anexar Boleto
                          </DropdownMenuItem>
                          {r.boletoUrl && (
                            <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteBoleto(r.id)}>
                              <Trash2 className="h-4 w-4 mr-2" /> Remover Boleto
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-6">
                    Nenhuma parcela de contrato encontrada.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Attach Dialog */}
      <Dialog open={showAttachDialog} onOpenChange={setShowAttachDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Anexar Boleto</DialogTitle>
            <DialogDescription>
              Selecione o contrato, a parcela e faça o upload do arquivo PDF do boleto.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label>Contrato</Label>
              <Select
                value={selectedContractId}
                onValueChange={(v) => {
                  setSelectedContractId(v);
                  setSelectedRevenueId("");
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um contrato ativo" />
                </SelectTrigger>
                <SelectContent>
                  {activeContracts.map((c: any) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.id} - {c.client?.razaoSocial || "N/A"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label>Parcela</Label>
              <Select value={selectedRevenueId} onValueChange={setSelectedRevenueId} disabled={!selectedContractId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a parcela pendente" />
                </SelectTrigger>
                <SelectContent>
                  {pendingRevenues.map((r: any) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.description || "Parcela"} - {r.dueDate ? format(new Date(r.dueDate), "dd/MM/yyyy") : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label>Arquivo PDF</Label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border file:border-border file:text-sm file:font-medium file:bg-muted file:text-foreground hover:file:bg-muted/80 cursor-pointer"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowAttachDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSaveAttach} disabled={saving} className="gap-2">
                <Paperclip className="h-4 w-4" /> {saving ? "Salvando..." : "Salvar Anexo"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Boletos;
