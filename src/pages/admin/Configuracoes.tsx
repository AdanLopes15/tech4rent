import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const Configuracoes = () => {
  const [companyData, setCompanyData] = useState({
    razaoSocial: "",
    nomeFantasia: "",
    cnpj: "",
    telefone: "",
    email: "",
    cep: "",
    rua: "",
    numero: "",
    complemento: "",
    bairro: "",
    cidade: "",
    estado: "",
    instagram: "",
    youtube: "",
    linkedin: "",
  });

  const handleCompanyChange = (field: string, value: string) => {
    setCompanyData((prev) => ({ ...prev, [field]: value }));
  };

  const handleCepLookup = async () => {
    const cep = companyData.cep.replace(/\D/g, "");
    if (cep.length !== 8) return;
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await res.json();
      if (!data.erro) {
        setCompanyData((prev) => ({
          ...prev,
          rua: data.logradouro || "",
          bairro: data.bairro || "",
          cidade: data.localidade || "",
          estado: data.uf || "",
        }));
      }
    } catch {
      toast.error("Erro ao buscar CEP");
    }
  };

  const handleSave = () => {
    toast.success("Alterações salvas com sucesso!");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Configurações</h1>
        <p className="text-muted-foreground">Gerencie as informações da sua empresa e padrões do sistema.</p>
      </div>

      <Tabs defaultValue="empresa" className="space-y-6">
        <TabsList className="w-full justify-start bg-muted/50 p-1">
          <TabsTrigger value="empresa">Dados da Empresa</TabsTrigger>
          <TabsTrigger value="layout">Layout & Estilo</TabsTrigger>
          <TabsTrigger value="conteudo">Conteúdo do Site</TabsTrigger>
          <TabsTrigger value="clausulas-locacao">Cláusulas de Locação</TabsTrigger>
          <TabsTrigger value="clausulas-venda">Cláusulas de Venda</TabsTrigger>
          <TabsTrigger value="email">Email</TabsTrigger>
        </TabsList>

        {/* Dados da Empresa */}
        <TabsContent value="empresa">
          <Card className="border-border">
            <CardHeader>
              <CardTitle>Perfil da Empresa</CardTitle>
              <CardDescription>Atualize as informações da sua empresa. Estes dados aparecerão nos documentos.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nome da Empresa / Razão Social</Label>
                  <Input value={companyData.razaoSocial} onChange={(e) => handleCompanyChange("razaoSocial", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Nome Fantasia (para o sistema)</Label>
                  <Input value={companyData.nomeFantasia} onChange={(e) => handleCompanyChange("nomeFantasia", e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>CNPJ</Label>
                  <Input value={companyData.cnpj} onChange={(e) => handleCompanyChange("cnpj", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Telefone</Label>
                  <Input value={companyData.telefone} onChange={(e) => handleCompanyChange("telefone", e.target.value)} />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={companyData.email} onChange={(e) => handleCompanyChange("email", e.target.value)} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>CEP</Label>
                  <Input
                    value={companyData.cep}
                    onChange={(e) => handleCompanyChange("cep", e.target.value)}
                    onBlur={handleCepLookup}
                    placeholder="Digite o CEP"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Rua / Logradouro</Label>
                  <Input value={companyData.rua} onChange={(e) => handleCompanyChange("rua", e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Número</Label>
                  <Input value={companyData.numero} onChange={(e) => handleCompanyChange("numero", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Complemento</Label>
                  <Input value={companyData.complemento} onChange={(e) => handleCompanyChange("complemento", e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Bairro</Label>
                  <Input value={companyData.bairro} onChange={(e) => handleCompanyChange("bairro", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Cidade</Label>
                  <Input value={companyData.cidade} onChange={(e) => handleCompanyChange("cidade", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Estado</Label>
                  <Input value={companyData.estado} onChange={(e) => handleCompanyChange("estado", e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>URL do Instagram</Label>
                  <Input placeholder="https://instagram.com/seu-usuario" value={companyData.instagram} onChange={(e) => handleCompanyChange("instagram", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>URL do YouTube</Label>
                  <Input placeholder="https://youtube.com/seu-canal" value={companyData.youtube} onChange={(e) => handleCompanyChange("youtube", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>URL do LinkedIn</Label>
                  <Input placeholder="https://linkedin.com/in/seu-perfil" value={companyData.linkedin} onChange={(e) => handleCompanyChange("linkedin", e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Logotipo do Sistema</Label>
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-lg border border-border bg-muted flex items-center justify-center text-xs text-muted-foreground">
                      Logo
                    </div>
                    <Button variant="outline" size="sm">Escolher arquivo</Button>
                    <span className="text-sm text-muted-foreground">Nenhum arquivo</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Logo que aparecerá nos documentos e no sistema interno.</p>
                </div>
                <div className="space-y-2">
                  <Label>Logotipo do Site (Público)</Label>
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-lg border border-border bg-muted flex items-center justify-center text-xs text-muted-foreground">
                      Logo
                    </div>
                    <Button variant="outline" size="sm">Escolher arquivo</Button>
                    <span className="text-sm text-muted-foreground">Nenhum arquivo</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Logo que aparecerá no cabeçalho do site público.</p>
                </div>
              </div>

              <Button onClick={handleSave}>Salvar Alterações</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Layout & Estilo */}
        <TabsContent value="layout">
          <Card className="border-border">
            <CardHeader>
              <CardTitle>Layout & Estilo</CardTitle>
              <CardDescription>Personalize as cores e tipografia do site público.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Cor Primária</Label>
                  <Input type="color" defaultValue="#f97316" className="h-10 w-20" />
                </div>
                <div className="space-y-2">
                  <Label>Cor Secundária</Label>
                  <Input type="color" defaultValue="#1e293b" className="h-10 w-20" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Fonte do Site</Label>
                <Input defaultValue="Inter" placeholder="Nome da fonte" />
              </div>
              <Button onClick={handleSave}>Salvar Alterações</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Conteúdo do Site */}
        <TabsContent value="conteudo">
          <Card className="border-border">
            <CardHeader>
              <CardTitle>Conteúdo do Site</CardTitle>
              <CardDescription>Edite os textos que aparecem no site público.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Título do Hero</Label>
                <Input defaultValue="Locação e Venda de Equipamentos para sua Empresa" />
              </div>
              <div className="space-y-2">
                <Label>Subtítulo do Hero</Label>
                <Textarea defaultValue="Soluções completas em tecnologia para locação e venda." rows={3} />
              </div>
              <div className="space-y-2">
                <Label>Sobre Nós</Label>
                <Textarea rows={5} placeholder="Texto da seção Sobre Nós..." />
              </div>
              <Button onClick={handleSave}>Salvar Alterações</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cláusulas de Locação */}
        <TabsContent value="clausulas-locacao">
          <Card className="border-border">
            <CardHeader>
              <CardTitle>Cláusulas de Locação</CardTitle>
              <CardDescription>Textos padrões para contratos de locação e recibos.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Cláusulas do Contrato de Locação</Label>
                <Textarea rows={10} placeholder="Digite as cláusulas padrão do contrato de locação..." />
              </div>
              <div className="space-y-2">
                <Label>Termos do Recibo de Entrega</Label>
                <Textarea rows={6} placeholder="Termos do recibo de entrega dos equipamentos..." />
              </div>
              <Button onClick={handleSave}>Salvar Alterações</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cláusulas de Venda */}
        <TabsContent value="clausulas-venda">
          <Card className="border-border">
            <CardHeader>
              <CardTitle>Cláusulas de Venda</CardTitle>
              <CardDescription>Textos padrões para documentos de venda.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Cláusulas do Contrato de Venda</Label>
                <Textarea rows={10} placeholder="Digite as cláusulas padrão do contrato de venda..." />
              </div>
              <Button onClick={handleSave}>Salvar Alterações</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Email */}
        <TabsContent value="email">
          <Card className="border-border">
            <CardHeader>
              <CardTitle>Configurações de Email</CardTitle>
              <CardDescription>Configure o envio de emails do sistema.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Servidor SMTP</Label>
                  <Input placeholder="smtp.seuservidor.com" />
                </div>
                <div className="space-y-2">
                  <Label>Porta</Label>
                  <Input placeholder="587" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Usuário</Label>
                  <Input placeholder="seu@email.com" />
                </div>
                <div className="space-y-2">
                  <Label>Senha</Label>
                  <Input type="password" placeholder="••••••••" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Email Remetente</Label>
                <Input placeholder="noreply@tech4rent.com.br" />
              </div>
              <Button onClick={handleSave}>Salvar Alterações</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Configuracoes;
