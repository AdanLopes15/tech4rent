import { useMemo, useState } from "react";
import { useStore } from "@/store";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, DollarSign, Package, CreditCard } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function ProjetosTech4Zap() {
  const { clients, revenues, tech4zapSubscriptions } = useStore();
  const [activeTab, setActiveTab] = useState("overview");

  const tech4zapData = useMemo(() => {
    const isTech4Zap = (doc: any) => 
      doc.projectId === "tech4zap" || 
      doc.source === "tech4zap" || 
      doc.origin === "Tech4Zap" || 
      String(doc.id || "").startsWith("tech4zap-");

    const filteredClients = clients.filter(isTech4Zap);
    const filteredRevenues = revenues.filter(isTech4Zap);
    const filteredSubscriptions = tech4zapSubscriptions.filter(isTech4Zap);

    const totalRevenue = filteredRevenues
      .filter(r => r.status !== "cancelado")
      .reduce((acc, curr) => acc + Number(curr.valorTotal || curr.amount || 0), 0);

    // More accurate MRR: sum of active subscriptions
    const activeMRR = filteredSubscriptions
      .filter(s => s.status === "ativo" || s.isActive === true)
      .reduce((acc, curr) => acc + Number(curr.amount || curr.valorTotal || 0), 0);

    return {
      clients: filteredClients,
      revenues: filteredRevenues,
      subscriptions: filteredSubscriptions,
      totalRevenue,
      activeMRR: activeMRR || (totalRevenue / 12),
      activeClientsCount: filteredClients.filter(c => c.status === "ativo").length
    };
  }, [clients, revenues, tech4zapSubscriptions]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Tech4Zap</h2>
          <p className="text-muted-foreground">Gestão administrativa do projeto Tech4Zap.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes Tech4Zap</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tech4zapData.clients.length}</div>
            <p className="text-xs text-muted-foreground">{tech4zapData.activeClientsCount} ativos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assinaturas</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tech4zapData.subscriptions.length}</div>
            <p className="text-xs text-muted-foreground">Contratos de SaaS</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">MRREstimado</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(tech4zapData.activeMRR)}</div>
            <p className="text-xs text-muted-foreground">Receita mensal recorrente</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(tech4zapData.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">Acumulado histórico</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 md:w-[600px]">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="clients">Clientes</TabsTrigger>
          <TabsTrigger value="subscriptions">Assinaturas</TabsTrigger>
          <TabsTrigger value="revenues">Financeiro</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Últimas Assinaturas</CardTitle>
                <CardDescription>Novas adesões ao Tech4Zap.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {tech4zapData.subscriptions.slice(0, 5).map((sub) => (
                    <div key={sub.id} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                      <div>
                        <p className="font-medium">{sub.clientName || sub.customerName || "Cliente"}</p>
                        <p className="text-xs text-muted-foreground">
                          {sub.planName || "Plano Pro"} • {sub.createdAt ? format(new Date(sub.createdAt), "dd/MM/yyyy") : "—"}
                        </p>
                      </div>
                      <Badge variant={(sub.status === "ativo" || sub.isActive === true) ? "default" : "secondary"}>
                        {sub.status || (sub.isActive ? "ativo" : "pendente")}
                      </Badge>
                    </div>
                  ))}
                  {tech4zapData.subscriptions.length === 0 && (
                    <p className="text-center text-muted-foreground py-4 text-sm">Nenhuma assinatura encontrada.</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Receitas Pendentes</CardTitle>
                <CardDescription>Lançamentos aguardando recebimento.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {tech4zapData.revenues
                    .filter(r => r.status === "pendente")
                    .slice(0, 5)
                    .map((rev) => (
                      <div key={rev.id} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                        <div>
                          <p className="font-medium">{rev.clientName || "Cliente"}</p>
                          <p className="text-xs text-muted-foreground">
                            Vencimento: {rev.dueDate ? format(new Date(rev.dueDate), "dd/MM/yyyy") : "—"}
                          </p>
                        </div>
                        <p className="font-bold">{formatCurrency(rev.valorTotal || rev.amount || 0)}</p>
                      </div>
                    ))}
                  {tech4zapData.revenues.filter(r => r.status === "pendente").length === 0 && (
                    <p className="text-center text-muted-foreground py-4 text-sm">Nenhuma receita pendente.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="clients" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Clientes Tech4Zap</CardTitle>
              <CardDescription>Clientes integrados via Tech4Zap.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tech4zapData.clients.length > 0 ? (
                      tech4zapData.clients.map((client) => (
                        <TableRow key={client.id}>
                          <TableCell className="font-medium">{client.razaoSocial || client.name}</TableCell>
                          <TableCell>{client.email || "—"}</TableCell>
                          <TableCell>
                            <Badge variant={client.status === "ativo" ? "default" : "secondary"}>
                              {client.status || "ativo"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge variant="outline" className="cursor-pointer">Ver</Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                          Nenhum cliente Tech4Zap encontrado.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subscriptions" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Assinaturas de SaaS</CardTitle>
              <CardDescription>Gestão de assinaturas do Tech4Zap.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Plano</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Início</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tech4zapData.subscriptions.length > 0 ? (
                      tech4zapData.subscriptions.map((sub) => (
                        <TableRow key={sub.id}>
                          <TableCell className="font-medium">{sub.clientName || sub.customerName || "Cliente"}</TableCell>
                          <TableCell>{sub.planName || "Pro"}</TableCell>
                          <TableCell>{formatCurrency(sub.amount || sub.valorTotal || 0)}</TableCell>
                          <TableCell>
                            {sub.createdAt ? format(new Date(sub.createdAt), "dd/MM/yyyy") : "—"}
                          </TableCell>
                          <TableCell>
                            <Badge variant={(sub.status === "ativo" || sub.isActive === true) ? "default" : "secondary"}>
                              {sub.status || (sub.isActive ? "ativo" : "pendente")}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          Nenhuma assinatura encontrada.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="revenues" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Receitas Tech4Zap</CardTitle>
              <CardDescription>Lançamentos financeiros vinculados ao projeto.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Vencimento</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tech4zapData.revenues.length > 0 ? (
                      tech4zapData.revenues.map((rev) => (
                        <TableRow key={rev.id}>
                          <TableCell>
                            {rev.dueDate ? format(new Date(rev.dueDate), "dd/MM/yyyy") : "—"}
                          </TableCell>
                          <TableCell className="font-medium">{rev.clientName || "Cliente"}</TableCell>
                          <TableCell className="font-bold">{formatCurrency(rev.valorTotal || rev.amount || 0)}</TableCell>
                          <TableCell>
                            <Badge 
                              variant={
                                rev.status === "recebido" ? "default" : 
                                rev.status === "cancelado" ? "destructive" : "secondary"
                              }
                            >
                              {rev.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                          Nenhuma receita encontrada.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}