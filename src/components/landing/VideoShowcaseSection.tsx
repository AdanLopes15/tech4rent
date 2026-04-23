import { Play } from "lucide-react";
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
    <section className="bg-background pb-24 pt-8">
      <div className="container max-w-3xl text-center">
        <h2 className="mb-7 text-2xl font-black text-foreground">Veja na prática</h2>
        <div className="mx-auto aspect-video overflow-hidden rounded-lg bg-foreground shadow-xl">
          {embedUrl ? (
            <iframe
              src={embedUrl}
              title="Vídeo institucional Tech4Rent"
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_72%_40%,hsl(var(--primary)/0.2),transparent_28%),hsl(var(--foreground))] text-background">
              <div className="text-left">
                <div className="text-4xl font-black uppercase leading-none">Coletor de dados</div>
                <div className="mt-2 text-6xl font-black text-primary">TC60</div>
              </div>
              <div className="ml-12 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                <Play className="h-8 w-8 fill-current" />
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default VideoShowcaseSection;
