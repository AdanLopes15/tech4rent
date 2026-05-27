import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { mdmApi } from '@/services/mdmApi';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Smartphone, Wifi, WifiOff, ShieldAlert, Tablet, MapPin, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';

export default function Dashboard() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['mdmSummary'],
    queryFn: () => mdmApi.getDashboardSummary(),
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-900">Dashboard MDM</h2>
        <Button variant="outline" onClick={() => refetch()} className="gap-2">
          <RefreshCw size={16} /> Atualizar
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {[
          { label: 'Total', value: data?.totalDevices || 0, icon: Smartphone, color: 'text-slate-600' },
          { label: 'Online', value: data?.onlineDevices || 0, icon: Wifi, color: 'text-green-600' },
          { label: 'Offline', value: data?.offlineDevices || 0, icon: WifiOff, color: 'text-red-600' },
          { label: 'Bloqueados', value: data?.blockedDevices || 0, icon: ShieldAlert, color: 'text-orange-600' },
          { label: 'Kiosk', value: data?.kioskDevices || 0, icon: Tablet, color: 'text-purple-600' },
          { label: 'Com Localização', value: data?.devicesWithLocation || 0, icon: MapPin, color: 'text-blue-600' },
        ].map((stat, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 font-medium">{stat.label}</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</p>
                </div>
                <stat.icon className={stat.color} size={24} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Aqui viria a tabela de dispositivos que criaremos em seguida */}
    </div>
  );
}
