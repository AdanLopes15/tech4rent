import { useState } from "react";
import { Send, MapPin, Phone, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

const ContactSection = () => {
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      toast.success("Orçamento enviado com sucesso! Entraremos em contato em breve.");
      (e.target as HTMLFormElement).reset();
      setLoading(false);
    }, 1000);
  };

  return (
    <section id="contato" className="py-20 bg-card">
      <div className="container">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-3">Solicite seu Orçamento</h2>
          <p className="text-muted-foreground">
            Preencha o formulário e nossa equipe entrará em contato rapidamente
          </p>
        </div>

        <div className="grid lg:grid-cols-5 gap-8 max-w-5xl mx-auto">
          <Card className="lg:col-span-3 border-border">
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input placeholder="Nome completo" required />
                  <Input placeholder="Empresa" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input type="email" placeholder="E-mail" required />
                  <Input placeholder="Telefone / WhatsApp" required />
                </div>
                <Input placeholder="Assunto" />
                <Textarea placeholder="Descreva os equipamentos que precisa, quantidade e período desejado..." rows={4} required />
                <Button type="submit" className="w-full gap-2" disabled={loading}>
                  <Send className="h-4 w-4" />
                  {loading ? "Enviando..." : "Enviar Solicitação"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="lg:col-span-2 space-y-6">
            {[
              { icon: MapPin, title: "Endereço", text: "São Paulo, SP - Brasil" },
              { icon: Phone, title: "Telefone", text: "(11) 99999-9999" },
              { icon: Mail, title: "E-mail", text: "contato@tech4rent.com.br" },
            ].map(({ icon: Icon, title, text }) => (
              <div key={title} className="flex items-start gap-4">
                <div className="rounded-lg bg-primary/10 p-2.5">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{title}</h3>
                  <p className="text-sm text-muted-foreground">{text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
