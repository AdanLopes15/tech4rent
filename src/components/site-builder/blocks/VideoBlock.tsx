// src/components/site-builder/blocks/VideoBlock.tsx

import { Play } from "lucide-react";

const getYoutubeEmbedUrl = (url?: string) => {
  if (!url) return "";
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes("youtube.com") || parsed.hostname.includes("youtu.be")) {
      const videoId = parsed.hostname.includes("youtu.be")
        ? parsed.pathname.slice(1)
        : parsed.searchParams.get("v") || parsed.pathname.split("/").filter(Boolean).pop();
      return videoId ? `https://www.youtube.com/embed/${videoId}` : "";
    }
    return "";
  } catch {
    return "";
  }
};

type Props = { title?: string; videoUrl?: string };

const VideoBlock = ({ title = "Veja na prática", videoUrl }: Props) => {
  const embedUrl = getYoutubeEmbedUrl(videoUrl);
  const isMp4 = !!videoUrl && /\.(mp4|webm|ogg)(\?|$)/i.test(videoUrl);

  return (
    <section className="bg-background pb-24 pt-8">
      <div className="container max-w-3xl text-center">
        {title && <h2 className="mb-7 text-2xl font-black text-foreground">{title}</h2>}
        <div className="mx-auto aspect-video overflow-hidden rounded-lg bg-foreground shadow-xl">
          {embedUrl ? (
            <iframe
              src={embedUrl}
              title={title || "Vídeo"}
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : isMp4 ? (
            <video src={videoUrl} controls className="h-full w-full" />
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

export default VideoBlock;
