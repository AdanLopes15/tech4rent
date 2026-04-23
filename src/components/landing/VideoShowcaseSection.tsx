import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStore } from "@/store";

const getYoutubeEmbedUrl = (url?: string) => {
  if (!url) return "";
  try {
    const parsed = new URL(url);
    const videoId = parsed.hostname.includes("youtu.be")
      ? parsed.pathname.slice(1)
      : parsed.searchParams.get("v") || parsed.pathname.split("/").filter(Boolean).pop();
    return videoId ? `https://www.youtube.com/embed/${videoId}` : "";
  } catch {
    return "";
  }
};

const VideoShowcaseSection = () => {
  const { companySettings } = useStore();
  const embedUrl = getYoutubeEmbedUrl(companySettings?.youtubeUrl);

  return (
    <section className="bg-muted py-20">
      <div className="container grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
        <div className="space-y-5">
          <span className="text-sm font-bold uppercase tracking-widest text-primary">Veja na prática</span>
          <h2 className="text-3xl font-black text-foreground md:text-5xl">Tecnologia pronta para entrar na sua rotina</h2>
          <p className="text-muted-foreground leading-relaxed">
            Conheça aplicações de coletores, tablets, leitores e acessórios em operações de campo, estoque, logística e atendimento.
          </p>
          <Button onClick={() => document.getElementById("contato")?.scrollIntoView({ behavior: "smooth" })}>Solicitar demonstração</Button>
        </div>

        <div className="aspect-video overflow-hidden rounded-lg border border-border bg-card shadow-sm">
          {embedUrl ? (
            <iframe
              src={embedUrl}
              title="Vídeo institucional Tech4Rent"
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-4 bg-foreground text-background">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Play className="h-7 w-7 fill-current" />
              </div>
              <p className="max-w-sm text-center text-sm text-background/75">Vídeo demonstrativo disponível em breve.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default VideoShowcaseSection;
