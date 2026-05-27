import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { mdmApi } from '@/services/mdmApi';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Terminal, RefreshCw, Smartphone, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function CommandsPage() {
  const { data: summary, isLoading: isLoadingSummary } = useQuery({
    queryKey: ['mdmSummary'],
    queryFn: () => mdmApi.getDashboardSummary(),
  });

  const devices = summary?.devices || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Monitor de Comandos</h2>
          <p className="text-slate-500">Histórico global de comandos enviados pela plataforma</p>
        </div>
      </div>

      <div className="grid gap-6">
        {devices.map(device => (
          <DeviceCommandList key={device.id} device={device} />
        ))}
      </div>
    </div>
  );
}

function DeviceCommandList({ device }: { device: any }) {
  const { data: commands, isLoading, refetch } = useQuery({
    queryKey: ['mdmCommands', device.id],
    queryFn: () => mdmApi.getDeviceCommands(device.id),
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'EXECUTED': return <Badge className="bg-green-500">Executado</Badge>;
      case 'PENDING': return <Badge className="bg-yellow-500">Pendente</Badge>;
      case 'FAILED': return <Badge variant="destructive">Falhou</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Card className="border-slate-200 shadow-sm overflow-hidden">
      <CardHeader className="bg-white border-b border-slate-50 py-4 flex flex-row items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center">
            <Terminal size={20} />
          </div>
          <div>
            <CardTitle className="text-base">{device.nome} ({device.patrimonio})</CardTitle>
            <CardDescription className="text-xs">ID: {device.id}</CardDescription>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={() => refetch()} className="gap-2">
          <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader className="bg-slate-50/50">
            <TableRow>
              <TableHead className="font-bold text-slate-700">Comando</TableHead>
              <TableHead className="font-bold text-slate-700">Status</TableHead>
              <TableHead className="font-bold text-slate-700">Payload</TableHead>
              <TableHead className="font-bold text-slate-700">Data/Hora</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={4} className="h-20 animate-pulse bg-slate-50/50" /></TableRow>
            ) : !commands || commands.length === 0 ? (
              <TableRow><TableCell colSpan={4} className="h-20 text-center text-slate-400 text-sm">Nenhum comando registrado.</TableCell></TableRow>
            ) : (
              commands.map((cmd) => (
                <TableRow key={cmd.id}>
                  <TableCell className="font-bold text-slate-700 text-xs">{cmd.command}</TableCell>
                  <TableCell>{getStatusBadge(cmd.status)}</TableCell>
                  <TableCell className="text-[10px] font-mono max-w-[200px] truncate">
                    {cmd.payload ? JSON.stringify(cmd.payload) : '—'}
                  </TableCell>
                  <TableCell className="text-slate-500 text-xs">
                    <div className="flex items-center gap-1.5">
                      <Clock size={12} />
                      {format(new Date(cmd.createdAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
