//src/pages/Sobre.tsx

import { useEffect, useMemo } from "react";
import { Award, Clock, Eye, Heart, MapPin, MessageCircle, PackageCheck, Shield, Target, Users, Wrench, Zap } from "lucide-react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { useStore } from "@/store";
import { renderBlock } from "@/lib/site-builder/registry";
import type { Block } from "@/lib/site-builder/types";

const defaultDescription =
  "A TECH4RENT é uma marca brasileira especializada em locação e venda de equipamentos para operações de logística, estoque e varejo. Desenvolvemos soluções robustas, pensadas para o dia a dia intenso das operações no Brasil.";

const values = [
  { icon: Shield, title: "Confiança", description: "Produtos de qualidade com garantia e suporte técnico no Brasil." },
  { icon: Zap, title: "Agilidade", description: "Atendimento rápido e entregas em todo o Brasil." },
  { icon: Users, title: "Parceria", description: "Relações de longo prazo com clientes, equipes e parceiros." },
];

const trust = [
  ["BR", "Empresa 100% brasileira"],
  ["🛠️", "Suporte técnico no Brasil"],
  ["✅", "Garantia de 1 ano"],
  ["🎯", "Atendimento técnico dedicado"],
  ["💪", "Robustez garantida na operação"],
];

const structure = [
  { title: "Entrada Tech4Rent", description: "Estrutura preparada para receber clientes e parceiros com conforto e profissionalismo." },
  { title: "Bancada de suporte", description: "Equipamentos testados e configurados antes do envio, com diagnóstico técnico e reparo." },
  { title: "Equipamentos em operação", description: "PDAs, leitores e impressoras em uso no dia a dia de centros de distribuição e operações logísticas." },
];

const Sobre = () => {
  const fetchAllData = useStore((s) => s.fetchAllData);
  const { companySettings } = useStore();
  const sitePages = useStore((s) => s.sitePages);

  useEffect(() => {
    fetchAllData(true);
  }, [fetchAllData]);

  const publishedBlocks = useMemo<Block[]>(() => (sitePages?.sobre?.published || []) as Block[], [sitePages?.sobre?.published]);
  const usePublished = publishedBlocks.length > 0;

  const fantasyName = companySettings?.fantasyName || "TECH4RENT";
  const about = companySettings?.siteContent?.about;
  const description = about?.description || defaultDescription;
  const address = companySettings?.address;
  const fullAddress = [
    address?.logradouro,
    address?.numero,
    address?.bairro,
    address?.localidade && address?.uf ? `${address.localidade} - ${address.uf}` : address?.localidade || address?.uf,
  ]
    .filter(Boolean)
    .join(", ");
  const mapUrl = fullAddress
    ? `https://maps.google.com/maps?q=${encodeURIComponent(fullAddress)}&t=&z=15&ie=UTF8&iwloc=&output=embed`
    : "";
  const whatsappUrl = companySettings?.phone
    ? `https://wa.me/55${companySettings.phone.replace(/\D/g, "")}?text=${encodeURIComponent("Olá, gostaria de falar com um especialista.")}`
    : "#contato";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main>
        {usePublished ? (
          publishedBlocks.filter((b) => b.visible !== false).map((b) => <div key={b.id}>{renderBlock(b)}</div>)
        ) : (
        <></>
        )}
        {!usePublished && (
        <></>
        )}
      {!usePublished && <></>}
      {!usePublished && <></>}
      </main>
      {!usePublished && (
        <></>
      )}
      {usePublished ? null : (
      <main>
        {/* legacy layout below kept as fallback */}
        <section className="relative overflow-hidden bg-foreground py-24 text-background md:py-32">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_28%_32%,hsl(var(--primary)/0.16),transparent_34%)]" />
          <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-background to-background/0" />
          <div className="container relative z-10 max-w-6xl">
            <p className="mb-6 text-xs font-black uppercase tracking-[0.35em] text-background/55">Desde 2020 · Rio Claro, SP</p>
            <h1 className="text-5xl font-black tracking-normal md:text-6xl">Sobre a {fantasyName}<span className="text-primary">.</span></h1>
            <p className="mt-7 max-w-2xl text-xl font-semibold text-background/72">Tecnologia e equipamentos para quem move o Brasil</p>
          </div>
        </section>

        <section className="py-24">
          <div className="container grid max-w-6xl gap-14 lg:grid-cols-[1fr_0.95fr] lg:items-center">
            <div>
              <p className="mb-5 text-xs font-black uppercase tracking-[0.35em] text-muted-foreground">Quem somos</p>
              <h2 className="text-3xl font-black leading-tight md:text-4xl">
                Uma marca brasileira <span className="block text-primary">feita para o campo de operação</span>
              </h2>
              <div className="mt-8 space-y-5 text-sm leading-relaxed text-muted-foreground md:text-base">
                <p>{description}</p>
                <p>
                  Nossos equipamentos são projetados para entregar performance, durabilidade e conectividade, atendendo desde pequenas empresas até grandes centros de distribuição.
                </p>
                <p>
                  Garantimos atendimento próximo, suporte técnico especializado e condições comerciais competitivas para empresas de todos os portes.
                </p>
              </div>
            </div>

            <div className="space-y-5">
              {[
                { icon: Target, title: "Missão", text: "Fornecer soluções tecnológicas que aceleram e simplificam operações de logística e varejo em todo o Brasil." },
                { icon: Eye, title: "Visão", text: "Ser referência nacional em equipamentos para automação de operações, reconhecida pela qualidade e atendimento." },
                { icon: Heart, title: "Propósito", text: "Empoderar empresas com tecnologia que transforma a eficiência e competitividade de suas operações." },
              ].map(({ icon: Icon, title, text }) => (
                <article key={title} className="flex gap-5 rounded-lg border border-border bg-card p-6 shadow-sm">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border bg-muted text-muted-foreground">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="font-black text-foreground">{title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{text}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="grid border-y border-border bg-background md:grid-cols-3">
          {[
            ["500+", "Clientes atendidos"],
            ["20+", "Estados atendidos"],
            ["98%", "Satisfação"],
          ].map(([value, label]) => (
            <div key={label} className="border-border py-14 text-center md:border-r last:md:border-r-0">
              <div className="text-4xl font-black text-foreground">{value}</div>
              <div className="mt-2 text-sm text-muted-foreground">{label}</div>
            </div>
          ))}
        </section>

        <section className="py-24">
          <div className="container max-w-6xl">
            <div className="mb-10 text-center">
              <p className="mb-4 text-xs font-black uppercase tracking-[0.35em] text-muted-foreground">Por dentro</p>
              <h2 className="text-3xl font-black md:text-4xl">Conheça nossa estrutura</h2>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {structure.map((item, index) => (
                <article key={item.title} className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
                  <div className="flex aspect-[1.35] items-center justify-center bg-muted">
                    <div className="text-center">
                      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        {index === 0 ? <Award className="h-8 w-8" /> : index === 1 ? <Wrench className="h-8 w-8" /> : <PackageCheck className="h-8 w-8" />}
                      </div>
                      <span className="text-2xl font-black text-muted-foreground/45">{fantasyName}</span>
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="font-black text-foreground">{item.title}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{item.description}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="duvidas" className="bg-muted py-24">
          <div className="container max-w-4xl text-center">
            <p className="mb-4 text-xs font-black uppercase tracking-[0.35em] text-muted-foreground">Confiança</p>
            <h2 className="text-3xl font-black md:text-4xl">Por que escolher a {fantasyName}?</h2>
            <div className="mx-auto mt-10 grid max-w-3xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {trust.map(([icon, text]) => (
                <div key={text} className="flex items-center gap-4 rounded-lg border border-border bg-card p-4 text-left text-sm font-bold shadow-sm">
                  <span className="text-lg">{icon}</span>
                  <span>{text}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-24">
          <div className="container max-w-5xl text-center">
            <p className="mb-4 text-xs font-black uppercase tracking-[0.35em] text-muted-foreground">Princípios</p>
            <h2 className="text-3xl font-black md:text-4xl">Nossos Valores</h2>
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {values.map(({ icon: Icon, title, description }) => (
                <article key={title} className="rounded-lg border border-border bg-card p-9 shadow-sm">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg border border-border bg-muted text-muted-foreground">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-7 font-black text-foreground">{title}</h3>
                  <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="contato" className="bg-muted py-24">
          <div className="container max-w-4xl text-center">
            <p className="mb-3 text-xs font-black uppercase tracking-[0.35em] text-muted-foreground">Localização</p>
            <h2 className="text-2xl font-black">Onde Estamos</h2>
            <div className="mx-auto mt-8 grid max-w-2xl gap-3 sm:grid-cols-2">
              <InfoCard title="Endereço" text={fullAddress || "Endereço não informado"} />
              <InfoCard title="Horário" text="Segunda a Sexta, 8h às 18h" />
              <InfoCard title="WhatsApp" text={companySettings?.phone || "Telefone não informado"} />
              <InfoCard title="Razão Social" text={`${companySettings?.name || fantasyName} — CNPJ: ${companySettings?.cnpj || ""}`} />
            </div>
            {mapUrl && (
              <div className="mx-auto mt-6 h-64 max-w-2xl overflow-hidden rounded-lg border border-border bg-card shadow-sm">
                <iframe src={mapUrl} width="100%" height="100%" style={{ border: 0 }} loading="lazy" referrerPolicy="no-referrer-when-downgrade" title="Mapa da empresa" />
              </div>
            )}
          </div>
        </section>

        <section
          className="border-b border-background/10 py-20 text-center text-background"
          style={{
            background:
              "radial-gradient(circle at 50% 0%, hsl(var(--primary) / 0.18), transparent 42%), linear-gradient(180deg, hsl(var(--foreground) / 0.98), hsl(var(--foreground) / 0.92))",
          }}
        >
          <div className="container max-w-xl">
            <h2 className="text-3xl font-black leading-tight">Pronto para modernizar sua operação?</h2>
            <p className="mt-5 text-sm text-background/70">Fale com nosso time comercial e descubra o melhor equipamento para sua necessidade.</p>
            <Button asChild className="mt-8 gap-2">
              <a href={whatsappUrl} target="_blank" rel="noreferrer">
                <MessageCircle className="h-4 w-4" /> Falar com especialista
              </a>
            </Button>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

const InfoCard = ({ title, text }: { title: string; text: string }) => (
  <div className="rounded-lg border border-border bg-card p-4 text-left shadow-sm">
    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{title}</p>
    <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{text}</p>
  </div>
);

export default Sobre;
