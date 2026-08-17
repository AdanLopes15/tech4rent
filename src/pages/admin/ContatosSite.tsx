import { cn } from "@/lib/utils";
import { useMemo, useState } from "react";
import { useStore } from "@/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Search, 
  Mail, 
  Phone, 
  MessageSquare, 
  Calendar, 
  Clock, 
  MoreHorizontal, 
  Eye, 
  Trash2, 
  CheckCircle2, 
  XCircle,
  RefreshCw,
  Filter
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
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

const ContatosSite = () => {
  const { siteContacts, fetchAllData, updateSiteContact, deleteSiteContact, loading } = useStore();
  const [search, setSearch] = useState("");
  const [selectedContact, setSelectedContact] = useState<any>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filteredContacts = useMemo(() => {
    return (siteContacts || [])
      .filter((contact: any) => {
        const matchesSearch = 
          (contact.name?.toLowerCase().includes(search.toLowerCase())) ||
          (contact.email?.toLowerCase().includes(search.toLowerCase())) ||
          (contact.message?.toLowerCase().includes(search.toLowerCase()));
        
        const matchesStatus = statusFilter === "all" || contact.status === statusFilter;
        
        return matchesSearch && matchesStatus;
      })
      .sort((a: any, b: any) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
        return dateB.getTime() - dateA.getTime();
      });
  }, [siteContacts, search, statusFilter]);

  const handleStatusChange = async (contactId: string, newStatus: string) => {
    try {
      await updateSiteContact(contactId, { status: newStatus });
      toast.success(`Status atualizado para ${newStatus}`);
    } catch (error) {
      toast.error("Erro ao atualizar status");
    }
  };

  const handleDelete = async (contactId: string) => {
    try {
      await deleteSiteContact(contactId);
      toast.success("Contato excluído com sucesso");
    } catch (error) {
      toast.error("Erro ao excluir contato");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case "novo":
      case "new":
      case "pendente":
        return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">Novo</Badge>;
      case "respondido":
      case "concluído":
      case "resolved":
        return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Respondido</Badge>;
      case "em atendimento":
        return <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20">Em Atendimento</Badge>;
      default:
        return <Badge variant="outline">{status || "Pendente"}</Badge>;
    }
  };

  const formatDate = (date: any) => {
    if (!date) return "N/A";
    const d = date.toDate ? date.toDate() : new Date(date);
    return format(d, "dd/MM/yyyy HH:mm", { locale: ptBR });
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Contatos do Website</h1>
          <p className="text-muted-foreground">Gerencie as mensagens recebidas através do formulário de contato do site.</p>
        </div>
        <Button variant="outline" onClick={() => fetchAllData()} disabled={loading}>
          <RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} />
          Atualizar
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Contatos</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{siteContacts?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Novas Mensagens</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">
              {siteContacts?.filter((c: any) => !c.status || c.status.toLowerCase() === "new" || c.status.toLowerCase() === "pendente" || c.status.toLowerCase() === "novo").length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Respondidos</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {siteContacts?.filter((c: any) => c.status?.toLowerCase() === "respondido" || c.status?.toLowerCase() === "concluído").length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, e-mail ou mensagem..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <select 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">Todos os status</option>
                <option value="Novo">Novo</option>
                <option value="Em Atendimento">Em Atendimento</option>
                <option value="Respondido">Respondido</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Remetente</TableHead>
                  <TableHead>Mensagem</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      <RefreshCw className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                      <p className="mt-2 text-sm text-muted-foreground">Carregando contatos...</p>
                    </TableCell>
                  </TableRow>
                ) : filteredContacts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                      Nenhum contato encontrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredContacts.map((contact: any) => (
                    <TableRow key={contact.id}>
                      <TableCell className="whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="font-medium">{formatDate(contact.createdAt)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-bold">{contact.name || contact.nome}</span>
                          <span className="text-xs text-muted-foreground">{contact.email}</span>
                          {contact.phone && <span className="text-xs text-muted-foreground">{contact.phone}</span>}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <p className="truncate text-sm text-muted-foreground">
                          {contact.message || contact.mensagem}
                        </p>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(contact.status)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => {
                              setSelectedContact(contact);
                              setIsViewOpen(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleStatusChange(contact.id, "Novo")}>
                                <Clock className="mr-2 h-4 w-4" />
                                Marcar como Novo
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleStatusChange(contact.id, "Em Atendimento")}>
                                <RefreshCw className="mr-2 h-4 w-4" />
                                Em Atendimento
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleStatusChange(contact.id, "Respondido")}>
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                Marcar como Respondido
                              </DropdownMenuItem>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <DropdownMenuItem 
                                    className="text-destructive focus:bg-destructive focus:text-destructive-foreground"
                                    onSelect={(e) => e.preventDefault()}
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Excluir Contato
                                  </DropdownMenuItem>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Excluir contato?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Esta ação não pode ser desfeita. Isso excluirá permanentemente a mensagem de <strong>{contact.name || contact.nome}</strong>.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction 
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                      onClick={() => handleDelete(contact.id)}
                                    >
                                      Confirmar Exclusão
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Detalhes do Contato</DialogTitle>
            <DialogDescription>
              Mensagem recebida em {selectedContact && formatDate(selectedContact.createdAt)}
            </DialogDescription>
          </DialogHeader>
          {selectedContact && (
            <div className="grid gap-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase">Nome</p>
                  <p className="font-bold">{selectedContact.name || selectedContact.nome}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase">Status</p>
                  <div>{getStatusBadge(selectedContact.status)}</div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase">E-mail</p>
                  <div className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                    <a href={`mailto:${selectedContact.email}`} className="text-sm hover:underline text-primary">{selectedContact.email}</a>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase">Telefone</p>
                  <div className="flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-sm">{selectedContact.phone || "Não informado"}</span>
                  </div>
                </div>
              </div>
              <div className="space-y-2 border-t pt-4">
                <p className="text-xs font-medium text-muted-foreground uppercase">Mensagem</p>
                <div className="rounded-lg bg-muted p-4 text-sm whitespace-pre-wrap leading-relaxed">
                  {selectedContact.message || selectedContact.mensagem}
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-4">
                <Button variant="outline" onClick={() => setIsViewOpen(false)}>Fechar</Button>
                <Button asChild>
                  <a href={`mailto:${selectedContact.email}?subject=Contato TECH4RENT`}>
                    Responder por E-mail
                  </a>
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};


export default ContatosSite;
