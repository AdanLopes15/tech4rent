import React from 'react';
import { 
  Bell, 
  MessageSquare, 
  Lock, 
  Unlock, 
  ShieldCheck, 
  ShieldOff,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { mdmApi } from '@/services/mdmApi';
import { toast } from '@/components/ui/use-toast';
import { Device, DeviceCommandType } from '@/types/mdm';
import { useState } from 'react';

interface DeviceActionsProps {
  device: Device;
  onSuccess?: () => void;
}

export const DeviceActions = ({ device, onSuccess }: DeviceActionsProps) => {
  const [loading, setLoading] = useState<string | null>(null);
  const [msgTitle, setMsgTitle] = useState('Atenção');
  const [msgText, setMsgText] = useState('Este PDA está sendo monitorado pelo Tech4Rent MDM.');
  const [isMsgOpen, setIsMsgOpen] = useState(false);

  const handleCommand = async (command: DeviceCommandType, payload?: any) => {
    setLoading(command);
    try {
      await mdmApi.sendDeviceCommand(device.id, command, payload);
      toast({
        title: "Comando enviado",
        description: "O PDA pode levar até 60 segundos para executar o comando.",
      });
      if (onSuccess) onSuccess();
      setIsMsgOpen(false);
    } catch (error) {
      toast({
        title: "Erro ao enviar comando",
        description: "Verifique a conexão e tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  const ActionButton = ({ 
    icon: Icon, 
    label, 
    command, 
    variant = "outline" as any,
    colorClass = "",
    onClick
  }: any) => (
    <Button 
      variant={variant} 
      className={`gap-2 ${colorClass}`} 
      disabled={!!loading}
      onClick={onClick || (() => handleCommand(command))}
    >
      {loading === command ? <Loader2 className="animate-spin" size={16} /> : <Icon size={16} />}
      {label}
    </Button>
  );

  return (
    <div className="flex flex-wrap gap-2">
      <ActionButton 
        icon={Bell} 
        label="Tocar Alarme" 
        command="RING" 
        colorClass="hover:bg-orange-50 hover:text-orange-600" 
      />

      <Dialog open={isMsgOpen} onOpenChange={setIsMsgOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="gap-2 hover:bg-blue-50 hover:text-blue-600">
            <MessageSquare size={16} /> Enviar Mensagem
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enviar mensagem para o PDA</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Título</Label>
              <Input value={msgTitle} onChange={(e) => setMsgTitle(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Mensagem</Label>
              <Input value={msgText} onChange={(e) => setMsgText(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button 
              className="bg-orange-500 hover:bg-orange-600"
              disabled={loading === 'SHOW_MESSAGE'}
              onClick={() => handleCommand('SHOW_MESSAGE', { title: msgTitle, message: msgText })}
            >
              {loading === 'SHOW_MESSAGE' && <Loader2 className="animate-spin mr-2" size={16} />}
              Enviar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ActionButton 
        icon={Lock} 
        label="Bloquear Tela" 
        command="LOCK" 
        colorClass="hover:bg-red-50 hover:text-red-600" 
      />

      <ActionButton 
        icon={Unlock} 
        label="Liberar Painel" 
        command="UNLOCK" 
        colorClass="hover:bg-green-50 hover:text-green-600" 
      />

      {device.isKioskMode ? (
        <ActionButton 
          icon={ShieldOff} 
          label="Desativar Kiosk" 
          command="KIOSK_OFF" 
          colorClass="hover:bg-slate-50 hover:text-slate-600" 
        />
      ) : (
        <ActionButton 
          icon={ShieldCheck} 
          label="Ativar Kiosk" 
          command="KIOSK_ON" 
          colorClass="hover:bg-purple-50 hover:text-purple-600" 
        />
      )}
    </div>
  );
};
