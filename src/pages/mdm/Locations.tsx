import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { mdmApi } from '@/services/mdmApi';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MapPin, RefreshCw, ExternalLink, Battery, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function LocationsPage() {
  const { data: summary, isLoading: isLoadingSummary } = useQuery({
    queryKey: ['mdmSummary'],
    queryFn: () => mdmApi.getDashboardSummary(),
  });

  const devices = summary?.devices || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Rastreamento de Frota</h2>
          <p className="text-slate-500">Histórico de coordenadas e nível de bateria</p>
        </div>
      </div>

      <div className="grid gap-6">
        {devices.map(device => (
          <DeviceLocationList key={device.id} device={device} />
        ))}
      </div>
    </div>
  );
}

function DeviceLocationList({ device }: { device: any }) {
  const { data: locations, isLoading, refetch } = useQuery({
    queryKey: ['mdmLocations', device.id],
    queryFn: () => mdmApi.getDeviceLocations(device.id),
  });

  return (
    <Card className="border-slate-200 shadow-sm overflow-hidden">
      <CardHeader className="bg-white border-b border-slate-50 py-4 flex flex-row items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
            <MapPin size={20} />
          </div>
          <div>
            <CardTitle className="text-base">{device.nome} ({device.patrimonio})</CardTitle>
            <CardDescription className="text-xs">Serial: {device.serial}</CardDescription>
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
              <TableHead className="font-bold text-slate-700">Data/Hora</TableHead>
              <TableHead className="font-bold text-slate-700">Coordenadas</TableHead>
              <TableHead className="font-bold text-slate-700">Bateria</TableHead>
              <TableHead className="text-right font-bold text-slate-700">Mapa</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={4} className="h-20 animate-pulse bg-slate-50/50" /></TableRow>
            ) : !locations || locations.length === 0 ? (
              <TableRow><TableCell colSpan={4} className="h-20 text-center text-slate-400 text-sm">Nenhuma localização disponível.</TableCell></TableRow>
            ) : (
              locations.slice(0, 5).map((loc) => (
                <TableRow key={loc.id}>
                  <TableCell className="text-slate-700 font-medium text-xs">
                    {format(new Date(loc.capturedAt), "dd/MM/yy HH:mm", { locale: ptBR })}
                  </TableCell>
                  <TableCell className="text-slate-500 font-mono text-[10px]">
                    {loc.latitude.toFixed(6)}, {loc.longitude.toFixed(6)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <Battery size={12} className={loc.battery < 20 ? 'text-red-500' : 'text-slate-400'} />
                      <span className="text-xs font-bold">{loc.battery}%</span>
                      {loc.isCharging && <Zap size={10} className="text-yellow-500 fill-yellow-500" />}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0 text-orange-600 hover:text-orange-700 hover:bg-orange-50 rounded-full"
                      onClick={() => window.open(`https://www.google.com/maps?q=${loc.latitude},${loc.longitude}`, '_blank')}
                    >
                      <ExternalLink size={16} />
                    </Button>
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
