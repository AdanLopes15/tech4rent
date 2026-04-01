import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const CentroCusto = () => {
  return (
    <div className="space-y-6">
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-2xl">Centro de Custo</CardTitle>
          <CardDescription>Gerencie os centros de custo da sua empresa.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Em breve.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default CentroCusto;
