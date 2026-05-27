import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { mdmApi } from '@/services/mdmApi';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Smartphone, 
  Wifi, 
  WifiOff, 
  ShieldAlert, 
  Tablet, 
  MapPin, 
  RefreshCw,
  Search,
  Eye,
  Activity,
  CheckCircle2,
  Clock,
  ArrowUpRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';

export default function Dashboard() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['mdmSummary'],
    queryFn: () => mdmApi.getDashboardSummary(),
  });

  const stats = [
    { label: 'Total de PDAs', value: data?.totalDevices || 0, icon: Smartphone, color: 'text-slate-600', bgColor: 'bg-slate-100' },
    { label: 'PDAs Online', value: data?.onlineDevices || 0, icon: Wifi, color: 'text-green-600', bgColor: 'bg-green-100' },
    { label: 'PDAs Offline', value: data?.offlineDevices || 0, icon: WifiOff, color: 'text-red-600', bgColor: 'bg-red-100' },
    { label: 'Bloqueados', value: data?.blockedDevices || 0, icon: ShieldAlert, color: 'text-orange-600', bgColor: 'bg-orange-100' },
    { label: 'Modo Kiosk', value: data?.kioskDevices || 0, icon: Tablet, color: 'text-purple-600', bgColor: 'bg-purple-100' },
    { label: 'Com GPS', value: data?.devicesWithLocation || 0, icon: MapPin, color: 'text-blue-600', bgColor: 'bg-blue-100' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Dashboard MDM</h2>
          <p className="text-slate-500 font-medium">Monitoramento em tempo real da frota de PDAs</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => refetch()} disabled={isLoading} className="gap-2 border-slate-200 shadow-sm bg-white hover:bg-slate-50 transition-all">
            <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} /> Atualizar Dashboard
          </Button>
          <Button asChild className="bg-orange-500 hover:bg-orange-600 gap-2 shadow-lg shadow-orange-100 transition-all active:scale-95">
            <Link to="/mdm/devices">
              <Smartphone size={16} /> Ver Dispositivos
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        {stats.map((stat, i) => (
          <Card key={i} className="border-none shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden group">
            <CardContent className="p-6 relative">
              <div className={`absolute top-0 right-0 w-16 h-16 ${stat.bgColor} opacity-10 rounded-bl-full transition-transform group-hover:scale-125`} />
              <div className="flex flex-col gap-4">
                <div className={`w-12 h-12 ${stat.bgColor} ${stat.color} rounded-2xl flex items-center justify-center shadow-inner`}>
                  <stat.icon size={24} />
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">{stat.label}</p>
                  <p className="text-3xl font-black text-slate-900 mt-1 tracking-tight">{stat.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <Card className="xl:col-span-2 border-slate-200 shadow-sm overflow-hidden">
          <CardHeader className="bg-white border-b border-slate-50 flex flex-row items-center justify-between py-4">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <Activity size={20} className="text-orange-500" /> Dispositivos Recentes
              </CardTitle>
              <CardDescription>Status atual das últimas conexões</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild className="text-orange-600 hover:text-orange-700 hover:bg-orange-50">
              <Link to="/mdm/devices" className="gap-1">
                Ver todos <ArrowUpRight size={14} />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow>
                  <TableHead className="font-bold text-slate-700">Patrimônio</TableHead>
                  <TableHead className="font-bold text-slate-700">Nome</TableHead>
                  <TableHead className="font-bold text-slate-700">Status</TableHead>
                  <TableHead className="font-bold text-slate-700">Visto em</TableHead>
                  <TableHead className="text-right font-bold text-slate-700">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={5} className="h-16 animate-pulse bg-slate-50/50" />
                    </TableRow>
                  ))
                ) : data?.devices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center text-slate-400">
                      Nenhum dispositivo encontrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  data?.devices.slice(0, 5).map((device) => (
                    <TableRow key={device.id} className="hover:bg-slate-50/50 transition-colors">
                      <TableCell>
                        <Badge variant="outline" className="font-mono text-orange-600 bg-orange-50 border-orange-100">
                          {device.patrimonio}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-bold text-slate-700">{device.nome}</TableCell>
                      <TableCell>
                        {device.status === 'online' ? (
                          <div className="flex items-center gap-1.5 text-green-600 font-bold text-xs uppercase tracking-wider">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> Online
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-slate-400 font-bold text-xs uppercase tracking-wider">
                            <span className="w-2 h-2 rounded-full bg-slate-300" /> Offline
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-slate-500 text-sm">
                        {formatDistanceToNow(new Date(device.lastSeenAt), { addSuffix: true, locale: ptBR })}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button asChild variant="ghost" size="sm" className="h-9 w-9 p-0 hover:text-orange-600 hover:bg-orange-50 rounded-full">
                          <Link to={`/mdm/devices/${device.id}`}>
                            <Eye size={18} />
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm flex flex-col">
          <CardHeader className="bg-white border-b border-slate-50 py-4">
            <CardTitle className="text-xl flex items-center gap-2">
              <CheckCircle2 size={20} className="text-orange-500" /> Saúde da Frota
            </CardTitle>
            <CardDescription>KPIs de disponibilidade</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 p-6 space-y-8">
            <div className="space-y-2">
              <div className="flex justify-between text-sm font-bold uppercase tracking-widest text-slate-500">
                <span>Disponibilidade Online</span>
                <span className="text-slate-900">{data ? Math.round((data.onlineDevices / data.totalDevices) * 100) : 0}%</span>
              </div>
              <div className="h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200 p-0.5">
                <div 
                  className="h-full bg-green-500 rounded-full transition-all duration-1000"
                  style={{ width: `${data ? (data.onlineDevices / data.totalDevices) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm font-bold uppercase tracking-widest text-slate-500">
                <span>Segurança (Bloqueados)</span>
                <span className="text-slate-900">{data ? Math.round((data.blockedDevices / data.totalDevices) * 100) : 0}%</span>
              </div>
              <div className="h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200 p-0.5">
                <div 
                  className="h-full bg-orange-500 rounded-full transition-all duration-1000"
                  style={{ width: `${data ? (data.blockedDevices / data.totalDevices) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-50">
              <div className="flex items-center gap-3 p-4 bg-orange-50 rounded-2xl border border-orange-100">
                <Clock className="text-orange-500 shrink-0" size={24} />
                <div>
                  <p className="text-xs font-bold text-orange-600 uppercase tracking-widest">Tempo Médio de Atividade</p>
                  <p className="text-lg font-black text-slate-900 tracking-tight">99.8%</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
