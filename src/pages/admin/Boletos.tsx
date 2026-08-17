//src/pages/admin/Boletos.tsx

import { useState, useMemo, useEffect } from "react";
import { useStore } from "@/store";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import { Plus, MoreHorizontal, FileCheck, FileX, Download, Trash2, Paperclip } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { AttachBoletoDialog } from "@/components/financeiro/AttachBoletoDialog";
import { openPrivateFile } from "@/lib/private-file";

const Boletos = () => {
  const { revenues, fetchAllData, deleteBoletoFromRevenue } = useStore();

  const [showAttachDialog, setShowAttachDialog] = useState(false);
  const [selectedRevenue, setSelectedRevenue] = useState<any>(null);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const contractRevenues = useMemo(() => {
    return revenues
      .filter((revenue: any) => revenue.contractId)
      .sort((a: any, b: any) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }, [revenues]);

  const handleAttach = (revenue: any) => {
    setSelectedRevenue(revenue);
    setShowAttachDialog(true);
  };

  const handleAddNew = () => {
    setSelectedRevenue(null);
    setShowAttachDialog(true);
  };

  const handleCloseDialog = (open: boolean) => {
    if (!open) {
      setSelectedRevenue(null);
    }
    setShowAttachDialog(open);
  };

  return (
    <div className="space-y-6">
      <Card className="border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Gestão de Boletos</CardTitle>
              <CardDescription>Anexe e gerencie os boletos das parcelas de contratos.</CardDescription>
            </div>

            <Button size="sm" className="gap-2" onClick={handleAddNew}>
              <Plus className="h-4 w-4" />
              Anexar Boleto
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
                contractRevenues.map((revenue: any) => (
                  <TableRow key={revenue.id}>
                    <TableCell className="text-sm font-medium">{revenue.contractId}</TableCell>

                    <TableCell className="text-sm">{revenue.description || "-"}</TableCell>

                    <TableCell className="text-sm">
                      {revenue.dueDate ? format(new Date(revenue.dueDate), "dd/MM/yyyy") : "-"}
                    </TableCell>

                    <TableCell className="text-sm">{formatCurrency(revenue.valorTotal || 0)}</TableCell>

                    <TableCell>
                      {revenue.boletoUrl ? (
                        <div className="flex items-center gap-2 text-green-600">
                          <FileCheck className="h-4 w-4" />
                          <span>Anexado</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <FileX className="h-4 w-4" />
                          <span>Pendente</span>
                        </div>
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
                          {!revenue.boletoUrl ? (
                            <DropdownMenuItem onClick={() => handleAttach(revenue)}>
                              <Paperclip className="h-4 w-4 mr-2" />
                              Anexar Boleto
                            </DropdownMenuItem>
                          ) : (
                            <>
                              <DropdownMenuItem onClick={() => openPrivateFile(revenue.boletoUrl)}>
                                <Download className="h-4 w-4 mr-2" />
                                Baixar Boleto
                              </DropdownMenuItem>

                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive">
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Excluir Anexo
                                  </DropdownMenuItem>
                                </AlertDialogTrigger>

                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Excluir Anexo?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Esta ação removerá o anexo do boleto permanentemente.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>

                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => deleteBoletoFromRevenue(revenue.id)}>
                                      Continuar
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </>
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

      <AttachBoletoDialog open={showAttachDialog} onOpenChange={handleCloseDialog} revenue={selectedRevenue} />
    </div>
  );
};

export default Boletos;
