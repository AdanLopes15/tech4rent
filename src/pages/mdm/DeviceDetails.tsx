import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Smartphone, 
  Battery, 
  Wifi, 
  WifiOff, 
  MapPin, 
  ShieldAlert, 
  Clock, 
  ChevronLeft,
  RefreshCw,
  Info,
  History,
  Navigation,
  Lock,
  Tablet,
  Barcode
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DeviceActions } from '@/components/mdm/DeviceActions';
import { CommandHistory } from '@/components/mdm/CommandHistory';
import { LocationHistory } from '@/components/mdm/LocationHistory';

export default function DeviceDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: summary, isLoading: isLoadingSummary, refetch: refetchSummary } = useQuery({
    queryKey: ['mdmSummary'],
    queryFn: () => mdmApi.getDashboardSummary(),
  });

  const { data: commands, isLoading: isLoadingCommands, refetch: refetchCommands } = useQuery({
    queryKey: ['mdmCommands', id],
    queryFn: () => mdmApi.getDeviceCommands(id!),
    enabled: !!id,
  });

  const { data: locations, isLoading: isLoadingLocations, refetch: refetchLocations } = useQuery({
    queryKey: ['mdmLocations', id],
    queryFn: () => mdmApi.getDeviceLocations(id!),
    enabled: !!id,
  });

  const device = summary?.devices.find(d => d.id === id);

  const handleRefresh = () => {
    refetchSummary();
    refetchCommands();
    refetchLocations();
  };

  if (isLoadingSummary && !device) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="animate-spin text-orange-500" size={48} />
      </div>
    );
  }

  if (!device) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-bold">Dispositivo não encontrado</h2>
        <Button onClick={() => navigate('/mdm/devices')} className="mt-4">Voltar para lista</Button>
      </div>
    );
  }

  const InfoRow = ({ label, value, icon: Icon }: any) => (
    <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors">
      <div className="p-2 rounded-md bg-white border border-slate-100 text-slate-400 shadow-sm">
        <Icon size={16} />
      </div>
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">{label}</p>
        <p className="text-sm font-bold text-slate-700 leading-tight">{value || '—'}</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate('/mdm/devices')}
            className="rounded-full border border-slate-200 shadow-sm hover:bg-white hover:text-orange-600 transition-all"
          >
            <ChevronLeft size={20} />
          </Button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-2xl font-bold text-slate-900">{device.nome}</h2>
              {device.status === 'online' ? (
                <Badge className="bg-green-500 hover:bg-green-600 gap-1"><Wifi size={12} /> Online</Badge>
              ) : (
                <Badge variant="secondary" className="bg-slate-200 text-slate-600 gap-1"><WifiOff size={12} /> Offline</Badge>
              )}
              {device.isBlocked && <Badge variant="destructive" className="gap-1"><Lock size={12} /> Bloqueado</Badge>}
              {device.isKioskMode && <Badge className="bg-purple-500 hover:bg-purple-600 gap-1"><Tablet size={12} /> Kiosk</Badge>}
            </div>
            <div className="flex items-center gap-4 text-sm text-slate-500 font-medium">
              <span className="flex items-center gap-1.5"><Barcode size={14} className="text-slate-400" /> {device.patrimonio}</span>
              <span className="flex items-center gap-1.5"><Clock size={14} className="text-slate-400" /> Visto {format(new Date(device.lastSeenAt), 'dd/MM/yy HH:mm', { locale: ptBR })}</span>
            </div>
          </div>
        </div>
        <Button variant="outline" onClick={handleRefresh} className="gap-2 self-start border-slate-200 shadow-sm">
          <RefreshCw size={16} /> Sincronizar PDA
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="border-b border-slate-50">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Navigation size={18} className="text-orange-500" /> Ações de Controle
                  </CardTitle>
                  <CardDescription>Envie comandos imediatos para o dispositivo</CardDescription>
                </div>
                <div className="text-[10px] bg-blue-50 text-blue-600 font-bold px-2 py-1 rounded-full uppercase tracking-wider">
                  Real-Time
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <DeviceActions device={device} onSuccess={handleRefresh} />
              <div className="mt-6 flex items-start gap-2 p-3 bg-slate-50 rounded-lg border border-slate-100">
                <Info size={16} className="text-slate-400 mt-0.5" />
                <p className="text-xs text-slate-500 leading-relaxed font-medium">
                  Atenção: O PDA pode levar até <span className="text-orange-600 font-bold">60 segundos</span> para receber e executar o comando, dependendo da qualidade da conexão de rede e bateria.
                </p>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="info" className="w-full">
            <TabsList className="bg-white border border-slate-200 p-1 rounded-xl h-auto mb-4 shadow-sm">
              <TabsTrigger value="info" className="gap-2 px-6 py-2.5 rounded-lg data-[state=active]:bg-orange-500 data-[state=active]:text-white data-[state=active]:shadow-md transition-all">
                <Info size={16} /> Informações
              </TabsTrigger>
              <TabsTrigger value="commands" className="gap-2 px-6 py-2.5 rounded-lg data-[state=active]:bg-orange-500 data-[state=active]:text-white data-[state=active]:shadow-md transition-all">
                <History size={16} /> Histórico de Comandos
              </TabsTrigger>
              <TabsTrigger value="locations" className="gap-2 px-6 py-2.5 rounded-lg data-[state=active]:bg-orange-500 data-[state=active]:text-white data-[state=active]:shadow-md transition-all">
                <MapPin size={16} /> Histórico de Localização
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="info" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="border-slate-200 shadow-sm">
                  <CardHeader className="py-4 border-b border-slate-50">
                    <CardTitle className="text-sm font-bold uppercase tracking-widest text-slate-400">Identificação</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y divide-slate-50">
                      <InfoRow label="Nome do Dispositivo" value={device.nome} icon={Smartphone} />
                      <InfoRow label="Patrimônio" value={device.patrimonio} icon={Barcode} />
                      <InfoRow label="Modelo" value={device.modelo} icon={Smartphone} />
                      <InfoRow label="Nº de Série" value={device.serial} icon={Barcode} />
                      <InfoRow label="IMEI" value={device.imei} icon={Barcode} />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-slate-200 shadow-sm">
                  <CardHeader className="py-4 border-b border-slate-50">
                    <CardTitle className="text-sm font-bold uppercase tracking-widest text-slate-400">Vínculo</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y divide-slate-50">
                      <InfoRow label="Cliente" value={device.cliente} icon={Info} />
                      <InfoRow label="Contrato" value={device.contrato} icon={Info} />
                      <InfoRow label="Criado em" value={format(new Date(device.createdAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })} icon={Clock} />
                      <InfoRow label="Atualizado em" value={format(new Date(device.updatedAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })} icon={Clock} />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="commands">
              <Card className="border-slate-200 shadow-sm">
                <CardContent className="p-0">
                  <CommandHistory commands={commands || []} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="locations">
              <Card className="border-slate-200 shadow-sm">
                <CardContent className="p-0">
                  <LocationHistory locations={locations || []} />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-6">
          <Card className="border-slate-200 shadow-sm overflow-hidden">
            <div className={`h-2 ${
              (device.lastBattery || 0) < 20 ? 'bg-red-500' : 
              (device.lastBattery || 0) < 60 ? 'bg-orange-500' : 'bg-green-500'
            }`} />
            <CardHeader className="bg-white">
              <CardTitle className="text-lg flex items-center gap-2">
                <Battery size={18} className="text-slate-400" /> Status Energético
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-6">
                <div className="text-5xl font-black text-slate-800 mb-2">
                  {device.lastBattery}<span className="text-2xl text-slate-400">%</span>
                </div>
                <div className="flex justify-center">
                  <Badge variant="outline" className="font-bold text-slate-500 bg-slate-50 border-slate-100">
                    Bateria Atual
                  </Badge>
                </div>
              </div>
              <div className="space-y-3 mt-4">
                <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden border border-slate-200 p-0.5">
                  <div 
                    className={`h-full rounded-full transition-all ${
                      (device.lastBattery || 0) < 20 ? 'bg-red-500' : 
                      (device.lastBattery || 0) < 60 ? 'bg-orange-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${device.lastBattery || 0}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm overflow-hidden">
             <CardHeader className="bg-white border-b border-slate-50">
              <CardTitle className="text-lg flex items-center gap-2">
                <MapPin size={18} className="text-slate-400" /> Última Localização
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {device.lastLatitude ? (
                <div>
                  <div className="bg-slate-100 h-40 flex items-center justify-center relative group">
                    <div className="absolute inset-0 bg-[url('https://api.mapbox.com/styles/v1/mapbox/light-v10/static/pin-s-l+f97316(${device.lastLongitude},${device.lastLatitude})/${device.lastLongitude},${device.lastLatitude},14,0/400x400?access_token=pk.eyJ1IjoibG92YWJsZSIsImEiOiJjbHg1YnVqZGkwMTFkMmtzYnVqZGkwMTFkIn0')] bg-cover bg-center" />
                    <div className="z-10 bg-white/90 backdrop-blur-sm p-3 rounded-xl shadow-xl border border-white flex flex-col items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <MapPin className="text-orange-500 fill-orange-200" size={24} />
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">PDA {device.patrimonio}</span>
                    </div>
                  </div>
                  <div className="p-4 space-y-3">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-slate-400">Coordenadas:</span>
                      <span className="text-slate-700 font-mono">{device.lastLatitude.toFixed(6)}, {device.lastLongitude.toFixed(6)}</span>
                    </div>
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-slate-400">Precisão:</span>
                      <span className="text-slate-700 font-bold">{device.lastAccuracy} metros</span>
                    </div>
                    <Button 
                      className="w-full bg-orange-500 hover:bg-orange-600 gap-2 shadow-lg shadow-orange-100"
                      onClick={() => window.open(`https://www.google.com/maps?q=${device.lastLatitude},${device.lastLongitude}`, '_blank')}
                    >
                      <ExternalLink size={16} /> Abrir no Google Maps
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-slate-400">
                  <MapPin className="mx-auto mb-3 opacity-20" size={48} />
                  <p className="text-sm font-medium">Nenhuma localização disponível</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

const Loader2 = ({ className, size }: { className?: string, size?: number }) => (
  <RefreshCw className={className} size={size} />
);
