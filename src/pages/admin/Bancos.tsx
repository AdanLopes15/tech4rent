import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const Bancos = () => {
  return (
    <div className="space-y-6">
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-2xl">Bancos</CardTitle>
          <CardDescription>Gerencie as contas bancárias da sua empresa.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Em breve.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Bancos;
