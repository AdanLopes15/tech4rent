//src/pages/PoliticaDevolucao.tsx

import { Mail, MessageCircle } from "lucide-react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { useStore } from "@/store";

const buildWhatsAppUrl = (phone?: string) => {
  const digits = phone?.replace(/\D/g, "") || "";
  const message = "Olá, gostaria de informações sobre devolução/troca.";
  return digits ? `https://wa.me/55${digits}?text=${encodeURIComponent(message)}` : "#";
};

const PoliticaDevolucao = () => {
  const { companySettings } = useStore();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main>
        <section className="bg-foreground py-20 text-background">
          <div className="container max-w-4xl">
            <h1 className="text-4xl font-black tracking-normal md:text-5xl">Política de Devolução e Troca</h1>
            <p className="mt-3 text-lg text-background/75">Transparência e segurança na sua compra</p>
          </div>
        </section>

        <section className="py-16 md:py-20">
          <div className="container max-w-3xl space-y-10 text-foreground">
            <div>
              <h2 className="text-2xl font-black">1. Direito de Arrependimento</h2>
              <p className="mt-3 leading-relaxed text-muted-foreground">
                De acordo com o <strong className="text-foreground">Art. 49 do Código de Defesa do Consumidor</strong>, o cliente pode desistir da compra em até{" "}
                <strong className="text-foreground">7 (sete) dias corridos</strong> após o recebimento do produto, sem necessidade de justificativa. O produto deve ser devolvido em sua embalagem original, sem sinais de uso, acompanhado de todos os acessórios e nota fiscal.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-black">2. Produtos com Defeito</h2>
              <p className="mt-3 leading-relaxed text-muted-foreground">
                Caso o produto apresente defeito de fabricação, o cliente tem até <strong className="text-foreground">30 (trinta) dias</strong> para solicitar a troca ou reparo. Após análise técnica, oferecemos as seguintes opções:
              </p>
              <ul className="mt-3 list-disc space-y-1 pl-6 text-muted-foreground">
                <li>Substituição por produto idêntico ou similar</li>
                <li>Reparo do equipamento sem custo</li>
                <li>Reembolso integral do valor pago</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-black">3. Como Solicitar a Devolução ou Troca</h2>
              <p className="mt-3 leading-relaxed text-muted-foreground">Para iniciar o processo, entre em contato com nossa equipe informando:</p>
              <ul className="mt-3 list-disc space-y-1 pl-6 text-muted-foreground">
                <li>Número do pedido ou nota fiscal</li>
                <li>Motivo da devolução/troca</li>
                <li>Fotos do produto (em caso de defeito)</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-black">4. Condições para Devolução</h2>
              <ul className="mt-3 list-disc space-y-1 pl-6 text-muted-foreground">
                <li>Produto na embalagem original, sem sinais de uso</li>
                <li>Todos os acessórios inclusos (carregador, cabos, manuais, etc.)</li>
                <li>Nota fiscal de compra</li>
                <li>Solicitação dentro do prazo estipulado</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-black">5. Frete de Devolução</h2>
              <p className="mt-3 leading-relaxed text-muted-foreground">
                Em caso de <strong className="text-foreground">arrependimento</strong>, o frete de devolução é por conta do cliente. Para produtos com{" "}
                <strong className="text-foreground">defeito de fabricação</strong>, a Tech4Rent arca com os custos de envio.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-black">6. Reembolso</h2>
              <p className="mt-3 leading-relaxed text-muted-foreground">
                O reembolso será realizado na mesma forma de pagamento utilizada na compra, em até <strong className="text-foreground">10 (dez) dias úteis</strong> após o recebimento e conferência do produto devolvido.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-black">7. Garantia</h2>
              <p className="mt-3 leading-relaxed text-muted-foreground">
                Todos os nossos produtos possuem <strong className="text-foreground">garantia de 1 (um) ano</strong> contra defeitos de fabricação, conforme especificado na página de cada produto. A garantia não cobre danos por mau uso, quedas acidentais ou uso indevido.
              </p>
            </div>

            <div className="rounded-lg border border-border bg-card p-6">
              <h3 className="text-lg font-black">Precisa de ajuda?</h3>
              <p className="mt-2 text-sm text-muted-foreground">Entre em contato com nossa equipe para solicitar uma devolução ou tirar dúvidas.</p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Button asChild className="gap-2">
                  <a href={buildWhatsAppUrl(companySettings?.phone)} target="_blank" rel="noreferrer">
                    <MessageCircle className="h-4 w-4" /> WhatsApp
                  </a>
                </Button>
                <Button asChild variant="outline" className="gap-2">
                  <a href={`mailto:${companySettings?.email || ""}`}>
                    <Mail className="h-4 w-4" /> E-mail
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default PoliticaDevolucao;
