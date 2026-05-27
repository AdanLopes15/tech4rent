import React from 'react';
import { DeviceCommand } from '@/types/mdm';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const CommandHistory = ({ commands }: { commands: DeviceCommand[] }) => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'EXECUTED': return <Badge className="bg-green-500">Executado</Badge>;
      case 'PENDING': return <Badge className="bg-yellow-500">Pendente</Badge>;
      case 'FAILED': return <Badge variant="destructive">Falhou</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="rounded-md border border-slate-200">
      <Table>
        <TableHeader className="bg-slate-50">
          <TableRow>
            <TableHead>Comando</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Payload</TableHead>
            <TableHead>Criado em</TableHead>
            <TableHead>Executado em</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {commands.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-8 text-slate-400">
                Nenhum comando enviado ainda.
              </TableCell>
            </TableRow>
          ) : (
            commands.map((cmd) => (
              <TableRow key={cmd.id}>
                <TableCell className="font-bold text-slate-700">{cmd.command}</TableCell>
                <TableCell>
                  <div>
                    {getStatusBadge(cmd.status)}
                    {cmd.error && <p className="text-[10px] text-red-500 mt-1">{cmd.error}</p>}
                  </div>
                </TableCell>
                <TableCell className="text-xs font-mono max-w-xs truncate">
                  {cmd.payload ? JSON.stringify(cmd.payload) : '—'}
                </TableCell>
                <TableCell className="text-slate-500">
                  {format(new Date(cmd.createdAt), 'dd/MM HH:mm', { locale: ptBR })}
                </TableCell>
                <TableCell className="text-slate-500">
                  {cmd.executedAt ? format(new Date(cmd.executedAt), 'dd/MM HH:mm', { locale: ptBR }) : '—'}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};
