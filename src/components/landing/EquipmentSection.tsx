import { Monitor, Printer, Server, Laptop, Smartphone, HardDrive } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const equipments = [
  { icon: Monitor, name: "Monitores", desc: "Monitores profissionais de alta resolução", price: "A partir de R$ 150/mês", tag: "Popular" },
  { icon: Laptop, name: "Notebooks", desc: "Notebooks corporativos de alta performance", price: "A partir de R$ 250/mês", tag: "Destaque" },
  { icon: Printer, name: "Impressoras", desc: "Impressoras multifuncionais laser e jato de tinta", price: "A partir de R$ 200/mês", tag: null },
  { icon: Server, name: "Servidores", desc: "Servidores rack e torre para data centers", price: "A partir de R$ 800/mês", tag: null },
  { icon: Smartphone, name: "Tablets", desc: "Tablets para uso corporativo e eventos", price: "A partir de R$ 120/mês", tag: null },
  { icon: HardDrive, name: "Storage", desc: "Soluções de armazenamento NAS e SAN", price: "A partir de R$ 500/mês", tag: null },
];

const EquipmentSection = () => {
  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section id="equipamentos" className="py-20 bg-background">
      <div className="container">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-3">Nossos Equipamentos</h2>
          <p className="text-muted-foreground">
            Catálogo completo de equipamentos disponíveis para locação e venda
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {equipments.map(({ icon: Icon, name, desc, price, tag }) => (
            <Card key={name} className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-border">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="rounded-xl bg-primary/10 p-3">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  {tag && <Badge variant="secondary" className="bg-primary/10 text-primary border-0">{tag}</Badge>}
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{name}</h3>
                <p className="text-sm text-muted-foreground mb-4">{desc}</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-primary">{price}</span>
                  <Button variant="ghost" size="sm" onClick={() => scrollTo("contato")} className="text-primary hover:text-primary">
                    Orçar →
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default EquipmentSection;
