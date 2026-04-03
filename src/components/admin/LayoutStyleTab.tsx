//src/components/admin/LayoutStyleTab.tsx

import { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GripVertical, Palette } from "lucide-react";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";
import type { StyleSettings } from "@/store";

type SectionStyle = StyleSettings["sections"][string];

interface LayoutStyleTabProps {
  styleSettings: StyleSettings;
  onStyleChange: (newStyles: StyleSettings) => void;
  availableSections: { id: string; name: string }[];
}

const defaultSectionStyle: SectionStyle = {
  backgroundColor: "#ffffff",
  titleColor: "#000000",
  textColor: "#333333",
  accentColor: "#2563eb",
};

const LayoutStyleTab = ({ styleSettings, onStyleChange, availableSections }: LayoutStyleTabProps) => {
  const [localSettings, setLocalSettings] = useState<StyleSettings>(styleSettings);
  const [visibleSections, setVisibleSections] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    setLocalSettings(styleSettings);

    const orderedSections = styleSettings.sectionOrder
      ?.map((id) => availableSections.find((section) => section.id === id))
      .filter(Boolean) as { id: string; name: string }[];

    setVisibleSections(orderedSections.length > 0 ? orderedSections : availableSections);
  }, [styleSettings, availableSections]);

  const updateSettings = (nextSettings: StyleSettings) => {
    setLocalSettings(nextSettings);
    onStyleChange(nextSettings);
  };

  const handleTypographyChange = (target: "heading" | "body", field: "fontSize" | "fontWeight", value: string) => {
    const nextSettings: StyleSettings = {
      ...localSettings,
      typography: {
        ...localSettings.typography,
        [target]: {
          ...localSettings.typography[target],
          [field]: value,
        },
      },
    };

    updateSettings(nextSettings);
  };

  const handleSectionColorChange = (sectionId: string, field: keyof SectionStyle, value: string) => {
    const currentSectionStyle = localSettings.sections?.[sectionId] || defaultSectionStyle;

    const nextSettings: StyleSettings = {
      ...localSettings,
      sections: {
        ...localSettings.sections,
        [sectionId]: {
          ...currentSectionStyle,
          [field]: value,
        },
      },
    };

    updateSettings(nextSettings);
  };

  return (
    <CardContent className="space-y-8">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Estilos das Seções</h3>
        <p className="text-sm text-muted-foreground">Personalize as cores de cada seção do seu site público.</p>

        <Accordion type="multiple" className="w-full space-y-2">
          {availableSections.map((section) => {
            const sectionStyle = localSettings.sections?.[section.id] || defaultSectionStyle;

            return (
              <AccordionItem value={section.id} key={section.id} className="border border-border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-2">
                    <Palette className="h-5 w-5 text-muted-foreground" />
                    <span>{section.name}</span>
                  </div>
                </AccordionTrigger>

                <AccordionContent className="pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label>Fundo</Label>
                      <Input
                        type="color"
                        value={sectionStyle.backgroundColor || "#ffffff"}
                        onChange={(e) => handleSectionColorChange(section.id, "backgroundColor", e.target.value)}
                        className="h-12 w-full"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Título</Label>
                      <Input
                        type="color"
                        value={sectionStyle.titleColor || "#000000"}
                        onChange={(e) => handleSectionColorChange(section.id, "titleColor", e.target.value)}
                        className="h-12 w-full"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Texto</Label>
                      <Input
                        type="color"
                        value={sectionStyle.textColor || "#333333"}
                        onChange={(e) => handleSectionColorChange(section.id, "textColor", e.target.value)}
                        className="h-12 w-full"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Destaque</Label>
                      <Input
                        type="color"
                        value={sectionStyle.accentColor || "#2563eb"}
                        onChange={(e) => handleSectionColorChange(section.id, "accentColor", e.target.value)}
                        className="h-12 w-full"
                      />
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </div>

      <Separator />

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Tipografia Global</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4 border border-border p-4 rounded-lg">
            <h4 className="font-semibold text-foreground">Títulos</h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tamanho da Fonte (rem)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={String(localSettings.typography.heading.fontSize || "2.25rem").replace("rem", "")}
                  onChange={(e) => handleTypographyChange("heading", "fontSize", `${e.target.value}rem`)}
                />
              </div>

              <div className="space-y-2">
                <Label>Peso da Fonte</Label>
                <Select
                  value={localSettings.typography.heading.fontWeight}
                  onValueChange={(value) => handleTypographyChange("heading", "fontWeight", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="400">Normal</SelectItem>
                    <SelectItem value="600">Semi-bold</SelectItem>
                    <SelectItem value="700">Bold</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="space-y-4 border border-border p-4 rounded-lg">
            <h4 className="font-semibold text-foreground">Corpo do Texto</h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tamanho da Fonte (rem)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={String(localSettings.typography.body.fontSize || "1rem").replace("rem", "")}
                  onChange={(e) => handleTypographyChange("body", "fontSize", `${e.target.value}rem`)}
                />
              </div>

              <div className="space-y-2">
                <Label>Peso da Fonte</Label>
                <Select
                  value={localSettings.typography.body.fontWeight}
                  onValueChange={(value) => handleTypographyChange("body", "fontWeight", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="400">Normal</SelectItem>
                    <SelectItem value="500">Medium</SelectItem>
                    <SelectItem value="600">Semi-bold</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Separator />

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Ordem das Seções do Site</h3>
        <p className="text-sm text-muted-foreground">
          Arraste para reordenar as seções. Esta funcionalidade está temporariamente desativada.
        </p>

        <div className="space-y-2 max-w-md">
          {visibleSections.map((item) => (
            <div key={item.id} className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg border border-border">
              <GripVertical className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">{item.name}</span>
            </div>
          ))}
        </div>
      </div>
    </CardContent>
  );
};

export default LayoutStyleTab;
