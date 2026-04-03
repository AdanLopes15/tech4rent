import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const sections = [
  "Seção Hero (Início)", "Barra de Contato", "Produto em Destaque",
  "Vitrine de Produtos", "Diferenciais", "Sobre Nós", "Formulário de Contato"
];

const LayoutStyleTab = () => {
  const handleSave = () => {
    toast.success("Layout & Estilo salvos com sucesso!");
  };

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle>Layout & Estilo</CardTitle>
        <CardDescription>Personalize a aparência do seu site público.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Estilos das Seções */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-foreground">Estilos das Seções</h3>
          <p className="text-sm text-muted-foreground">Personalize as cores de cada seção do seu site público.</p>
          <div className="space-y-2">
            {sections.map((section) => (
              <details key={section} className="group rounded-lg border border-border">
                <summary className="flex items-center justify-between cursor-pointer px-4 py-3 text-sm font-medium text-foreground hover:bg-muted/50 rounded-lg">
                  <span className="flex items-center gap-2">
                    <span className="text-muted-foreground">◎</span>
                    {section}
                  </span>
                </summary>
                <div className="px-4 pb-4 pt-2 space-y-3 border-t border-border">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Cor de Fundo</Label>
                      <Input type="color" defaultValue="#0f172a" className="h-10 w-full" />
                    </div>
                    <div className="space-y-2">
                      <Label>Cor do Texto</Label>
                      <Input type="color" defaultValue="#f8fafc" className="h-10 w-full" />
                    </div>
                    <div className="space-y-2">
                      <Label>Cor de Destaque</Label>
                      <Input type="color" defaultValue="#f97316" className="h-10 w-full" />
                    </div>
                  </div>
                </div>
              </details>
            ))}
          </div>
        </div>

        {/* Tipografia Global */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-foreground">Tipografia Global</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-border">
              <CardContent className="p-4 space-y-4">
                <h4 className="font-semibold text-foreground">Títulos</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tamanho da Fonte (rem)</Label>
                    <Input defaultValue="2,25" />
                  </div>
                  <div className="space-y-2">
                    <Label>Peso da Fonte</Label>
                    <select className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                      <option value="bold">Bold</option>
                      <option value="semibold">Semibold</option>
                      <option value="normal">Normal</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-border">
              <CardContent className="p-4 space-y-4">
                <h4 className="font-semibold text-foreground">Corpo do Texto</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tamanho da Fonte (rem)</Label>
                    <Input defaultValue="1" />
                  </div>
                  <div className="space-y-2">
                    <Label>Peso da Fonte</Label>
                    <select className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                      <option value="normal">Normal</option>
                      <option value="semibold">Semibold</option>
                      <option value="bold">Bold</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Ordem das Seções */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-foreground">Ordem das Seções do Site</h3>
          <p className="text-sm text-muted-foreground">Arraste para reordenar as seções. Esta funcionalidade está temporariamente desativada.</p>
          <div className="space-y-2 max-w-sm">
            {sections.map((section) => (
              <div key={section} className="flex items-center gap-2 rounded-lg bg-muted/50 border border-border px-4 py-2.5 text-sm font-medium text-foreground">
                <span className="text-muted-foreground">⠿</span>
                {section}
              </div>
            ))}
          </div>
        </div>

        <Button onClick={handleSave}>Salvar Layout & Estilo</Button>
      </CardContent>
    </Card>
  );
};

export default LayoutStyleTab;
