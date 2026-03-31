import { Building2, Award, Users, Calendar } from "lucide-react";

const stats = [
  { icon: Calendar, value: "10+", label: "Anos de Mercado" },
  { icon: Users, value: "500+", label: "Clientes Atendidos" },
  { icon: Building2, value: "2000+", label: "Equipamentos" },
  { icon: Award, value: "99%", label: "Satisfação" },
];

const AboutSection = () => (
  <section id="sobre" className="py-20 bg-background">
    <div className="container">
      <div className="grid lg:grid-cols-2 gap-12 items-center">
        <div className="space-y-6">
          <h2 className="text-3xl font-bold text-foreground">Sobre a TECH4RENT</h2>
          <p className="text-muted-foreground leading-relaxed">
            A TECH4RENT é referência em locação e venda de equipamentos de tecnologia.
            Com mais de uma década de experiência, oferecemos soluções completas para
            empresas que buscam eficiência, economia e tecnologia de ponta.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            Nossa missão é simplificar o acesso à tecnologia, permitindo que nossos
            clientes foquem no que realmente importa: o crescimento do seu negócio.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {stats.map(({ icon: Icon, value, label }) => (
            <div key={label} className="rounded-xl border border-border bg-card p-6 text-center space-y-2">
              <Icon className="h-6 w-6 text-primary mx-auto" />
              <div className="text-3xl font-bold text-foreground">{value}</div>
              <div className="text-sm text-muted-foreground">{label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </section>
);

export default AboutSection;
