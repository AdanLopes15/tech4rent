//src/pages/admin/NFe.tsx

import { useMemo, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Download, FileCheck, Plus, RotateCcw, Send, Trash2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

type InvoiceItem = {
  description: string;
  ncm: string;
  cest: string;
  cfop: string;
  unit: string;
  quantity: number;
  unitPrice: number;
};

const createDefaultItem = (): InvoiceItem => ({
  description: "PRODUTO TESTE",
  ncm: "9403300",
  cest: "2806300",
  cfop: "5102",
  unit: "UN",
  quantity: 1,
  unitPrice: 10,
});

const Field = ({ label, children, helper }: { label: string; children: ReactNode; helper?: string }) => (
  <div className="space-y-2">
    <div>
      <p className="text-sm font-medium text-foreground">{label}</p>
      {helper && <p className="text-xs text-muted-foreground">{helper}</p>}
    </div>
    {children}
  </div>
);

const NFe = () => {
  const [environment, setEnvironment] = useState("homologacao");
  const [paymentMethod, setPaymentMethod] = useState("dinheiro");
  const [items, setItems] = useState<InvoiceItem[]>([createDefaultItem()]);

  const totalAmount = useMemo(() => items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0), [items]);

  const updateItem = <K extends keyof InvoiceItem>(index: number, field: K, value: InvoiceItem[K]) => {
    setItems((current) => current.map((item, itemIndex) => (itemIndex === index ? { ...item, [field]: value } : item)));
  };

  const addItem = () => {
    setItems((current) => [...current, createDefaultItem()]);
  };

  const removeItem = (index: number) => {
    setItems((current) => (current.length === 1 ? current : current.filter((_, itemIndex) => itemIndex !== index)));
  };

  return (
    <div className="space-y-6">
      <Card className="border-border">
        <CardHeader className="space-y-1">
          <CardTitle className="flex items-center gap-2 text-2xl">
            <FileCheck className="h-5 w-5 text-primary" />
            Emissão de NF-e
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Emita NF-e (homologação/produção), acompanhe status e baixe XML/DANFE.
          </p>
        </CardHeader>

        <CardContent className="space-y-8">
          <div className="grid gap-4 xl:grid-cols-[1.2fr_1.2fr_1fr]">
            <Field label="Ambiente" helper="Produção exige credenciais/BASE_URL de produção.">
              <Select value={environment} onValueChange={setEnvironment}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o ambiente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="homologacao">Homologação (Sandbox)</SelectItem>
                  <SelectItem value="producao">Produção</SelectItem>
                </SelectContent>
              </Select>
            </Field>

            <Field label="Natureza da operação">
              <Input defaultValue="VENDA" />
            </Field>

            <div className="space-y-3 rounded-lg border border-border p-4">
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">Total</p>
                <div className="flex items-center justify-between gap-4 rounded-md border border-border bg-muted/20 px-3 py-2">
                  <span className="text-sm text-muted-foreground">Total da NF-e</span>
                  <span className="text-xl font-semibold text-foreground">{formatCurrency(totalAmount)}</span>
                </div>
              </div>
              <Button type="button" className="w-full gap-2">
                <Send className="h-4 w-4" />
                Emitir NF-e
              </Button>
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <Card className="border-border bg-card/50">
              <CardHeader className="space-y-1">
                <CardTitle className="text-xl">Emitente</CardTitle>
                <p className="text-sm text-muted-foreground">Dados da sua empresa</p>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <Field label="CNPJ">
                  <Input defaultValue="44740821000130" />
                </Field>
                <Field label="IE">
                  <Input defaultValue="587446757113" />
                </Field>
                <div className="md:col-span-2">
                  <Field label="Razão social">
                    <Input defaultValue="IAPONIRA CARDOSO DE OLIVEIRA GAVIOTA" />
                  </Field>
                </div>
                <Field label="CRT">
                  <Input defaultValue="4" />
                </Field>
                <Field label="CEP">
                  <Input defaultValue="13506610" />
                </Field>
                <Field label="Logradouro">
                  <Input defaultValue="44 A" />
                </Field>
                <Field label="Número">
                  <Input defaultValue="499" />
                </Field>
                <Field label="Bairro">
                  <Input defaultValue="VILA NOVA" />
                </Field>
                <Field label="Município">
                  <Input defaultValue="RIO CLARO" />
                </Field>
                <Field label="UF">
                  <Input defaultValue="SP" />
                </Field>
                <Field label="Código IBGE do município (cMun)">
                  <Input defaultValue="3543907" />
                </Field>
              </CardContent>
            </Card>

            <Card className="border-border bg-card/50">
              <CardHeader className="space-y-1">
                <CardTitle className="text-xl">Destinatário</CardTitle>
                <p className="text-sm text-muted-foreground">Cliente (CPF/CNPJ)</p>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <Field label="Tipo">
                  <Select defaultValue="cpf">
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cpf">CPF</SelectItem>
                      <SelectItem value="cnpj">CNPJ</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="CPF">
                  <Input defaultValue="51510796894" />
                </Field>
                <div className="md:col-span-2">
                  <Field label="Nome/Razão">
                    <Input defaultValue="JOAO VITOR MORAIS" />
                  </Field>
                </div>
                <Field label="CEP">
                  <Input defaultValue="13506175" />
                </Field>
                <div className="hidden md:block" />
                <Field label="Logradouro">
                  <Input defaultValue="Rua 5" />
                </Field>
                <Field label="Número">
                  <Input defaultValue="296" />
                </Field>
                <Field label="Bairro">
                  <Input defaultValue="PARQUE MAE PRETA" />
                </Field>
                <Field label="Município">
                  <Input defaultValue="RIO CLARO" />
                </Field>
                <Field label="UF">
                  <Input defaultValue="SP" />
                </Field>
                <Field label="Código IBGE do município (cMun)">
                  <Input defaultValue="3543907" />
                </Field>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4 border-t border-border pt-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-foreground">Itens</h2>
                <p className="text-sm text-muted-foreground">CFOP sugerido: 5102 (mesmo estado)</p>
              </div>
              <Button type="button" variant="outline" className="gap-2" onClick={addItem}>
                <Plus className="h-4 w-4" />
                Adicionar item
              </Button>
            </div>

            <div className="overflow-x-auto rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[280px]">Descrição</TableHead>
                    <TableHead>NCM</TableHead>
                    <TableHead>CEST</TableHead>
                    <TableHead>CFOP</TableHead>
                    <TableHead>Un</TableHead>
                    <TableHead>Qtd</TableHead>
                    <TableHead>Vlr Un</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="w-[56px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item, index) => (
                    <TableRow key={`${item.description}-${index}`}>
                      <TableCell>
                        <Input
                          value={item.description}
                          onChange={(event) => updateItem(index, "description", event.target.value)}
                        />
                      </TableCell>
                      <TableCell>
                        <Input value={item.ncm} onChange={(event) => updateItem(index, "ncm", event.target.value)} />
                      </TableCell>
                      <TableCell>
                        <Input value={item.cest} onChange={(event) => updateItem(index, "cest", event.target.value)} />
                      </TableCell>
                      <TableCell>
                        <Input value={item.cfop} onChange={(event) => updateItem(index, "cfop", event.target.value)} />
                      </TableCell>
                      <TableCell>
                        <Input value={item.unit} onChange={(event) => updateItem(index, "unit", event.target.value)} />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(event) => updateItem(index, "quantity", Number(event.target.value) || 0)}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unitPrice}
                          onChange={(event) => updateItem(index, "unitPrice", Number(event.target.value) || 0)}
                        />
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(item.quantity * item.unitPrice)}
                      </TableCell>
                      <TableCell>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeItem(index)}
                          disabled={items.length === 1}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          <div className="grid gap-4 border-t border-border pt-8 xl:grid-cols-2">
            <Field label="Forma de pagamento" helper="O valor pago será o total automaticamente.">
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a forma de pagamento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dinheiro">01 - Dinheiro</SelectItem>
                  <SelectItem value="pix">17 - PIX</SelectItem>
                  <SelectItem value="cartao">03 - Cartão de crédito</SelectItem>
                </SelectContent>
              </Select>
            </Field>

            <Field label="Observações (infCpl)">
              <Textarea placeholder="Informações complementares..." className="min-h-[108px]" />
            </Field>
          </div>

          <Card className="border-border bg-card/50">
            <CardHeader className="space-y-1">
              <CardTitle className="text-xl">Última emissão</CardTitle>
              <p className="text-sm text-muted-foreground">Retorno da Nuvem Fiscal / SEFAZ</p>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Ainda não há emissão nesta sessão.</p>
            </CardContent>
          </Card>

          <div className="grid gap-4 border-t border-border pt-8 xl:grid-cols-[1.5fr_220px_220px]">
            <Field label="Baixar XML/DANFE por ID da Nuvem Fiscal (nfe_...)">
              <Input placeholder="Ex.: nfe_3a1e..." />
            </Field>
            <Button type="button" variant="outline" className="gap-2 self-end">
              <Download className="h-4 w-4" />
              XML
            </Button>
            <Button type="button" variant="outline" className="gap-2 self-end">
              <Download className="h-4 w-4" />
              PDF
            </Button>
          </div>

          <div className="space-y-4 border-t border-border pt-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-foreground">Histórico</h2>
                <p className="text-sm text-muted-foreground">Salvo localmente no navegador. Até 50 itens.</p>
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" className="gap-2">
                  <RotateCcw className="h-4 w-4" />
                  Recarregar
                </Button>
                <Button type="button" variant="destructive" className="gap-2">
                  <Trash2 className="h-4 w-4" />
                  Limpar
                </Button>
              </div>
            </div>

            <div className="overflow-x-auto rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>ID</TableHead>
                    <TableHead>Chave</TableHead>
                    <TableHead>Nº</TableHead>
                    <TableHead>Série</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell colSpan={7} className="py-12 text-center text-sm text-muted-foreground">
                      Nenhuma NF-e salva no histórico ainda.
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NFe;
