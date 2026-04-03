//src/components/landing/ContactSection.tsx

import { useState } from "react";
import { Send, MapPin, Phone, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { useStore } from "@/store";
import { toast } from "sonner";
import { createContact } from "@/ai/flows/create-contact-flow";

function isValidHttpUrl(value?: string | null): boolean {
  if (!value) return false;

  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

const ContactSection = () => {
  const { companySettings } = useStore();

  const contact = companySettings?.siteContent?.contact || {};
  const sectionStyle = companySettings?.styleSettings?.sections?.contact || {};

  const address = companySettings?.address || {};
  const fullAddress = [
    address?.logradouro,
    address?.numero,
    address?.bairro,
    address?.localidade && address?.uf ? `${address.localidade} - ${address.uf}` : address?.localidade || address?.uf,
  ]
    .filter(Boolean)
    .join(", ");

  const mapUrl = fullAddress
    ? `https://maps.google.com/maps?q=${encodeURIComponent(fullAddress)}&t=&z=15&ie=UTF8&iwloc=&output=embed`
    : "";

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });

  const title = contact?.title || "Solicite seu Orçamento";
  const description = contact?.description || "Preencha o formulário e nossa equipe entrará em contato rapidamente";

  const backgroundColor = sectionStyle.backgroundColor;
  const textColor = sectionStyle.textColor;
  const titleColor = sectionStyle.titleColor;
  const accentColor = sectionStyle.accentColor;
  const backgroundImageUrl = contact?.backgroundImageUrl;

  const handleChange =
    (field: "name" | "email" | "phone" | "message") =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setFormData((prev) => ({
        ...prev,
        [field]: e.target.value,
      }));
    };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await createContact({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        message: formData.message,
      });

      if (!result.success) {
        throw new Error(result.message || "Falha ao enviar mensagem.");
      }

      toast.success(result.message || "Mensagem enviada com sucesso!");

      setFormData({
        name: "",
        email: "",
        phone: "",
        message: "",
      });
    } catch (error: any) {
      toast.error(error?.message || "Ocorreu um erro ao enviar a mensagem.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section
      id="contato"
      className="relative py-20 overflow-hidden"
      style={{
        backgroundColor: backgroundColor || undefined,
        color: textColor || undefined,
      }}
    >
      {isValidHttpUrl(backgroundImageUrl) ? (
        <>
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${backgroundImageUrl})` }}
          />
          <div className="absolute inset-0 bg-background/85 backdrop-blur-[1px]" />
        </>
      ) : mapUrl ? (
        <>
          <iframe
            src={mapUrl}
            width="100%"
            height="100%"
            className="absolute inset-0 z-0"
            style={{ border: 0 }}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Mapa da empresa"
          />
          <div className="absolute inset-0 bg-background/80 backdrop-blur-[1px]" />
        </>
      ) : null}

      <div className="container relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl font-bold mb-3" style={{ color: titleColor || undefined }}>
            {title}
          </h2>
          <p className="text-muted-foreground" style={{ color: textColor || undefined }}>
            {description}
          </p>
        </div>

        <div className="grid lg:grid-cols-5 gap-8 max-w-6xl mx-auto">
          <Card className="lg:col-span-3 border-border bg-card/90 backdrop-blur-sm shadow-lg">
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input placeholder="Nome completo" value={formData.name} onChange={handleChange("name")} required />
                  <Input
                    type="email"
                    placeholder="E-mail"
                    value={formData.email}
                    onChange={handleChange("email")}
                    required
                  />
                </div>

                <Input placeholder="Telefone / WhatsApp" value={formData.phone} onChange={handleChange("phone")} />

                <Textarea
                  placeholder="Digite sua mensagem..."
                  rows={5}
                  value={formData.message}
                  onChange={handleChange("message")}
                  required
                />

                <Button
                  type="submit"
                  className="w-full gap-2"
                  disabled={loading}
                  style={{
                    backgroundColor: accentColor || undefined,
                    color: backgroundColor || undefined,
                  }}
                >
                  <Send className="h-4 w-4" />
                  {loading ? "Enviando..." : "Enviar Solicitação"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="lg:col-span-2 space-y-6 rounded-2xl border border-border bg-card/85 backdrop-blur-sm p-6 shadow-sm">
            {fullAddress && (
              <div className="flex items-start gap-4">
                <div
                  className="rounded-lg p-2.5"
                  style={{
                    backgroundColor: accentColor ? `${accentColor}1A` : undefined,
                  }}
                >
                  <MapPin className="h-5 w-5" style={{ color: accentColor || undefined }} />
                </div>
                <div>
                  <h3 className="font-semibold" style={{ color: titleColor || undefined }}>
                    Endereço
                  </h3>
                  <p className="text-sm" style={{ color: textColor || undefined }}>
                    {fullAddress}
                  </p>
                </div>
              </div>
            )}

            {companySettings?.phone && (
              <div className="flex items-start gap-4">
                <div
                  className="rounded-lg p-2.5"
                  style={{
                    backgroundColor: accentColor ? `${accentColor}1A` : undefined,
                  }}
                >
                  <Phone className="h-5 w-5" style={{ color: accentColor || undefined }} />
                </div>
                <div>
                  <h3 className="font-semibold" style={{ color: titleColor || undefined }}>
                    Telefone
                  </h3>
                  <p className="text-sm" style={{ color: textColor || undefined }}>
                    {companySettings.phone}
                  </p>
                </div>
              </div>
            )}

            {companySettings?.email && (
              <div className="flex items-start gap-4">
                <div
                  className="rounded-lg p-2.5"
                  style={{
                    backgroundColor: accentColor ? `${accentColor}1A` : undefined,
                  }}
                >
                  <Mail className="h-5 w-5" style={{ color: accentColor || undefined }} />
                </div>
                <div>
                  <h3 className="font-semibold" style={{ color: titleColor || undefined }}>
                    E-mail
                  </h3>
                  <p className="text-sm" style={{ color: textColor || undefined }}>
                    {companySettings.email}
                  </p>
                </div>
              </div>
            )}

            {mapUrl && (
              <div className="overflow-hidden rounded-xl border border-border mt-4 h-56">
                <iframe
                  src={mapUrl}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Mapa da empresa"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
