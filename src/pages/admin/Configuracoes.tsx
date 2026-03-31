import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import ClausulasEditor, { defaultVendaClauses } from "@/components/admin/ClausulasEditor";

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
              <CardDescription>Personalize a aparência do seu site público.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* Estilos das Seções */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-foreground">Estilos das Seções</h3>
                <p className="text-sm text-muted-foreground">Personalize as cores de cada seção do seu site público.</p>
                <div className="space-y-2">
                  {[
                    "Seção Hero (Início)", "Barra de Contato", "Produto em Destaque",
                    "Vitrine de Produtos", "Diferenciais", "Sobre Nós", "Formulário de Contato"
                  ].map((section) => (
                    <details key={section} className="group rounded-lg border border-border">
                      <summary className="flex items-center justify-between cursor-pointer px-4 py-3 text-sm font-medium text-foreground hover:bg-muted/50 rounded-lg">
                        <span className="flex items-center gap-2">
                          <span className="text-muted-foreground">◎</span>
                          {section}
                        </span>
                      </summary>
                      <div className="px-4 pb-4 pt-2 space-y-3 border-t border-border">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label>Cor de Fundo</Label>
                            <Input type="color" defaultValue="#0f172a" className="h-10 w-full" />
                          </div>
                          <div className="space-y-2">
                            <Label>Cor do Texto</Label>
                            <Input type="color" defaultValue="#f8fafc" className="h-10 w-full" />
                          </div>
                          <div className="space-y-2">
                            <Label>Cor de Destaque</Label>
                            <Input type="color" defaultValue="#f97316" className="h-10 w-full" />
                          </div>
                        </div>
                      </div>
                    </details>
                  ))}
                </div>
              </div>

              {/* Tipografia Global */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-foreground">Tipografia Global</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="border-border">
                    <CardContent className="p-4 space-y-4">
                      <h4 className="font-semibold text-foreground">Títulos</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Tamanho da Fonte (rem)</Label>
                          <Input defaultValue="2,25" />
                        </div>
                        <div className="space-y-2">
                          <Label>Peso da Fonte</Label>
                          <select className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                            <option value="bold">Bold</option>
                            <option value="semibold">Semibold</option>
                            <option value="normal">Normal</option>
                          </select>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-border">
                    <CardContent className="p-4 space-y-4">
                      <h4 className="font-semibold text-foreground">Corpo do Texto</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Tamanho da Fonte (rem)</Label>
                          <Input defaultValue="1" />
                        </div>
                        <div className="space-y-2">
                          <Label>Peso da Fonte</Label>
                          <select className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                            <option value="normal">Normal</option>
                            <option value="semibold">Semibold</option>
                            <option value="bold">Bold</option>
                          </select>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Ordem das Seções */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-foreground">Ordem das Seções do Site</h3>
                <p className="text-sm text-muted-foreground">Arraste para reordenar as seções. Esta funcionalidade está temporariamente desativada.</p>
                <div className="space-y-2 max-w-sm">
                  {[
                    "Seção Hero (Início)", "Barra de Contato", "Produto em Destaque",
                    "Vitrine de Produtos", "Diferenciais", "Sobre Nós", "Formulário de Contato"
                  ].map((section) => (
                    <div key={section} className="flex items-center gap-2 rounded-lg bg-muted/50 border border-border px-4 py-2.5 text-sm font-medium text-foreground">
                      <span className="text-muted-foreground">⠿</span>
                      {section}
                    </div>
                  ))}
                </div>
              </div>

              <Button onClick={handleSave}>Salvar Layout & Estilo</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Conteúdo do Site */}
        <TabsContent value="conteudo">
          <Card className="border-border">
            <CardHeader>
              <CardTitle>Conteúdo do Site</CardTitle>
              <CardDescription>Gerencie os textos e imagens do seu site público.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* Seção Hero */}
              <div className="space-y-4 rounded-lg border border-border p-5">
                <h3 className="text-lg font-semibold text-foreground">Seção Hero (Início)</h3>
                <div className="space-y-2">
                  <Label>Título</Label>
                  <Input defaultValue="Soluções em Equipamentos para sua Empresa" />
                </div>
                <div className="space-y-2">
                  <Label>Subtítulo</Label>
                  <Textarea defaultValue="Qualidade, segurança e a tecnologia que você precisa para alcançar os melhores resultados." rows={3} />
                </div>
                <div className="space-y-2">
                  <Label>Imagem de Fundo (Hero)</Label>
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-lg border border-border bg-muted flex items-center justify-center text-xs text-muted-foreground">Img</div>
                    <Button variant="outline" size="sm">Escolher arquivo</Button>
                    <span className="text-sm text-muted-foreground">Nenhum arquivo escolhido</span>
                  </div>
                </div>
              </div>

              {/* Seção de Destaque */}
              <div className="space-y-4 rounded-lg border border-border p-5">
                <h3 className="text-lg font-semibold text-foreground">Seção de Destaque</h3>
                <div className="space-y-2">
                  <Label>Título</Label>
                  <Input defaultValue="PDA TC60 - Mais rápido do mercado!" />
                </div>
                <div className="space-y-2">
                  <Label>Tag</Label>
                  <Input defaultValue="Soluções para grandes empresas" />
                </div>
                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Textarea defaultValue="A TECH4RENT oferece soluções de automação personalizadas, colaborando com fabricantes para garantir ofertas competitivas e prazos rápidos." rows={4} />
                </div>
                <div className="space-y-2">
                  <Label>Imagem do Produto em Destaque</Label>
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-lg border border-border bg-muted flex items-center justify-center text-xs text-muted-foreground">Img</div>
                    <Button variant="outline" size="sm">Escolher arquivo</Button>
                    <span className="text-sm text-muted-foreground">Nenhum arquivo escolhido</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Imagem de Fundo (Destaque)</Label>
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-lg border border-border bg-muted flex items-center justify-center text-xs text-muted-foreground">Img</div>
                    <Button variant="outline" size="sm">Escolher arquivo</Button>
                    <span className="text-sm text-muted-foreground">Nenhum arquivo escolhido</span>
                  </div>
                </div>
              </div>

              {/* Vitrine de Produtos */}
              <div className="space-y-4 rounded-lg border border-border p-5">
                <h3 className="text-lg font-semibold text-foreground">Vitrine de Produtos</h3>
                <div className="space-y-2">
                  <Label>Imagem de Fundo (Vitrine)</Label>
                  <div className="flex items-center gap-4">
                    <Button variant="outline" size="sm">Escolher arquivo</Button>
                    <span className="text-sm text-muted-foreground">Nenhum arquivo escolhido</span>
                  </div>
                </div>
              </div>

              {/* Seção Diferenciais */}
              <div className="space-y-4 rounded-lg border border-border p-5">
                <h3 className="text-lg font-semibold text-foreground">Seção Diferenciais</h3>
                <div className="space-y-2">
                  <Label>Título da Seção</Label>
                  <Input defaultValue="Nossos Diferenciais" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[1, 2, 3].map((n) => (
                    <div key={n} className="space-y-3 rounded-lg border border-border p-4">
                      <div className="space-y-2">
                        <Label>Título {n}</Label>
                        <Input defaultValue={n === 1 ? "Qualidade Garantida" : n === 2 ? "Atendimento Especializado" : "Suporte Completo"} />
                      </div>
                      <div className="space-y-2">
                        <Label>Descrição {n}</Label>
                        <Textarea rows={3} defaultValue={n === 1 ? "Equipamentos modernos e com manutenção em dia para sua segurança." : n === 2 ? "Nossa equipe está pronta para te ajudar a escolher a melhor solução." : "Oferecemos suporte técnico durante todo o período de locação."} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Seção Sobre Nós */}
              <div className="space-y-4 rounded-lg border border-border p-5">
                <h3 className="text-lg font-semibold text-foreground">Seção Sobre Nós</h3>
                <div className="space-y-2">
                  <Label>Título</Label>
                  <Input defaultValue="Sobre Nós" />
                </div>
                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Textarea rows={4} defaultValue="Com anos de experiência no mercado, somos especialistas em fornecer os melhores equipamentos para construção civil e indústrias." />
                </div>
                <div className="space-y-2">
                  <Label>Imagem de Fundo (Sobre)</Label>
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-lg border border-border bg-muted flex items-center justify-center text-xs text-muted-foreground">Img</div>
                    <Button variant="outline" size="sm">Escolher arquivo</Button>
                    <span className="text-sm text-muted-foreground">Nenhum arquivo escolhido</span>
                  </div>
                </div>
              </div>

              {/* Seção Contato */}
              <div className="space-y-4 rounded-lg border border-border p-5">
                <h3 className="text-lg font-semibold text-foreground">Seção Contato</h3>
                <div className="space-y-2">
                  <Label>Imagem de Fundo (Contato)</Label>
                  <div className="flex items-center gap-4">
                    <Button variant="outline" size="sm">Escolher arquivo</Button>
                    <span className="text-sm text-muted-foreground">Nenhum arquivo escolhido</span>
                  </div>
                </div>
              </div>

              <Button onClick={handleSave}>Salvar Conteúdo do Site</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cláusulas de Locação */}
        <TabsContent value="clausulas-locacao">
          <Card className="border-border">
            <CardContent className="p-6">
              <ClausulasEditor
                title="Cláusulas do Contrato de Locação"
                description="Adicione, edite ou remova as cláusulas padrão que aparecerão em todos os contratos de locação gerados."
                onSave={() => toast.success("Cláusulas de locação salvas com sucesso!")}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cláusulas de Venda */}
        <TabsContent value="clausulas-venda">
          <Card className="border-border">
            <CardContent className="p-6">
              <ClausulasEditor
                title="Cláusulas do Recibo de Venda"
                description="Adicione, edite ou remova as cláusulas padrão que aparecerão em todos os recibos de venda gerados."
                initialClauses={defaultVendaClauses}
                onSave={() => toast.success("Cláusulas de venda salvas com sucesso!")}
              />
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
