import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface SectionShellProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

export const SectionShell = ({ title, description, children }: SectionShellProps) => (
  <section className="space-y-4 rounded-lg border border-border bg-background p-5">
    <header className="space-y-1 border-b border-border pb-3">
      <h3 className="text-base font-bold text-foreground">{title}</h3>
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
    </header>
    <div className="space-y-4">{children}</div>
  </section>
);

interface FieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  textarea?: boolean;
  rows?: number;
}

export const TextField = ({ label, value, onChange, placeholder, textarea, rows }: FieldProps) =>
  textarea ? (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</Label>
      <Textarea rows={rows || 3} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  ) : (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  );
