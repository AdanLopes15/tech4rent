//src/pages/admin/NFe.tsx

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Copy, Download, FileCheck, Info, Plus, RefreshCcw, Send, Trash2, XCircle } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type {
  Ambiente,
  DestType,
  EmitResponse,
  EmitResponseBody,
  NfeFormState,
  NfeItemForm,
  SavedNfe,
} from "@/types/nfe";
import {
  calculateTotalProdutos,
  copyText,
  emitirNfe,
  getSuggestedCfop,
  mapEmitResponseToSavedNfe,
  openPdf,
  openXml,
  readNfeHistory,
  writeNfeHistory,
} from "@/services/nfeService";

const Field = ({ label, children, helper }: { label: string; children: ReactNode; helper?: string }) => (
  <div className="space-y-2">
    <div>
      <p className="text-sm font-medium text-foreground">{label}</p>
      {helper && <p className="text-xs text-muted-foreground">{helper}</p>}
    </div>
    {children}
  </div>
);

function statusBadge(status?: string) {
  if (!status) return <Badge variant="secondary">—</Badge>;

  const s = status.toLowerCase();

  if (s.includes("autoriz")) {
    return (
      <Badge className="gap-1">
        <CheckCircle2 className="h-3.5 w-3.5" />
        Autorizado
      </Badge>
    );
  }

  if (s.includes("rejeit")) {
    return (
      <Badge variant="destructive" className="gap-1">
        <XCircle className="h-3.5 w-3.5" />
        Rejeitado
      </Badge>
    );
  }

  if (s.includes("erro")) {
    return <Badge variant="destructive">Erro</Badge>;
  }

  return <Badge variant="secondary">{status}</Badge>;
}

const NFe = () => {
  const [form, setForm] = useState<NfeFormState>({
    ambiente: "homologacao",
    naturezaOperacao: "VENDA",

    emitCnpj: "44740821000130",
    emitRazao: "IAPONIRA CARDOSO DE OLIVEIRA GAIVOTA",
    emitIe: "587446757113",
    emitCrt: 4,
    emitCep: "13506610",
    emitLogradouro: "44 A",
    emitNumero: "499",
    emitBairro: "VILA NOVA",
    emitMun: "RIO CLARO",
    emitUf: "SP",
    emitCMun: 3543907,

    destTipo: "CPF",
    destCpfCnpj: "51510796894",
    destNome: "JOAO VITOR MORAIS",
    destCep: "13506175",
    destLogradouro: "Rua 5",
    destNumero: "296",
    destBairro: "PARQUE MAE PRETA",
    destMun: "RIO CLARO",
    destUf: "SP",
    destCMun: 3543907,

    formaPagamento: "01",
    observacoes: "",

    itens: [
      {
        descricao: "PRODUTO TESTE",
        ncm: "94033000",
        cest: "2806300",
        cfop: "5102",
        unidade: "UN",
        quantidade: 1,
        valorUnitario: 10,
      },
    ],
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastResult, setLastResult] = useState<EmitResponse | null>(null);
  const [history, setHistory] = useState<SavedNfe[]>([]);
  const [downloadId, setDownloadId] = useState("");

  useEffect(() => {
    setHistory(readNfeHistory());
  }, []);

  const { sameUf, suggestedCfop } = useMemo(
    () => getSuggestedCfop(form.emitUf, form.destUf),
    [form.emitUf, form.destUf],
  );

  const totalAmount = useMemo(() => calculateTotalProdutos(form.itens), [form.itens]);

  const setField = <K extends keyof NfeFormState>(key: K, value: NfeFormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const updateItem = (index: number, patch: Partial<NfeItemForm>) => {
    setForm((prev) => ({
      ...prev,
      itens: prev.itens.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)),
    }));
  };

  const addItem = () => {
    setForm((prev) => ({
      ...prev,
      itens: [
        ...prev.itens,
        {
          descricao: "",
          ncm: "",
          cest: "",
          cfop: suggestedCfop,
          unidade: "UN",
          quantidade: 1,
          valorUnitario: 0,
        },
      ],
    }));
  };

  const removeItem = (index: number) => {
    setForm((prev) => ({
      ...prev,
      itens: prev.itens.filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  const clearHistory = () => {
    setHistory([]);
    writeNfeHistory([]);
  };

  const handleEmitir = async () => {
    setIsSubmitting(true);
    setLastResult(null);

    try {
      const result = await emitirNfe(form);
      setLastResult(result);

      const body = result.body as EmitResponseBody;

      if (result?.ok && body?.id) {
        const item = mapEmitResponseToSavedNfe(body);
        const next = [item, ...history].slice(0, 50);
        setHistory(next);
        writeNfeHistory(next);
        setDownloadId(body.id);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro";
      setLastResult({
        ok: false,
        status: 500,
        body: { raw: message },
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const lastBody = lastResult?.body as EmitResponseBody | { raw: string } | undefined;
  const lastId =
    lastBody && typeof lastBody === "object" && "id" in lastBody ? (lastBody as EmitResponseBody).id : undefined;

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
              <Select value={form.ambiente} onValueChange={(value) => setField("ambiente", value as Ambiente)}>
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
              <Input
                value={form.naturezaOperacao}
                onChange={(event) => setField("naturezaOperacao", event.target.value)}
              />
            </Field>

            <div className="space-y-3 rounded-lg border border-border p-4">
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">Total</p>
                <div className="flex items-center justify-between gap-4 rounded-md border border-border bg-muted/20 px-3 py-2">
                  <span className="text-sm text-muted-foreground">Total da NF-e</span>
                  <span className="text-xl font-semibold text-foreground">{formatCurrency(totalAmount)}</span>
                </div>
              </div>

              <Button type="button" className="w-full gap-2" onClick={handleEmitir} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <RefreshCcw className="h-4 w-4 animate-spin" />
                    Emitindo...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Emitir NF-e
                  </>
                )}
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
                  <Input value={form.emitCnpj} onChange={(event) => setField("emitCnpj", event.target.value)} />
                </Field>

                <Field label="IE">
                  <Input value={form.emitIe} onChange={(event) => setField("emitIe", event.target.value)} />
                </Field>

                <div className="md:col-span-2">
                  <Field label="Razão social">
                    <Input value={form.emitRazao} onChange={(event) => setField("emitRazao", event.target.value)} />
                  </Field>
                </div>

                <Field label="CRT">
                  <Input
                    type="number"
                    value={form.emitCrt}
                    onChange={(event) => setField("emitCrt", Number(event.target.value || 0))}
                  />
                </Field>

                <Field label="CEP">
                  <Input value={form.emitCep} onChange={(event) => setField("emitCep", event.target.value)} />
                </Field>

                <Field label="Logradouro">
                  <Input
                    value={form.emitLogradouro}
                    onChange={(event) => setField("emitLogradouro", event.target.value)}
                  />
                </Field>

                <Field label="Número">
                  <Input value={form.emitNumero} onChange={(event) => setField("emitNumero", event.target.value)} />
                </Field>

                <Field label="Bairro">
                  <Input value={form.emitBairro} onChange={(event) => setField("emitBairro", event.target.value)} />
                </Field>

                <Field label="Município">
                  <Input value={form.emitMun} onChange={(event) => setField("emitMun", event.target.value)} />
                </Field>

                <Field label="UF">
                  <Input
                    value={form.emitUf}
                    onChange={(event) => setField("emitUf", event.target.value.toUpperCase())}
                  />
                </Field>

                <Field label="Código IBGE do município (cMun)">
                  <Input
                    type="number"
                    value={form.emitCMun}
                    onChange={(event) => setField("emitCMun", Number(event.target.value || 0))}
                  />
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
                  <Select value={form.destTipo} onValueChange={(value) => setField("destTipo", value as DestType)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CPF">CPF</SelectItem>
                      <SelectItem value="CNPJ">CNPJ</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>

                <Field label={form.destTipo}>
                  <Input value={form.destCpfCnpj} onChange={(event) => setField("destCpfCnpj", event.target.value)} />
                </Field>

                <div className="md:col-span-2">
                  <Field label="Nome/Razão">
                    <Input value={form.destNome} onChange={(event) => setField("destNome", event.target.value)} />
                  </Field>
                </div>

                <Field label="CEP">
                  <Input value={form.destCep} onChange={(event) => setField("destCep", event.target.value)} />
                </Field>

                <div className="hidden md:block" />

                <Field label="Logradouro">
                  <Input
                    value={form.destLogradouro}
                    onChange={(event) => setField("destLogradouro", event.target.value)}
                  />
                </Field>

                <Field label="Número">
                  <Input value={form.destNumero} onChange={(event) => setField("destNumero", event.target.value)} />
                </Field>

                <Field label="Bairro">
                  <Input value={form.destBairro} onChange={(event) => setField("destBairro", event.target.value)} />
                </Field>

                <Field label="Município">
                  <Input value={form.destMun} onChange={(event) => setField("destMun", event.target.value)} />
                </Field>

                <Field label="UF">
                  <Input
                    value={form.destUf}
                    onChange={(event) => setField("destUf", event.target.value.toUpperCase())}
                  />
                </Field>

                <Field label="Código IBGE do município (cMun)">
                  <Input
                    type="number"
                    value={form.destCMun}
                    onChange={(event) => setField("destCMun", Number(event.target.value || 0))}
                  />
                </Field>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4 border-t border-border pt-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-foreground">Itens</h2>
                <p className="text-sm text-muted-foreground">
                  CFOP sugerido: {suggestedCfop} ({sameUf ? "mesmo estado" : "outro estado"})
                </p>
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
                  {form.itens.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="py-12 text-center text-sm text-muted-foreground">
                        Nenhum item adicionado.
                      </TableCell>
                    </TableRow>
                  ) : (
                    form.itens.map((item, index) => (
                      <TableRow key={`${item.descricao}-${index}`}>
                        <TableCell>
                          <Input
                            value={item.descricao}
                            onChange={(event) => updateItem(index, { descricao: event.target.value })}
                          />
                        </TableCell>

                        <TableCell>
                          <Input
                            value={item.ncm}
                            onChange={(event) => updateItem(index, { ncm: event.target.value })}
                          />
                        </TableCell>

                        <TableCell>
                          <Input
                            value={item.cest || ""}
                            onChange={(event) => updateItem(index, { cest: event.target.value })}
                          />
                        </TableCell>

                        <TableCell>
                          <Input
                            value={item.cfop}
                            onChange={(event) => updateItem(index, { cfop: event.target.value })}
                          />
                        </TableCell>

                        <TableCell>
                          <Input
                            value={item.unidade}
                            onChange={(event) => updateItem(index, { unidade: event.target.value })}
                          />
                        </TableCell>

                        <TableCell>
                          <Input
                            type="number"
                            min="1"
                            value={item.quantidade}
                            onChange={(event) =>
                              updateItem(index, {
                                quantidade: Number(event.target.value) || 0,
                              })
                            }
                          />
                        </TableCell>

                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.valorUnitario}
                            onChange={(event) =>
                              updateItem(index, {
                                valorUnitario: Number(event.target.value) || 0,
                              })
                            }
                          />
                        </TableCell>

                        <TableCell className="text-right font-medium">
                          {formatCurrency(item.quantidade * item.valorUnitario)}
                        </TableCell>

                        <TableCell>
                          <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(index)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          <div className="grid gap-4 border-t border-border pt-8 xl:grid-cols-2">
            <Field label="Forma de pagamento" helper="O valor pago será o total automaticamente.">
              <Select
                value={form.formaPagamento}
                onValueChange={(value) => setField("formaPagamento", value as NfeFormState["formaPagamento"])}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a forma de pagamento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="01">01 - Dinheiro</SelectItem>
                  <SelectItem value="03">03 - Cartão de crédito</SelectItem>
                  <SelectItem value="04">04 - Cartão de débito</SelectItem>
                  <SelectItem value="05">05 - Crédito loja</SelectItem>
                  <SelectItem value="10">10 - Vale alimentação</SelectItem>
                  <SelectItem value="11">11 - Vale refeição</SelectItem>
                  <SelectItem value="12">12 - Vale presente</SelectItem>
                  <SelectItem value="13">13 - Vale combustível</SelectItem>
                  <SelectItem value="17">17 - PIX</SelectItem>
                  <SelectItem value="99">99 - Outros</SelectItem>
                </SelectContent>
              </Select>
            </Field>

            <Field label="Observações (infCpl)">
              <Textarea
                value={form.observacoes || ""}
                onChange={(event) => setField("observacoes", event.target.value)}
                placeholder="Informações complementares..."
                className="min-h-[108px]"
              />
            </Field>
          </div>

          <Card className="border-border bg-card/50">
            <CardHeader className="space-y-1">
              <CardTitle className="text-xl">Última emissão</CardTitle>
              <p className="text-sm text-muted-foreground">Retorno da Nuvem Fiscal / SEFAZ</p>
            </CardHeader>

            <CardContent className="space-y-4">
              {!lastResult ? (
                <p className="text-sm text-muted-foreground">Ainda não há emissão nesta sessão.</p>
              ) : (
                <>
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-3">
                      {statusBadge(
                        (lastBody as any)?.status ||
                          (lastBody as any)?.autorizacao?.status ||
                          ((lastBody as any)?.raw ? "erro" : undefined),
                      )}

                      <div className="text-sm text-muted-foreground">
                        HTTP interno: <span className="font-medium">{lastResult.status}</span>
                      </div>
                    </div>

                    {lastId ? (
                      <div className="flex flex-wrap gap-2">
                        <Button type="button" variant="outline" className="gap-2" onClick={() => openXml(lastId)}>
                          <Download className="h-4 w-4" />
                          XML
                        </Button>

                        <Button type="button" variant="outline" className="gap-2" onClick={() => openPdf(lastId)}>
                          <Download className="h-4 w-4" />
                          DANFE (PDF)
                        </Button>
                      </div>
                    ) : null}
                  </div>

                  <div className="rounded-md border p-3 text-sm">
                    <pre className="whitespace-pre-wrap break-words">{JSON.stringify(lastResult, null, 2)}</pre>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-4 border-t border-border pt-8 xl:grid-cols-[1.5fr_220px_220px]">
            <Field label="Baixar XML/DANFE por ID da Nuvem Fiscal (nfe_...)">
              <Input
                value={downloadId}
                onChange={(event) => setDownloadId(event.target.value)}
                placeholder="Ex.: nfe_3a1e..."
              />
            </Field>

            <Button
              type="button"
              variant="outline"
              className="gap-2 self-end"
              onClick={() => downloadId && openXml(downloadId)}
            >
              <Download className="h-4 w-4" />
              XML
            </Button>

            <Button
              type="button"
              variant="outline"
              className="gap-2 self-end"
              onClick={() => downloadId && openPdf(downloadId)}
            >
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
                <Button type="button" variant="outline" className="gap-2" onClick={() => setHistory(readNfeHistory())}>
                  <RefreshCcw className="h-4 w-4" />
                  Recarregar
                </Button>

                <Button type="button" variant="destructive" className="gap-2" onClick={clearHistory}>
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
                  {history.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="py-12 text-center text-sm text-muted-foreground">
                        Nenhuma NF-e salva no histórico ainda.
                      </TableCell>
                    </TableRow>
                  ) : (
                    history.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{statusBadge(item.status)}</TableCell>

                        <TableCell className="font-mono text-xs">
                          <div className="flex items-center gap-2">
                            <span className="max-w-[220px] truncate">{item.id}</span>
                            <Button type="button" variant="ghost" size="icon" onClick={() => copyText(item.id)}>
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>

                        <TableCell className="font-mono text-xs">
                          <div className="flex items-center gap-2">
                            <span className="max-w-[320px] truncate">{item.chave || "—"}</span>
                            {item.chave ? (
                              <Button type="button" variant="ghost" size="icon" onClick={() => copyText(item.chave!)}>
                                <Copy className="h-4 w-4" />
                              </Button>
                            ) : null}
                          </div>

                          {item.motivo ? (
                            <div className="mt-1 max-w-[380px] truncate text-xs text-muted-foreground">
                              {item.motivo}
                            </div>
                          ) : null}
                        </TableCell>

                        <TableCell>{item.numero ?? "—"}</TableCell>
                        <TableCell>{item.serie ?? "—"}</TableCell>
                        <TableCell>
                          {typeof item.valor_total === "number" ? formatCurrency(item.valor_total) : "—"}
                        </TableCell>

                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="gap-2"
                              onClick={() => openXml(item.id)}
                            >
                              <Download className="h-4 w-4" />
                              XML
                            </Button>

                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="gap-2"
                              onClick={() => openPdf(item.id)}
                            >
                              <Download className="h-4 w-4" />
                              PDF
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-muted/20 p-4 text-sm text-muted-foreground">
            <div className="flex items-start gap-2">
              <Info className="mt-0.5 h-4 w-4" />
              <div>
                Esta tela usa as Cloud Functions da Nuvem Fiscal e salva o histórico apenas no navegador via
                localStorage. Não depende do store do sistema.
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NFe;
