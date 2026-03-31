import { TrendingUp, Users, HeadphonesIcon, Truck, ShieldCheck, Settings } from "lucide-react";

const items = [
  { icon: TrendingUp, title: "Economia Inteligente", desc: "Reduza custos com CAPEX transformando em OPEX. Pague somente pelo que usar." },
  { icon: Users, title: "Atendimento Personalizado", desc: "Equipe dedicada para entender suas necessidades e propor a melhor solução." },
  { icon: HeadphonesIcon, title: "Suporte 24/7", desc: "Assistência técnica disponível a qualquer momento para manter sua operação." },
  { icon: Truck, title: "Logística Nacional", desc: "Entrega e instalação em todo o Brasil com prazo garantido." },
  { icon: ShieldCheck, title: "Equipamentos Segurados", desc: "Todos os itens locados possuem seguro contra danos e roubo." },
  { icon: Settings, title: "Manutenção Preventiva", desc: "Programa de manutenção periódica incluso em todos os contratos." },
];

const DifferentialsSection = () => (
  <section id="diferenciais" className="py-20 bg-card">
    <div className="container">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <h2 className="text-3xl font-bold text-foreground mb-3">Por que escolher a TECH4RENT?</h2>
        <p className="text-muted-foreground">Diferenciais que fazem a diferença na sua operação</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {items.map(({ icon: Icon, title, desc }) => (
          <div key={title} className="text-center space-y-3">
            <div className="inline-flex items-center justify-center rounded-2xl bg-primary/10 p-4 mx-auto">
              <Icon className="h-7 w-7 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">{title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default DifferentialsSection;
