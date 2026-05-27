import React from 'react';
import { DeviceLocation } from '@/types/mdm';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ExternalLink, Battery, Zap } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const LocationHistory = ({ locations }: { locations: DeviceLocation[] }) => {
  const openOnGoogleMaps = (lat: number, lng: number) => {
    window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank');
  };

  return (
    <div className="rounded-md border border-slate-200">
      <Table>
        <TableHeader className="bg-slate-50">
          <TableRow>
            <TableHead>Data/Hora</TableHead>
            <TableHead>Coordenadas</TableHead>
            <TableHead>Precisão</TableHead>
            <TableHead>Bateria</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {locations.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-8 text-slate-400">
                Nenhuma localização registrada.
              </TableCell>
            </TableRow>
          ) : (
            locations.map((loc) => (
              <TableRow key={loc.id}>
                <TableCell className="text-slate-700 font-medium">
                  {format(new Date(loc.capturedAt), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}
                </TableCell>
                <TableCell className="text-slate-500 font-mono text-xs">
                  {loc.latitude.toFixed(6)}, {loc.longitude.toFixed(6)}
                </TableCell>
                <TableCell className="text-slate-500">{loc.accuracy}m</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Battery size={14} className={loc.battery < 20 ? 'text-red-500' : 'text-slate-400'} />
                    <span className="text-sm font-medium">{loc.battery}%</span>
                    {loc.isCharging && <Zap size={12} className="text-yellow-500 fill-yellow-500" />}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 gap-1 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                    onClick={() => openOnGoogleMaps(loc.latitude, loc.longitude)}
                  >
                    <ExternalLink size={14} /> Maps
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};
