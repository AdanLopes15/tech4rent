import { useEffect, useRef, useState } from "react";
import { Image as ImageIcon, Upload, Video, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface MediaUploadFieldProps {
  label: string;
  value?: string | null;
  type?: "image" | "video";
  onChange: (file: File, dataUrl: string) => void;
  onClear?: () => void;
  helperText?: string;
}

const MediaUploadField = ({ label, value, type = "image", onChange, onClear, helperText }: MediaUploadFieldProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(value || null);

  useEffect(() => {
    setPreview(value || null);
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setPreview(result);
      onChange(file, result);
    };
    reader.readAsDataURL(file);
  };

  const accept = type === "video" ? "video/*" : "image/*";
  const Icon = type === "video" ? Video : ImageIcon;

  return (
    <div className="space-y-2">
      <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</Label>
      <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 p-3">
        <div className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-card">
          {preview ? (
            type === "video" ? (
              <video src={preview} className="h-full w-full object-cover" muted playsInline />
            ) : (
              <img src={preview} alt={label} className="h-full w-full object-cover" />
            )
          ) : (
            <Icon className="h-7 w-7 text-muted-foreground" />
          )}
        </div>
        <div className="flex flex-1 flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={handleChange} />
            <Button variant="outline" size="sm" type="button" onClick={() => inputRef.current?.click()} className="gap-2">
              <Upload className="h-3.5 w-3.5" /> {preview ? "Trocar arquivo" : "Selecionar"}
            </Button>
            {preview && onClear && (
              <Button
                variant="ghost"
                size="sm"
                type="button"
                onClick={() => {
                  setPreview(null);
                  onClear();
                }}
                className="gap-1 text-destructive hover:text-destructive"
              >
                <X className="h-3.5 w-3.5" /> Remover
              </Button>
            )}
          </div>
          {helperText && <p className="text-xs text-muted-foreground">{helperText}</p>}
        </div>
      </div>
    </div>
  );
};

export default MediaUploadField;
