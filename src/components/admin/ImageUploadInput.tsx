// src/components/admin/ImageUploadInput.tsx
// Campo de imagem com upload pro Firebase Storage + opção de colar URL.

import { useRef, useState } from "react";
import { Upload, X, Loader2, Link2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { uploadSiteMedia } from "@/lib/site-builder/upload";
import { toast } from "sonner";

type Props = {
  value?: string;
  onChange: (url: string) => void;
  placeholder?: string;
  folder?: string;
  accept?: string;
};

const ImageUploadInput = ({ value, onChange, placeholder = "Cole uma URL ou faça upload", folder = "site-builder", accept = "image/*" }: Props) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [showUrl, setShowUrl] = useState(false);

  const handleFile = async (file: File) => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Arquivo muito grande (máx 10MB)");
      return;
    }
    try {
      setUploading(true);
      const url = await uploadSiteMedia(file, folder);
      onChange(url);
      toast.success("Upload concluído");
    } catch (e: any) {
      toast.error(e?.message || "Erro no upload");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const isVideo = accept.includes("video");
  const previewIsImage = value && !isVideo;
  const previewIsVideo = value && (isVideo || /\.(mp4|webm|mov)$/i.test(value));

  return (
    <div className="space-y-2">
      {value ? (
        <div className="relative overflow-hidden rounded-md border border-border bg-muted">
          {previewIsVideo ? (
            <video src={value} className="h-28 w-full object-cover" muted />
          ) : previewIsImage ? (
            <img src={value} alt="" className="h-28 w-full object-cover" />
          ) : null}
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute right-1 top-1 rounded-full bg-background/90 p-1 text-foreground shadow hover:bg-background"
            title="Remover"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : null}

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="flex-1 gap-2"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
          {uploading ? "Enviando..." : value ? "Trocar arquivo" : "Upload"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="gap-1"
          onClick={() => setShowUrl((s) => !s)}
          title="Usar URL"
        >
          <Link2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      {showUrl && (
        <Input
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="text-xs"
        />
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
        }}
      />
    </div>
  );
};

export default ImageUploadInput;
