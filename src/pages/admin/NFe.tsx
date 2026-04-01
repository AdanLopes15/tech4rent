import { useEffect } from "react";
import { useStore } from "@/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileCheck } from "lucide-react";

const NFe = () => {
  const { fetchAllData } = useStore();
  useEffect(() => { fetchAllData(); }, [fetchAllData]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Nota Fiscal Eletrônica (NFe)</h1>
        <p className="text-muted-foreground">Gerencie suas notas fiscais eletrônicas.</p>
      </div>

      <Card className="border-border">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <FileCheck className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">Módulo NFe em Desenvolvimento</h3>
          <p className="text-sm text-muted-foreground max-w-md">
            O módulo de emissão e gestão de Notas Fiscais Eletrônicas está sendo desenvolvido. Em breve você poderá emitir, consultar e gerenciar suas NFe diretamente pelo sistema.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default NFe;
