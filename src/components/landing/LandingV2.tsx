// src/components/landing/LandingV2.tsx
// Landing recriada conforme o código de referência enviado pelo cliente.

import { useState, useEffect, useMemo } from "react";
import { useStore } from "@/store";
import { ChevronLeft, ChevronRight } from "lucide-react";
import heroDevices from "@/assets/landing/devices-only.png";
import warehouseBg from "@/assets/landing/hero-bg-warehouse.jpg";
import iconAgilidade from "@/assets/landing/icon-agilidade.png";
import iconErros from "@/assets/landing/icon-erros.png";
import iconSeguranca from "@/assets/landing/icon-seguranca.png";
import iconResultados from "@/assets/landing/icon-resultados.png";
import prodColetor from "@/assets/landing/prod-coletor.png";
import prodLeitor from "@/assets/landing/prod-leitor.png";
import prodImpressora from "@/assets/landing/prod-impressora.png";
import prodEtiquetas from "@/assets/landing/prod-etiquetas.png";
import mapaBrasil from "@/assets/landing/mapa-brasil.png";

const buildWa = (phone?: string, msg = "Olá, gostaria de falar com um especialista.") => {
  const d = phone?.replace(/\D/g, "") || "5511945504752";
  return `https://wa.me/${d}?text=${encodeURIComponent(msg)}`;
};

const heroBenefits = [
  { title: "MAIS AGILIDADE", text: "Processos mais rápidos e eficientes.", icon: iconAgilidade },
  { title: "MENOS ERROS", text: "Dados precisos e operações mais seguras.", icon: iconErros },
  { title: "MAIS SEGURANÇA", text: "Equipamentos robustos e confiáveis.", icon: iconSeguranca },
  { title: "MAIS RESULTADOS", text: "Soluções que elevam o desempenho.", icon: iconResultados },
];

const staticProducts = [
  { title: "Coletor TC60", image: prodColetor, items: ["Android 14", "Scanner 2D", "IP67", "Wi-Fi / 4G"], button: "Alugar agora" },
  { title: "Leitor Pistola", image: prodLeitor, items: ["Alta velocidade", "Precisão industrial", "Plug & Play", "Leitura 1D e 2D"], button: "Solicitar orçamento" },
  { title: "Impressoras Térmicas", image: prodImpressora, items: ["Etiquetas rápida", "Alta durabilidade", "Integração fácil", "Diversos modelos"], button: "Solicitar orçamento" },
  { title: "Etiquetas Resma", image: prodEtiquetas, items: ["Caixa com 10.000 unidades", "Alta qualidade", "Compatível com mercado", "Diversos tamanhos"], button: "Comprar agora" },
];

const aboutItems: Array<[string, string, string]> = [
  ["EFICIÊNCIA", "Equipamentos de alta performance e processos mais rápidos.", iconAgilidade],
  ["CONTROLE", "Gestão inteligente e dados precisos na sua operação.", iconErros],
  ["SEGURANÇA", "Equipamentos robustos, testados e confiáveis.", iconSeguranca],
  ["ESCALA", "Soluções que crescem junto com sua empresa.", iconResultados],
];

const benefitsItems: Array<[string, string, string]> = [
  ["AGILIDADE", "Processos mais rápidos e automatizados.", iconAgilidade],
  ["PRECISÃO", "Redução de erros e retrabalhos.", iconErros],
  ["SEGURANÇA", "Equipamentos resistentes para o dia a dia.", iconSeguranca],
  ["ESCALABILIDADE", "Soluções prontas para acompanhar seu crescimento.", iconResultados],
];

const clientStats: Array<[string, string]> = [
  ["+300", "Empresas atendidas"],
  ["Diversos", "Segmentos atendidos"],
  ["Operações", "Logísticas ativas"],
  ["Parceiros", "Em constante crescimento"],
];

const LandingV2 = () => {
  const { companySettings, catalogItems, equipments, fetchAllData } = useStore();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  
  useEffect(() => {
    fetchAllData(true);
  }, [fetchAllData]);

  const showcaseProducts = useMemo(() => {
    // 1. Itens publicados do catálogo
    const fromCatalog = (catalogItems || [])
      .filter(item => item.published)
      .map(item => ({
        id: item.id,
        name: item.name || item.title || "Equipamento",
        heroImageUrl: item.heroImageUrl || item.imageUrl || "/placeholder.svg",
        items: item.specifications || item.tags?.map((t: any) => t.label) || ["Qualidade Garantida"],
        buttonLabel: "Solicitar Orçamento",
        show_on_home: !!item.show_on_home,
        show_on_landing: !!item.show_on_landing
      }));

    const catalogEquipmentIds = new Set((catalogItems || []).map(item => item.equipmentId).filter(Boolean));
    
    // 2. Equipamentos (sem anúncio personalizado)
    const fromEquipments = (equipments || [])
      .filter(e => !catalogEquipmentIds.has(e.id))
      .map(e => ({
        id: e.id,
        name: e.name || "Equipamento",
        heroImageUrl: e.imageUrl || (e.imageUrls && e.imageUrls[0]) || "/placeholder.svg",
        items: ["Pronto para operação", "Alta durabilidade"],
        buttonLabel: "Solicitar Orçamento",
        show_on_home: !!e.show_on_home,
        show_on_landing: !!e.show_on_landing
      }));
    
    // 3. Unir e filtrar apenas os marcados para vitrine
    const combined = [...fromCatalog, ...fromEquipments];
    const filtered = combined.filter(p => p.show_on_landing || p.show_on_home);

    // 4. Fallback para estáticos se não houver nenhum marcado
    const final = filtered.length > 0 ? filtered : staticProducts.map((p, i) => ({
      id: `static-${i}`,
      name: p.title,
      heroImageUrl: p.image,
      items: p.items,
      buttonLabel: p.button,
      show_on_home: true,
      show_on_landing: true
    }));

    return final;
  }, [catalogItems, equipments]);

  // Carrossel Automático
  useEffect(() => {
    if (showcaseProducts.length > 4 && !isPaused) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % showcaseProducts.length);
      }, 4000); // 4 segundos
      return () => clearInterval(interval);
    }
  }, [showcaseProducts.length, isPaused]);
  
  const WA = buildWa(companySettings?.phone);

  const nextSlide = () => {
    if (showcaseProducts.length > 4) {
      setCurrentIndex((prev) => (prev + 1) % showcaseProducts.length);
      setIsPaused(true);
      setTimeout(() => setIsPaused(false), 5000);
    }
  };

  const prevSlide = () => {
    if (showcaseProducts.length > 4) {
      setCurrentIndex((prev) => (prev - 1 + showcaseProducts.length) % showcaseProducts.length);
      setIsPaused(true);
      setTimeout(() => setIsPaused(false), 5000);
    }
  };

  // Determina os 4 produtos visíveis no carrossel
  const visibleProducts = showcaseProducts.length <= 4 
      ? showcaseProducts 
      : [...showcaseProducts, ...showcaseProducts].slice(currentIndex, currentIndex + 4);

  return (
    <div className="bg-[#05070D] text-white font-sans">
      {/* HERO */}
      <section id="inicio" className="relative overflow-hidden">
        <img src={warehouseBg} alt="" className="absolute inset-0 h-full w-full object-cover opacity-70" />
        <div className="absolute inset-0 bg-[#05070D]/75" />
        <div className="absolute left-0 top-32 h-[420px] w-[260px] bg-[#1E88E5]/10 blur-[90px]" />
        <div className="absolute right-0 top-28 h-[460px] w-[320px] bg-[#43B02A]/10 blur-[100px]" />

        <div className="relative z-10 mx-auto grid min-h-[500px] max-w-[1280px] items-center gap-12 px-6 py-12 lg:grid-cols-2">
          <div>
            <h1 className="text-5xl font-black uppercase leading-[1.05] md:text-7xl">
              Equipamentos <br />
              que <span className="text-[#43B02A]">movem</span> <br />
              <span className="text-[#1E88E5]">resultados.</span>
            </h1>
            <p className="mt-7 max-w-[560px] text-lg leading-relaxed text-white/80 md:text-xl">
              Locação de equipamentos e soluções inteligentes para escalar sua operação logística com eficiência e controle.
            </p>
            <div className="mt-9 flex flex-wrap gap-5">
              <a
                href={WA}
                target="_blank"
                rel="noreferrer"
                className="rounded-xl bg-[#43B02A] px-7 py-4 text-sm font-black uppercase text-white shadow-[0_0_30px_rgba(67,176,42,0.45)] transition hover:scale-105"
              >
                Fale com um especialista
              </a>
              <a
                href="#produtos"
                className="rounded-xl border border-[#1E88E5] px-7 py-4 text-sm font-black uppercase text-white transition hover:bg-[#1E88E5]/20"
              >
                Ver equipamentos
              </a>
            </div>
          </div>

          <div className="relative flex aspect-square w-full max-w-[420px] items-center justify-center justify-self-center lg:max-w-[500px]">
            <div className="absolute h-[71%] w-[71%] rounded-full border-4 border-[#1E88E5] shadow-[0_0_80px_rgba(30,136,229,0.7)]" />
            <div className="absolute h-[67%] w-[67%] rounded-full border-r-4 border-t-4 border-[#43B02A] shadow-[0_0_80px_rgba(67,176,42,0.5)]" />
            <img
              src={heroDevices}
              alt="Equipamentos Tech4Rent"
              className="relative z-10 w-full max-w-full object-contain drop-shadow-[0_25px_40px_rgba(0,0,0,0.55)] animate-[float_5s_ease-in-out_infinite]"
            />
          </div>


        </div>

        {/* Barra de benefícios */}
        <div className="relative z-10 mx-auto max-w-[1280px] px-6 pb-2">
          <div className="grid gap-6 rounded-2xl border border-white/10 bg-black/35 p-6 backdrop-blur-md md:grid-cols-4">
            {heroBenefits.map((item, i) => (
              <div
                key={item.title}
                className={`flex items-center gap-4 ${i < heroBenefits.length - 1 ? "md:border-r md:border-white/10 md:pr-4" : ""}`}
              >
                <div className="flex shrink-0 items-center justify-center h-16 w-16">
                  <img 
                    src={item.icon} 
                    alt="" 
                    className="max-h-full max-w-full object-contain" 
                  />
                </div>
                <div>
                  <h3 className="text-base font-black uppercase text-[#1E88E5]">{item.title}</h3>
                  <p className="mt-1 text-sm text-white/75">{item.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRODUTOS */}
      <section id="produtos" className="border-t border-white/10 px-6 py-20">
        <div className="mx-auto max-w-[1280px]">
          <p className="text-center text-sm font-black uppercase tracking-[0.25em] text-[#43B02A]">
            Nossos equipamentos
          </p>
          <h2 className="mt-3 text-center text-4xl font-black uppercase md:text-5xl">Vitrine de produtos</h2>

          <div 
            className="relative mt-12 group"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            {showcaseProducts.length > 4 && (
              <>
                <button 
                  onClick={prevSlide}
                  className="absolute -left-4 top-1/2 z-20 -translate-y-1/2 rounded-full bg-[#1E88E5] p-2 text-white shadow-lg transition hover:scale-110 lg:-left-6"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button 
                  onClick={nextSlide}
                  className="absolute -right-4 top-1/2 z-20 -translate-y-1/2 rounded-full bg-[#1E88E5] p-2 text-white shadow-lg transition hover:scale-110 lg:-right-6"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            )}

            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4 overflow-hidden">
              {visibleProducts.map((p, idx) => (
                <article
                  key={`${p.id}-${idx}`}
                  className="group flex min-h-[520px] flex-col rounded-2xl border border-white/10 bg-white/[0.04] p-6 transition-all duration-500 hover:-translate-y-2 hover:border-[#1E88E5]/70 hover:shadow-[0_0_40px_rgba(30,136,229,0.18)]"
                >
                  <div className="flex h-[220px] items-center justify-center">
                    <img
                      src={p.heroImageUrl}
                      alt={p.name}
                      className="max-h-[210px] w-full object-contain transition duration-300 group-hover:scale-105"
                    />
                  </div>
                  <h3 className="mt-6 text-xl font-black uppercase">{p.name}</h3>
                  <ul className="mt-5 space-y-3">
                    {(p.items || []).slice(0, 4).map((it: any, i: number) => (
                      <li key={i} className="flex items-center gap-3 text-sm text-white/80">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full border border-[#43B02A] text-xs text-[#43B02A]">
                          ✓
                        </span>
                        {typeof it === 'string' ? it : it.label || it.value}
                      </li>
                    ))}
                  </ul>
                  <a
                    href={WA}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-auto block rounded-lg border border-[#43B02A] px-5 py-3 text-center text-sm font-black uppercase text-[#43B02A] transition hover:bg-[#43B02A] hover:text-white"
                  >
                    {p.buttonLabel}
                  </a>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* QUEM SOMOS */}
      <section id="quem-somos" className="border-t border-white/10 px-6 py-24 bg-[#05070D]">
        <div className="mx-auto max-w-[1280px]">
          <div className="grid gap-16 lg:grid-cols-[0.8fr_1.2fr] items-center">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.3em] text-[#43B02A] mb-4">SOBRE NÓS</p>
              <h2 className="text-5xl md:text-6xl font-black uppercase leading-[1.1]">
                QUEM É A <br />
                <span className="text-white">TECH</span><span className="text-[#43B02A]">4</span><span className="text-white">RENT</span>
              </h2>
              <div className="mt-8 space-y-6 text-lg text-white/70 leading-relaxed max-w-[540px]">
                <p>
                  A <span className="text-white font-bold">Tech4Rent</span> nasceu com o propósito de transformar a forma como as empresas lidam com tecnologia operacional.
                </p>
                <p>
                  Somos especialistas em <span className="text-[#1E88E5] font-bold">locação de equipamentos</span> e soluções inteligentes que conectam hardware de alta performance a processos mais ágeis e econômicos.
                </p>
                <p>
                  Nossa missão é eliminar a burocracia e os altos custos de aquisição, permitindo que sua operação foque no que realmente importa: <span className="text-white font-bold">resultados extraordinários.</span>
                </p>
              </div>
              <div className="mt-10">
                <a
                  href={WA}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-8 py-4 text-sm font-black uppercase text-white transition hover:bg-white/10 hover:border-white/40"
                >
                  Saiba mais sobre nós
                </a>
              </div>
            </div>

            <div className="relative flex w-full items-center justify-center overflow-hidden rounded-3xl border border-white/10 shadow-2xl min-h-[300px] bg-white/5">
              <img
                src="/lovable-uploads/47746522-0d50-4820-8e10-9c2999c07153.png"
                alt="Tech4Rent Soluções"
                className="max-w-full object-contain transition-transform duration-700 hover:scale-105"
                onLoad={(e) => console.log('Image loaded successfully:', e.currentTarget.src)}
                onError={(e) => console.log('Image failed to load:', e.currentTarget.src)}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
            </div>
          </div>

          <div className="mt-24 grid grid-cols-2 md:grid-cols-4 gap-8 py-12 border-y border-white/5">
            {clientStats.map(([value, label]) => (
              <div key={label} className="text-center">
                <div className="text-4xl md:text-5xl font-black text-[#1E88E5] mb-2">{value}</div>
                <div className="text-xs font-bold uppercase tracking-widest text-white/40">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* A seção de Abrangência foi removida conforme solicitação */}

      {/* SOBRE OS EQUIPAMENTOS */}
      <section id="equipamentos" className="border-t border-white/10 px-6 py-20">
        <div className="mx-auto max-w-[1280px]">
          <p className="text-center text-sm font-black uppercase tracking-[0.25em] text-[#43B02A]">
            Sobre os equipamentos
          </p>
          <h2 className="mt-3 text-center text-3xl font-black uppercase md:text-4xl">
            Tecnologia que impulsiona sua operação
          </h2>
          <div className="mt-10 grid gap-6 md:grid-cols-4">
            {benefitsItems.map(([title, text, icon]) => (
              <div key={title} className="rounded-2xl border border-white/10 bg-white/[0.04] p-7 text-center">
                <img src={icon} alt="" className="mx-auto h-20 w-20 object-contain" />
                <h3 className="mt-4 font-black uppercase">{title}</h3>
                <p className="mt-2 text-sm text-white/65">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CLIENTES */}
      <section id="clientes" className="border-t border-white/10 px-6 py-16">
        <div className="mx-auto max-w-[1280px]">
          <p className="text-center text-sm font-black uppercase tracking-[0.25em] text-[#43B02A]">Clientes atendidos</p>
          <h2 className="mt-3 text-center text-3xl font-black uppercase md:text-4xl">
            Empresas que confiam na Tech<span className="text-[#43B02A]">4</span>Rent
          </h2>

          <div className="relative mt-10 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.035] py-8">
            <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-background to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-background to-transparent" />

            <div className="flex w-max animate-[marquee_30s_linear_infinite] gap-16 px-8">
              {[...Array(2)].map((_, dup) => (
                <div key={dup} className="flex shrink-0 items-center gap-16">
                  {["RPM", "SHOPEE", "MERCADO LIVRE", "MAGAZINE LUIZA", "DHL", "DAFITI", "GN SERVIÇOS"].map((brand) => (
                    <span
                      key={`${dup}-${brand}`}
                      className="whitespace-nowrap text-2xl font-black uppercase tracking-[0.18em] text-white/55 transition hover:text-white md:text-3xl"
                    >
                      {brand}
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>


      {/* DÚVIDAS / FAQ */}
      <section id="duvidas" className="border-t border-white/10 px-6 py-20">
        <div className="mx-auto max-w-[1100px]">
          <p className="text-center text-sm font-black uppercase tracking-[0.25em] text-[#43B02A]">Dúvidas frequentes</p>
          <h2 className="mt-3 text-center text-3xl font-black uppercase md:text-4xl">
            Tire suas dúvidas sobre a Tech<span className="text-[#43B02A]">4</span>Rent
          </h2>
          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {[
              ["Como funciona a locação?", "Você escolhe os equipamentos, definimos o prazo e entregamos prontos para uso, com suporte técnico incluso."],
              ["Quais são os prazos de entrega?", "Trabalhamos com entrega rápida em todo o Brasil. O prazo varia conforme a região, mas a maioria dos pedidos é despachada em até 48h."],
              ["Posso comprar em vez de alugar?", "Sim. Atendemos tanto locação quanto venda de equipamentos novos e seminovos."],
              ["Tem suporte técnico durante o contrato?", "Sim. Suporte especializado em horário comercial e atendimento emergencial conforme contrato."],
              ["Quais formas de pagamento aceitam?", "Boleto, transferência, PIX e cartão. Para contratos recorrentes, faturamento mensal."],
              ["Atendem todo o Brasil?", "Sim. Estrutura preparada para operações logísticas em qualquer região do país."],
            ].map(([q, a]) => (
              <details
                key={q}
                className="group rounded-2xl border border-white/10 bg-white/[0.04] p-5 transition hover:border-[#43B02A]/40"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-bold text-white">
                  {q}
                  <span className="text-2xl text-[#43B02A] transition group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-white/70">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CONTATO — MAPA + FORMULÁRIO */}
      <section id="contato" className="border-t border-white/10 px-6 py-20">
        <div className="mx-auto max-w-[1280px]">
          <p className="text-center text-sm font-black uppercase tracking-[0.25em] text-[#43B02A]">Contato</p>
          <h2 className="mt-3 text-center text-3xl font-black uppercase md:text-4xl">Fale com a Tech<span className="text-[#43B02A]">4</span>Rent</h2>
          <p className="mx-auto mt-3 max-w-[640px] text-center text-white/70">
            Preencha o formulário ou venha nos visitar. Nossa equipe responde em até 24h úteis.
          </p>

          <div className="mt-12 grid gap-8 lg:grid-cols-2">
            {/* Mapa */}
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]">
              <iframe
                title="Localização Tech4Rent"
                src="https://www.google.com/maps?q=Avenida+Paulista,+S%C3%A3o+Paulo,+SP&output=embed"
                className="h-full min-h-[460px] w-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            </div>

            {/* Formulário */}
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                const nome = fd.get("nome") as string;
                const email = fd.get("email") as string;
                const telefone = fd.get("telefone") as string;
                const mensagem = fd.get("mensagem") as string;

                try {
                  // Envia para o admin do sistema
                  await useStore.getState().addSiteContact({
                    nome,
                    email,
                    telefone,
                    mensagem,
                    origem: "Landing Page V2"
                  });

                  import("sonner").then(({ toast }) => {
                    toast.success("Sua mensagem foi enviada! Em breve vamos retornar o contato.");
                  });

                  // Limpa o formulário
                  (e.target as HTMLFormElement).reset();

                  // Opcional: mantém o comportamento do WhatsApp se desejado, 
                  // mas a solicitação foca no admin agora.
                  // const text = `Olá, sou ${nome}.%0AE-mail: ${email}%0ATelefone: ${telefone}%0A%0A${mensagem}`;
                  // window.open(`${WA.split("?")[0]}?text=${text}`, "_blank");
                } catch (error) {
                  import("sonner").then(({ toast }) => {
                    toast.error("Erro ao enviar mensagem. Tente novamente.");
                  });
                }
              }}
              className="grid gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-6"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="text-xs font-bold uppercase tracking-wider text-white/60">Nome</span>
                  <input
                    name="nome"
                    required
                    className="mt-2 w-full rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-[#43B02A] focus:outline-none"
                    placeholder="Seu nome"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-bold uppercase tracking-wider text-white/60">Telefone</span>
                  <input
                    name="telefone"
                    required
                    className="mt-2 w-full rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-[#43B02A] focus:outline-none"
                    placeholder="(11) 99999-9999"
                  />
                </label>
              </div>
              <label className="block">
                <span className="text-xs font-bold uppercase tracking-wider text-white/60">E-mail</span>
                <input
                  name="email"
                  type="email"
                  required
                  className="mt-2 w-full rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-[#43B02A] focus:outline-none"
                  placeholder="seu@email.com"
                />
              </label>
              <label className="block">
                <span className="text-xs font-bold uppercase tracking-wider text-white/60">Mensagem</span>
                <textarea
                  name="mensagem"
                  required
                  rows={5}
                  className="mt-2 w-full rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-[#43B02A] focus:outline-none"
                  placeholder="Como podemos ajudar?"
                />
              </label>
              <button
                type="submit"
                className="mt-2 rounded-xl bg-[#43B02A] px-6 py-4 text-sm font-black uppercase text-white shadow-[0_0_30px_rgba(67,176,42,0.45)] transition hover:scale-[1.02]"
              >
                Enviar mensagem
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
};

const MiniItem = ({ title, color }: { title: string; color: string }) => (
  <div className="rounded-xl border border-white/10 bg-white/[0.035] p-4">
    <div className="mb-3 h-3 w-12 rounded-full" style={{ backgroundColor: color }} />
    <p className="text-sm font-bold uppercase text-white/75">{title}</p>
  </div>
);

export default LandingV2;
