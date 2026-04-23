import { useMemo, useState } from "react";
import { Mail, MapPin, MessageCircle, Phone, Send, Clock, ExternalLink } from "lucide-react";
import { z } from "zod";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useStore } from "@/store";
import { toast } from "sonner";
import { createContact } from "@/ai/flows/create-contact-flow";
import { renderBlock } from "@/lib/site-builder/registry";
import type { Block } from "@/lib/site-builder/types";

const contactSchema = z.object({
  name: z.string().trim().min(2, "Informe seu nome.").max(100, "Nome muito longo."),
  company: z.string().trim().max(100, "Empresa muito longa.").optional(),
  city: z.string().trim().max(100, "Cidade/estado muito longo.").optional(),
  interest: z.string().trim().min(1, "Selecione o interesse.").max(60),
  message: z.string().trim().min(5, "Escreva uma mensagem.").max(1000, "Mensagem muito longa."),
});

const buildWhatsAppUrl = (phone?: string, message = "Olá, gostaria de falar com a TECH4RENT.") => {
  const digits = phone?.replace(/\D/g, "").slice(0, 13) || "";
  return digits ? `https://wa.me/55${digits}?text=${encodeURIComponent(message.slice(0, 500))}` : "#";
};

const Contato = () => {
  const { companySettings } = useStore();
  const sitePages = useStore((s) => s.sitePages);
  const publishedBlocks = useMemo<Block[]>(() => (sitePages?.contato?.published || []) as Block[], [sitePages?.contato?.published]);
  const usePublished = publishedBlocks.length > 0;
  const address = companySettings?.address;
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ name: "", company: "", city: "", interest: "", message: "" });

  const fullAddress = useMemo(
    () =>
      [
        address?.logradouro && address?.numero ? `${address.logradouro}, ${address.numero}` : address?.logradouro,
        address?.bairro,
        address?.localidade && address?.uf ? `${address.localidade} - ${address.uf}` : address?.localidade || address?.uf,
        address?.cep,
      ]
        .filter(Boolean)
        .join(", "),
    [address],
  );

  const mapQuery = fullAddress || "Rua Samambaia, 33, Santana, Rio Claro, SP";
  const mapUrl = `https://maps.google.com/maps?q=${encodeURIComponent(mapQuery)}&t=&z=16&ie=UTF8&iwloc=&output=embed`;
  const mapsLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`;
  const whatsappUrl = buildWhatsAppUrl(companySettings?.phone);

  const handleChange = (field: keyof typeof formData) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData((current) => ({ ...current, [field]: event.target.value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsed = contactSchema.safeParse(formData);
    if (!parsed.success) {
      toast.error(parsed.error.errors[0]?.message || "Revise os campos do formulário.");
      return;
    }

    setLoading(true);
    try {
      const result = await createContact({
        name: parsed.data.name,
        email: companySettings?.email || "contato@tech4rent.com.br",
        phone: companySettings?.phone || "",
        message: [`Empresa: ${parsed.data.company || "Não informado"}`, `Cidade/Estado: ${parsed.data.city || "Não informado"}`, `Interesse: ${parsed.data.interest}`, parsed.data.message].join("\n"),
      });
      if (!result.success) throw new Error(result.message || "Não foi possível enviar a mensagem.");
      toast.success("Mensagem enviada com sucesso!");
      setFormData({ name: "", company: "", city: "", interest: "", message: "" });
    } catch (error: any) {
      toast.error(error?.message || "Ocorreu um erro ao enviar a mensagem.");
    } finally {
      setLoading(false);
    }
  };

  if (usePublished) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Navbar />
        <main>
          {publishedBlocks.filter((b) => b.visible !== false).map((b) => (
            <div key={b.id}>{renderBlock(b)}</div>
          ))}
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main>
        <section className="relative overflow-hidden border-b border-border bg-foreground py-24 text-background">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_58%_8%,hsl(var(--primary)/0.12),transparent_34%)]" />
          <div className="container relative max-w-6xl">
            <p className="text-xs font-black uppercase tracking-[0.35em] text-background/55">Fale conosco</p>
            <h1 className="mt-5 text-5xl font-black tracking-normal md:text-6xl">Contato<span className="text-primary">.</span></h1>
            <p className="mt-6 max-w-xl text-xl font-semibold leading-relaxed text-background/75">Estamos prontos para ajudar. Escolha o melhor canal para falar conosco.</p>
          </div>
        </section>

        <section className="bg-background py-24">
          <div className="container grid max-w-6xl gap-5 md:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: MessageCircle, title: "WhatsApp", subtitle: "Atendimento rápido e direto", value: companySettings?.phone || "(19) 99557-7403", action: "Iniciar conversa", href: whatsappUrl },
              { icon: Mail, title: "E-mail", subtitle: "Para orçamentos e documentos", value: companySettings?.email || "felipe@cmxglobal.com.br", action: "Enviar e-mail", href: `mailto:${companySettings?.email || "felipe@cmxglobal.com.br"}` },
              { icon: Clock, title: "Horário", subtitle: "Atendimento comercial", value: "Segunda a Sexta, 8h às 18h" },
              { icon: MapPin, title: "Localização", subtitle: "Atendemos todo o Brasil", value: fullAddress || "Rua Samambaia, 33 - Santana, Rio Claro - SP, 13500-570" },
            ].map(({ icon: Icon, title, subtitle, value, action, href }, index) => (
              <div key={title} className={`rounded-lg border bg-card p-7 shadow-sm ${index === 0 ? "border-primary/45" : "border-border"}`}>
                <div className="flex h-10 w-10 items-center justify-center rounded-md border border-border bg-muted text-primary"><Icon className="h-5 w-5" /></div>
                <h2 className="mt-6 font-black">{title}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
                <p className="mt-5 text-sm font-bold leading-relaxed">{value}</p>
                {href && <a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noreferrer" className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-primary">{action} <ExternalLink className="h-3.5 w-3.5" /></a>}
              </div>
            ))}
          </div>
        </section>

        <section className="bg-muted py-24">
          <div className="container max-w-5xl text-center">
            <p className="text-xs font-black uppercase tracking-[0.35em] text-muted-foreground">Formulário</p>
            <h2 className="mt-4 text-3xl font-black md:text-4xl">Envie sua mensagem</h2>
            <p className="mt-3 text-muted-foreground">Preencha o formulário e entraremos em contato</p>
            <div className="mx-auto mt-12 grid gap-6 text-left lg:grid-cols-[1.25fr_0.8fr]">
              <form onSubmit={handleSubmit} className="rounded-lg border border-border bg-card p-7 shadow-sm">
                <div className="grid gap-5 sm:grid-cols-2">
                  <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Nome *<Input className="mt-2" placeholder="Seu nome completo" value={formData.name} onChange={handleChange("name")} /></label>
                  <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Empresa<Input className="mt-2" placeholder="Nome da empresa" value={formData.company} onChange={handleChange("company")} /></label>
                  <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Cidade / Estado<Input className="mt-2" placeholder="Ex: São Paulo - SP" value={formData.city} onChange={handleChange("city")} /></label>
                  <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Interesse *<select className="mt-2 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" value={formData.interest} onChange={handleChange("interest")}><option value="">Selecione</option><option>Locação de equipamentos</option><option>Compra de equipamentos</option><option>Assistência técnica</option><option>Suporte comercial</option></select></label>
                </div>
                <label className="mt-5 block text-xs font-black uppercase tracking-widest text-muted-foreground">Mensagem<Textarea className="mt-2 min-h-28" placeholder="Como podemos ajudar?" value={formData.message} onChange={handleChange("message")} /></label>
                <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_0.9fr]">
                  <Button type="submit" disabled={loading} className="gap-2"><Send className="h-4 w-4" /> {loading ? "Enviando..." : "Enviar Mensagem"}</Button>
                  <Button asChild variant="outline" className="gap-2"><a href={whatsappUrl} target="_blank" rel="noreferrer"><MessageCircle className="h-4 w-4" /> Prefiro WhatsApp</a></Button>
                </div>
              </form>
              <aside className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
                <div className="p-5"><p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Localização</p><p className="mt-2 text-sm font-bold leading-relaxed">{fullAddress || "Rua Samambaia, 33 - Santana, Rio Claro - SP, 13500-570"}</p></div>
                <iframe src={mapUrl} className="h-72 w-full border-0" loading="lazy" referrerPolicy="no-referrer-when-downgrade" title="Mapa da empresa" />
                <a href={mapsLink} target="_blank" rel="noreferrer" className="m-5 inline-flex items-center gap-2 text-sm font-bold text-primary">Abrir no Maps <ExternalLink className="h-3.5 w-3.5" /></a>
              </aside>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Contato;