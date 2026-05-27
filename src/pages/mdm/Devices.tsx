import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { mdmApi } from '@/services/mdmApi';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  RefreshCw, 
  Smartphone, 
  ExternalLink,
  Battery,
  Wifi,
  WifiOff,
  Eye
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function Devices() {
  const [searchTerm, setSearchTerm] = useState('');
  
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['mdmSummary'],
    queryFn: () => mdmApi.getDashboardSummary(),
  });

  const filteredDevices = data?.devices.filter(device => 
    device.patrimonio.toLowerCase().includes(searchTerm.toLowerCase()) ||
    device.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    device.cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
    device.serial.toLowerCase().includes(searchTerm.toLowerCase()) ||
    device.imei.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const getStatusBadge = (status: string) => {
    if (status === 'online') return <Badge className="bg-green-500 hover:bg-green-600 gap-1"><Wifi size={12} /> Online</Badge>;
    return <Badge variant="secondary" className="bg-slate-200 text-slate-600 gap-1"><WifiOff size={12} /> Offline</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Dispositivos</h2>
          <p className="text-slate-500">Gerencie todos os PDAs cadastrados</p>
        </div>
        <Button variant="outline" onClick={() => refetch()} disabled={isLoading} className="gap-2 border-slate-200 shadow-sm">
          <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} /> Atualizar
        </Button>
      </div>

      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <CardHeader className="bg-white border-b border-slate-100 py-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <Input 
                placeholder="Buscar por patrimônio, nome, serial, IMEI..." 
                className="pl-10 border-slate-200 focus-visible:ring-orange-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="text-sm text-slate-400 font-medium">
              {filteredDevices.length} dispositivo(s) encontrado(s)
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[120px] font-bold text-slate-700">Patrimônio</TableHead>
                <TableHead className="font-bold text-slate-700">Dispositivo</TableHead>
                <TableHead className="font-bold text-slate-700">Cliente / Contrato</TableHead>
                <TableHead className="font-bold text-slate-700">Status</TableHead>
                <TableHead className="font-bold text-slate-700">Bateria</TableHead>
                <TableHead className="font-bold text-slate-700">Última Conexão</TableHead>
                <TableHead className="text-right font-bold text-slate-700">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={7} className="h-16 animate-pulse bg-slate-50/50" />
                  </TableRow>
                ))
              ) : filteredDevices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-slate-400">
                    Nenhum dispositivo encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                filteredDevices.map((device) => (
                  <TableRow key={device.id} className="group hover:bg-slate-50/50 transition-colors">
                    <TableCell>
                      <Badge variant="outline" className="font-mono text-orange-600 bg-orange-50 border-orange-100">
                        {device.patrimonio}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-orange-100 group-hover:text-orange-500 transition-colors">
                          <Smartphone size={16} />
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 leading-none mb-1">{device.nome}</div>
                          <div className="text-xs text-slate-400 font-medium">{device.modelo}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-slate-700 leading-none mb-1">{device.cliente}</div>
                      <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">{device.contrato}</div>
                    </TableCell>
                    <TableCell>{getStatusBadge(device.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                          <div 
                            className={`h-full transition-all ${
                              (device.lastBattery || 0) < 20 ? 'bg-red-500' : 
                              (device.lastBattery || 0) < 60 ? 'bg-orange-500' : 'bg-green-500'
                            }`}
                            style={{ width: `${device.lastBattery || 0}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-slate-600">{device.lastBattery || 0}%</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-500 text-sm">
                      {formatDistanceToNow(new Date(device.lastSeenAt), { addSuffix: true, locale: ptBR })}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="ghost" size="sm" className="h-9 px-3 gap-2 text-slate-600 hover:text-orange-600 hover:bg-orange-50">
                        <Link to={`/mdm/devices/${device.id}`}>
                          <Eye size={16} />
                          <span>Detalhes</span>
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
    </div>
  );
}
