import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import MediaUploadField from "@/components/admin/MediaUploadField";

interface FieldDef {
  key: string;
  label: string;
  type?: "text" | "textarea" | "image" | "video";
  rows?: number;
}

interface RepeaterFieldProps {
  label: string;
  helperText?: string;
  items: any[];
  fields: FieldDef[];
  onChange: (next: any[]) => void;
  /** Returns a default new item */
  newItem: () => any;
  /** dot-path prefix used by media uploads (ex: "home.benefits") */
  pathPrefix: string;
  /** Handler chamado quando o usuário escolhe um arquivo de mídia para um item.
   *  recebe (path completo, arquivo, dataUrl) */
  onMediaPick?: (path: string, file: File, dataUrl: string) => void;
}

const RepeaterField = ({ label, helperText, items, fields, onChange, newItem, pathPrefix, onMediaPick }: RepeaterFieldProps) => {
  const updateItem = (index: number, key: string, value: any) => {
    const next = items.map((it, i) => (i === index ? { ...it, [key]: value } : it));
    onChange(next);
  };
  const removeItem = (index: number) => onChange(items.filter((_, i) => i !== index));
  const addItem = () => onChange([...items, newItem()]);

  return (
    <div className="space-y-3 rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-sm font-bold">{label}</Label>
          {helperText && <p className="mt-1 text-xs text-muted-foreground">{helperText}</p>}
        </div>
        <Button type="button" variant="outline" size="sm" onClick={addItem} className="gap-1">
          <Plus className="h-3.5 w-3.5" /> Adicionar
        </Button>
      </div>

      <div className="space-y-3">
        {items.map((item, index) => (
          <div key={index} className="space-y-3 rounded-md border border-border/60 bg-muted/30 p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Item {index + 1}</span>
              <Button type="button" variant="ghost" size="sm" onClick={() => removeItem(index)} className="h-7 gap-1 text-destructive hover:text-destructive">
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {fields.map((field) => {
                const fullPath = `${pathPrefix}.${index}.${field.key}`;
                if (field.type === "textarea") {
                  return (
                    <div key={field.key} className="space-y-1 md:col-span-2">
                      <Label className="text-xs">{field.label}</Label>
                      <Textarea rows={field.rows || 3} value={item[field.key] || ""} onChange={(e) => updateItem(index, field.key, e.target.value)} />
                    </div>
                  );
                }
                if (field.type === "image" || field.type === "video") {
                  return (
                    <div key={field.key} className="md:col-span-2">
                      <MediaUploadField
                        label={field.label}
                        type={field.type}
                        value={item[field.key]}
                        onChange={(file, dataUrl) => {
                          updateItem(index, field.key, dataUrl);
                          onMediaPick?.(fullPath, file, dataUrl);
                        }}
                        onClear={() => updateItem(index, field.key, "")}
                      />
                    </div>
                  );
                }
                return (
                  <div key={field.key} className="space-y-1">
                    <Label className="text-xs">{field.label}</Label>
                    <Input value={item[field.key] || ""} onChange={(e) => updateItem(index, field.key, e.target.value)} />
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {items.length === 0 && (
          <div className="rounded-md border border-dashed border-border bg-muted/20 p-6 text-center text-sm text-muted-foreground">
            Nenhum item. Clique em "Adicionar" para criar.
          </div>
        )}
      </div>
    </div>
  );
};

export default RepeaterField;
