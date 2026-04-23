import { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface ImageUploadFieldProps {
  label: string;
  value?: string | null;
  onChange: (dataUrl: string, file: File) => void;
  accept?: string;
  type?: "image" | "video";
}

const ImageUploadField = ({ label, value, onChange, accept = "image/*", type = "image" }: ImageUploadFieldProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(value || null);

  useEffect(() => {
    if (value) setPreview(value);
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setPreview(result);
      onChange(result, file);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex items-center gap-4">
        <div className="h-16 w-16 rounded-lg border border-border bg-muted flex items-center justify-center text-xs text-muted-foreground overflow-hidden">
          {preview ? (
            type === "video" ? (
              <video src={preview} className="h-full w-full object-cover" muted playsInline />
            ) : (
              <img src={preview} alt={label} className="h-full w-full object-cover" />
            )
          ) : type === "video" ? (
            "Vídeo"
          ) : (
            "Img"
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={handleChange}
        />
        <Button variant="outline" size="sm" type="button" onClick={() => inputRef.current?.click()}>
          Escolher arquivo
        </Button>
        <span className="text-sm text-muted-foreground">
          {preview ? "Arquivo selecionado" : "Nenhum arquivo escolhido"}
        </span>
      </div>
    </div>
  );
};

export default ImageUploadField;
