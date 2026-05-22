import { useMemo, useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Globe, Users, DollarSign, Package, Loader2 } from "lucide-react";
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

export default function ProjetosVisaoGeral() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{ clients: any[]; revenues: any[] }>({ clients: [], revenues: [] });

  useEffect(() => {
    async function fetchData() {
      try {
        const [clientsSnapshot, revenuesSnapshot] = await Promise.all([
          getDocs(collection(db, "clients")),
          getDocs(collection(db, "revenues"))
        ]);

        const clientsData = clientsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const revenuesData = revenuesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        setData({ clients: clientsData, revenues: revenuesData });
      } catch (error) {
        console.error("Error fetching project data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const projectStats = useMemo(() => {
    const projects = new Map<string, { name: string; clientsCount: number; revenuesTotal: number }>();

    // Initial project to ensure it's always visible even if empty
    projects.set("tech4zap", {
      name: "Tech4Zap",
      clientsCount: 0,
      revenuesTotal: 0
    });

    const isTech4ZapItem = (item: any) => 
      item?.projectId === "tech4zap" || 
      item?.source === "tech4zap" || 
      item?.origin === "Tech4Zap" || 
      String(item?.id || "").startsWith("tech4zap-");

    // Count clients per project
    data.clients.forEach((client) => {
      const pId = isTech4ZapItem(client) ? "tech4zap" : client.projectId;
      if (pId) {
        const stats = projects.get(pId) || { 
          name: client.projectName || pId, 
          clientsCount: 0, 
          revenuesTotal: 0 
        };
        stats.clientsCount++;
        projects.set(pId, stats);
      }
    });

    // Sum revenues per project
    data.revenues.forEach((rev) => {
      const pId = isTech4ZapItem(rev) ? "tech4zap" : rev.projectId;
      if (pId && rev.status !== "cancelado") {
        const stats = projects.get(pId) || { 
          name: rev.projectName || pId, 
          clientsCount: 0, 
          revenuesTotal: 0 
        };
        const value = Number(rev.valorTotal || rev.amount || 0);
        stats.revenuesTotal += value;
        projects.set(pId, stats);
      }
    });

    return Array.from(projects.entries())
      .map(([id, stats]) => ({
        id,
        ...stats
      }))
      .filter(p => p.id === "tech4zap" || p.clientsCount > 0 || p.revenuesTotal > 0);
  }, [data]);

  const totalRevenues = projectStats.reduce((acc, curr) => acc + curr.revenuesTotal, 0);
  const totalClients = projectStats.reduce((acc, curr) => acc + curr.clientsCount, 0);

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Projetos</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projectStats.length}</div>
            <p className="text-xs text-muted-foreground">Projetos integrados ativos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes (Projetos)</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalClients}</div>
            <p className="text-xs text-muted-foreground">Total de clientes vinculados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total (Projetos)</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalRevenues)}</div>
            <p className="text-xs text-muted-foreground">Soma de todas as receitas de projetos</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Projetos</CardTitle>
          <CardDescription>Visão consolidada de todos os projetos integrados.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Projeto</TableHead>
                  <TableHead>ID</TableHead>
                  <TableHead className="text-center">Clientes</TableHead>
                  <TableHead className="text-right">Receita Total</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projectStats.length > 0 ? (
                  projectStats.map((project) => (
                    <TableRow key={project.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-primary" />
                          {project.name}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{project.id}</TableCell>
                      <TableCell className="text-center">{project.clientsCount}</TableCell>
                      <TableCell className="text-right">{formatCurrency(project.revenuesTotal)}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant="secondary" className="cursor-pointer hover:bg-secondary/80">
                          Ver Detalhes
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Nenhum projeto integrado encontrado.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
