import { useMemo, useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, DollarSign, Package, CreditCard, Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const toSafeDate = (value: any): Date | null => {
  if (!value) return null;
  if (value?.toDate && typeof value.toDate === "function") {
    const date = value.toDate();
    return isNaN(date.getTime()) ? null : date;
  }
  if (value instanceof Date) {
    return isNaN(value.getTime()) ? null : value;
  }
  const date = new Date(value);
  return isNaN(date.getTime()) ? null : date;
};

const formatSafeDate = (value: any): string => {
  const date = toSafeDate(value);
  if (!date) return "—";
  return format(date, "dd/MM/yyyy", { locale: ptBR });
};

const getTime = (value: any): number => {
  const date = toSafeDate(value);
  return date ? date.getTime() : 0;
};

export default function ProjetosTech4Zap() {
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    clients: any[];
    revenues: any[];
    subscriptions: any[];
  }>({
    clients: [],
    revenues: [],
    subscriptions: [],
  });

  useEffect(() => {
    async function fetchData() {
      try {
        const [clientsSnapshot, revenuesSnapshot, subscriptionsSnapshot] = await Promise.all([
          getDocs(collection(db, "clients")),
          getDocs(collection(db, "revenues")),
          getDocs(collection(db, "tech4zapSubscriptions"))
        ]);

        const clientsData = clientsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const revenuesData = revenuesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const subscriptionsData = subscriptionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        setData({
          clients: clientsData,
          revenues: revenuesData,
          subscriptions: subscriptionsData
        });

        const isTech4ZapItem = (item: any) => 
          item?.projectId === "tech4zap" || 
          item?.source === "tech4zap" || 
          item?.origin === "Tech4Zap" || 
          String(item?.id || "").startsWith("tech4zap-");

        console.log("Tech4Zap Direct Fetch Debug:", {
          clientsData: clientsData.length,
          revenuesData: revenuesData.length,
          subscriptionsData: subscriptionsData.length,
          tech4zapClients: clientsData.filter(isTech4ZapItem).length,
          tech4zapRevenues: revenuesData.filter(isTech4ZapItem).length,
          tech4zapSubscriptions: subscriptionsData.filter(isTech4ZapItem).length
        });
      } catch (error) {
        console.error("Error fetching Tech4Zap data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const tech4zapData = useMemo(() => {
    const isTech4ZapItem = (item: any) => 
      item?.projectId === "tech4zap" || 
      item?.source === "tech4zap" || 
      item?.origin === "Tech4Zap" || 
      String(item?.id || "").startsWith("tech4zap-");

    const filteredClients = data.clients.filter(isTech4ZapItem);
    const filteredRevenues = data.revenues.filter(isTech4ZapItem);
    const filteredSubscriptions = data.subscriptions.filter(isTech4ZapItem);

    const getValue = (item: any) => Number(item?.valorTotal || item?.amount || item?.planAmount || 0);

    const totalRevenue = filteredRevenues
      .filter(r => r.status !== "cancelado")
      .reduce((acc, curr) => acc + getValue(curr), 0);

    const activeMRR = filteredRevenues
      .filter(r => (r.status === "pendente" || r.status === "recebido" || r.status === "ativo") && r.status !== "cancelado")
      .reduce((acc, curr) => acc + getValue(curr), 0);

    const activeSubscriptions = filteredSubscriptions.filter(s => s.status === "ativo" || s.isActive === true);
    const pendingRevenues = filteredRevenues.filter(r => r.status === "pendente");

    return {
      clients: filteredClients,
      revenues: filteredRevenues,
      subscriptions: filteredSubscriptions,
      totalRevenue,
      activeMRR,
      activeSubscriptions,
      pendingRevenues
    };
  }, [data]);

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

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
            <p className="text-xs text-muted-foreground">Total vinculados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assinaturas</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tech4zapData.subscriptions.length}</div>
            <p className="text-xs text-muted-foreground">{tech4zapData.activeSubscriptions.length} ativas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">MRR Estimado</CardTitle>
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
                  {tech4zapData.subscriptions
                    .sort((a, b) => getTime(b.createdAt) - getTime(a.createdAt))
                    .slice(0, 5).map((sub) => (
                    <div key={sub.id} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                      <div>
                        <p className="font-medium">{sub.clientName || sub.customerName || "Cliente"}</p>
                        <p className="text-xs text-muted-foreground">
                          {sub.planName || "Plano Pro"} • {formatSafeDate(sub.createdAt)}
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
                  {tech4zapData.pendingRevenues
                    .sort((a, b) => getTime(a.dueDate) - getTime(b.dueDate))
                    .slice(0, 5)
                    .map((rev) => (
                      <div key={rev.id} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                        <div>
                          <p className="font-medium">{rev.clientName || "Cliente"}</p>
                          <p className="text-xs text-muted-foreground">
                            Vencimento: {formatSafeDate(rev.dueDate)}
                          </p>
                        </div>
                        <p className="font-bold">{formatCurrency(rev.valorTotal || rev.amount || 0)}</p>
                      </div>
                    ))}
                  {tech4zapData.pendingRevenues.length === 0 && (
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
                          <TableCell>{formatCurrency(sub.amount || sub.valorTotal || sub.planAmount || 0)}</TableCell>
                          <TableCell>
                            {formatSafeDate(sub.createdAt)}
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
                            {formatSafeDate(rev.dueDate)}
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
