import { useCallback, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Download,
  FileCheck,
  Plus,
  RotateCcw,
  Send,
  Trash2,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import type {
  NFeEnvironment,
  NFePaymentMethod,
  NFeDocumentType,
  NFeItem,
  NFeEmitter,
  NFeRecipient,
  NFeHistoryEntry,
  NFeStatus,
} from "@/types/nfe";
import {
  createDefaultItem,
  defaultEmitter,
  defaultRecipient,
  calculateInvoiceTotal,
  getHistory,
  clearHistory,
  emitNFe,
  downloadXml,
  downloadPdf,
} from "@/services/nfeService";

// ── Tiny field wrapper ────────────────────────────────────────

const Field = ({
  label,
  children,
  helper,
}: {
  label: string;
  children: React.ReactNode;
  helper?: string;
}) => (
  <div className="space-y-2">
    <div>
      <p className="text-sm font-medium text-foreground">{label}</p>
      {helper && (
        <p className="text-xs text-muted-foreground">{helper}</p>
      )}
    </div>
    {children}
  </div>
);

// ── Status badge ──────────────────────────────────────────────

const statusColors: Record<NFeStatus, string> = {
  pendente: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  autorizada: "bg-green-500/20 text-green-400 border-green-500/30",
  rejeitada: "bg-red-500/20 text-red-400 border-red-500/30",
  cancelada: "bg-muted text-muted-foreground border-border",
  denegada: "bg-red-500/20 text-red-400 border-red-500/30",
};

const StatusBadge = ({ status }: { status: NFeStatus }) => (
  <Badge variant="outline" className={statusColors[status]}>
    {status.charAt(0).toUpperCase() + status.slice(1)}
  </Badge>
);

// ── Main page ─────────────────────────────────────────────────

const NFe = () => {
  const [environment, setEnvironment] = useState<NFeEnvironment>("homologacao");
  const [naturezaOperacao, setNaturezaOperacao] = useState("VENDA");
  const [paymentMethod, setPaymentMethod] =
    useState<NFePaymentMethod>("dinheiro");
  const [observations, setObservations] = useState("");
  const [items, setItems] = useState<NFeItem[]>([createDefaultItem()]);

  const [emitter, setEmitter] = useState<NFeEmitter>({ ...defaultEmitter });
  const [recipientType, setRecipientType] = useState<NFeDocumentType>("cpf");
  const [recipient, setRecipient] = useState<NFeRecipient>({
    ...defaultRecipient,
  });

  const [history, setHistory] = useState<NFeHistoryEntry[]>(getHistory);
  const [downloadId, setDownloadId] = useState("");
  const [isEmitting, setIsEmitting] = useState(false);

  const totalAmount = useMemo(() => calculateInvoiceTotal(items), [items]);

  // ── Item helpers ──────────────────────────────────────────

  const updateItem = useCallback(
    <K extends keyof NFeItem>(index: number, field: K, value: NFeItem[K]) => {
      setItems((prev) =>
        prev.map((item, i) =>
          i === index ? { ...item, [field]: value } : item,
        ),
      );
    },
    [],
  );

  const addItem = useCallback(
    () => setItems((prev) => [...prev, createDefaultItem()]),
    [],
  );

  const removeItem = useCallback(
    (index: number) =>
      setItems((prev) =>
        prev.length === 1 ? prev : prev.filter((_, i) => i !== index),
      ),
    [],
  );

  // ── Emitter / recipient helpers ───────────────────────────

  const updateEmitter = useCallback(
    <K extends keyof NFeEmitter>(field: K, value: NFeEmitter[K]) =>
      setEmitter((prev) => ({ ...prev, [field]: value })),
    [],
  );

  const updateRecipient = useCallback(
    <K extends keyof NFeRecipient>(field: K, value: NFeRecipient[K]) =>
      setRecipient((prev) => ({ ...prev, [field]: value })),
    [],
  );

  // ── Actions ───────────────────────────────────────────────

  const handleEmit = useCallback(async () => {
    setIsEmitting(true);
    try {
      const result = await emitNFe({
        environment,
        naturezaOperacao,
        emitter,
        recipient: { ...recipient, type: recipientType },
        items,
        paymentMethod,
        observations,
      });
      if (result.success && result.entry) {
        setHistory(getHistory());
        toast.success("NF-e emitida com sucesso!");
      } else {
        toast.info(result.message);
      }
    } catch {
      toast.error("Erro ao emitir NF-e.");
    } finally {
      setIsEmitting(false);
    }
  }, [
    environment,
    naturezaOperacao,
    emitter,
    recipient,
    recipientType,
    items,
    paymentMethod,
    observations,
  ]);

  const handleDownload = useCallback(
    async (type: "xml" | "pdf") => {
      if (!downloadId.trim()) {
        toast.warning("Informe o ID da NF-e.");
        return;
      }
      const fn = type === "xml" ? downloadXml : downloadPdf;
      const result = await fn(downloadId.trim());
      if (result.success) {
        toast.success(`${type.toUpperCase()} baixado com sucesso!`);
      } else {
        toast.info(result.message);
      }
    },
    [downloadId],
  );

  const handleClearHistory = useCallback(() => {
    clearHistory();
    setHistory([]);
    toast.success("Histórico limpo.");
  }, []);

  // ── Render ────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      <Card className="border-border">
        <CardHeader className="space-y-1">
          <CardTitle className="flex items-center gap-2 text-2xl">
            <FileCheck className="h-5 w-5 text-primary" />
            Emissão de NF-e
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Emita NF-e (homologação/produção), acompanhe status e baixe
            XML/DANFE.
          </p>
        </CardHeader>

        <CardContent className="space-y-8">
          {/* ── Top row: environment, natureza, total ── */}
          <div className="grid gap-4 xl:grid-cols-[1.2fr_1.2fr_1fr]">
            <Field
              label="Ambiente"
              helper="Produção exige credenciais/BASE_URL de produção."
            >
              <Select
                value={environment}
                onValueChange={(v) => setEnvironment(v as NFeEnvironment)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o ambiente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="homologacao">
                    Homologação (Sandbox)
                  </SelectItem>
                  <SelectItem value="producao">Produção</SelectItem>
                </SelectContent>
              </Select>
            </Field>

            <Field label="Natureza da operação">
              <Input
                value={naturezaOperacao}
                onChange={(e) => setNaturezaOperacao(e.target.value)}
              />
            </Field>

            <div className="space-y-3 rounded-lg border border-border p-4">
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">Total</p>
                <div className="flex items-center justify-between gap-4 rounded-md border border-border bg-muted/20 px-3 py-2">
                  <span className="text-sm text-muted-foreground">
                    Total da NF-e
                  </span>
                  <span className="text-xl font-semibold text-foreground">
                    {formatCurrency(totalAmount)}
                  </span>
                </div>
              </div>
              <Button
                type="button"
                className="w-full gap-2"
                onClick={handleEmit}
                disabled={isEmitting}
              >
                <Send className="h-4 w-4" />
                {isEmitting ? "Emitindo..." : "Emitir NF-e"}
              </Button>
            </div>
          </div>

          {/* ── Emitter / Recipient ── */}
          <div className="grid gap-4 xl:grid-cols-2">
            {/* Emitente */}
            <Card className="border-border bg-card/50">
              <CardHeader className="space-y-1">
                <CardTitle className="text-xl">Emitente</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Dados da sua empresa
                </p>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <Field label="CNPJ">
                  <Input
                    value={emitter.cnpj}
                    onChange={(e) => updateEmitter("cnpj", e.target.value)}
                  />
                </Field>
                <Field label="IE">
                  <Input
                    value={emitter.ie}
                    onChange={(e) => updateEmitter("ie", e.target.value)}
                  />
                </Field>
                <div className="md:col-span-2">
                  <Field label="Razão social">
                    <Input
                      value={emitter.razaoSocial}
                      onChange={(e) =>
                        updateEmitter("razaoSocial", e.target.value)
                      }
                    />
                  </Field>
                </div>
                <Field label="CRT">
                  <Input
                    value={emitter.crt}
                    onChange={(e) => updateEmitter("crt", e.target.value)}
                  />
                </Field>
                <Field label="CEP">
                  <Input
                    value={emitter.cep}
                    onChange={(e) => updateEmitter("cep", e.target.value)}
                  />
                </Field>
                <Field label="Logradouro">
                  <Input
                    value={emitter.logradouro}
                    onChange={(e) =>
                      updateEmitter("logradouro", e.target.value)
                    }
                  />
                </Field>
                <Field label="Número">
                  <Input
                    value={emitter.numero}
                    onChange={(e) => updateEmitter("numero", e.target.value)}
                  />
                </Field>
                <Field label="Bairro">
                  <Input
                    value={emitter.bairro}
                    onChange={(e) => updateEmitter("bairro", e.target.value)}
                  />
                </Field>
                <Field label="Município">
                  <Input
                    value={emitter.municipio}
                    onChange={(e) =>
                      updateEmitter("municipio", e.target.value)
                    }
                  />
                </Field>
                <Field label="UF">
                  <Input
                    value={emitter.uf}
                    onChange={(e) => updateEmitter("uf", e.target.value)}
                  />
                </Field>
                <Field label="Código IBGE do município (cMun)">
                  <Input
                    value={emitter.cMun}
                    onChange={(e) => updateEmitter("cMun", e.target.value)}
                  />
                </Field>
              </CardContent>
            </Card>

            {/* Destinatário */}
            <Card className="border-border bg-card/50">
              <CardHeader className="space-y-1">
                <CardTitle className="text-xl">Destinatário</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Cliente (CPF/CNPJ)
                </p>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <Field label="Tipo">
                  <Select
                    value={recipientType}
                    onValueChange={(v) =>
                      setRecipientType(v as NFeDocumentType)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cpf">CPF</SelectItem>
                      <SelectItem value="cnpj">CNPJ</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label={recipientType === "cpf" ? "CPF" : "CNPJ"}>
                  <Input
                    value={recipient.document}
                    onChange={(e) =>
                      updateRecipient("document", e.target.value)
                    }
                  />
                </Field>
                <div className="md:col-span-2">
                  <Field label="Nome/Razão">
                    <Input
                      value={recipient.name}
                      onChange={(e) =>
                        updateRecipient("name", e.target.value)
                      }
                    />
                  </Field>
                </div>
                <Field label="CEP">
                  <Input
                    value={recipient.cep}
                    onChange={(e) => updateRecipient("cep", e.target.value)}
                  />
                </Field>
                <div className="hidden md:block" />
                <Field label="Logradouro">
                  <Input
                    value={recipient.logradouro}
                    onChange={(e) =>
                      updateRecipient("logradouro", e.target.value)
                    }
                  />
                </Field>
                <Field label="Número">
                  <Input
                    value={recipient.numero}
                    onChange={(e) =>
                      updateRecipient("numero", e.target.value)
                    }
                  />
                </Field>
                <Field label="Bairro">
                  <Input
                    value={recipient.bairro}
                    onChange={(e) =>
                      updateRecipient("bairro", e.target.value)
                    }
                  />
                </Field>
                <Field label="Município">
                  <Input
                    value={recipient.municipio}
                    onChange={(e) =>
                      updateRecipient("municipio", e.target.value)
                    }
                  />
                </Field>
                <Field label="UF">
                  <Input
                    value={recipient.uf}
                    onChange={(e) => updateRecipient("uf", e.target.value)}
                  />
                </Field>
                <Field label="Código IBGE do município (cMun)">
                  <Input
                    value={recipient.cMun}
                    onChange={(e) => updateRecipient("cMun", e.target.value)}
                  />
                </Field>
              </CardContent>
            </Card>
          </div>

          {/* ── Items ── */}
          <div className="space-y-4 border-t border-border pt-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-foreground">
                  Itens
                </h2>
                <p className="text-sm text-muted-foreground">
                  CFOP sugerido: 5102 (mesmo estado)
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                className="gap-2"
                onClick={addItem}
              >
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
                    <TableRow key={item.id}>
                      <TableCell>
                        <Input
                          value={item.description}
                          onChange={(e) =>
                            updateItem(index, "description", e.target.value)
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={item.ncm}
                          onChange={(e) =>
                            updateItem(index, "ncm", e.target.value)
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={item.cest}
                          onChange={(e) =>
                            updateItem(index, "cest", e.target.value)
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={item.cfop}
                          onChange={(e) =>
                            updateItem(index, "cfop", e.target.value)
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={item.unit}
                          onChange={(e) =>
                            updateItem(index, "unit", e.target.value)
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) =>
                            updateItem(
                              index,
                              "quantity",
                              Number(e.target.value) || 0,
                            )
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unitPrice}
                          onChange={(e) =>
                            updateItem(
                              index,
                              "unitPrice",
                              Number(e.target.value) || 0,
                            )
                          }
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

          {/* ── Payment & observations ── */}
          <div className="grid gap-4 border-t border-border pt-8 xl:grid-cols-2">
            <Field
              label="Forma de pagamento"
              helper="O valor pago será o total automaticamente."
            >
              <Select
                value={paymentMethod}
                onValueChange={(v) =>
                  setPaymentMethod(v as NFePaymentMethod)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a forma de pagamento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dinheiro">01 - Dinheiro</SelectItem>
                  <SelectItem value="pix">17 - PIX</SelectItem>
                  <SelectItem value="cartao">
                    03 - Cartão de crédito
                  </SelectItem>
                </SelectContent>
              </Select>
            </Field>

            <Field label="Observações (infCpl)">
              <Textarea
                placeholder="Informações complementares..."
                className="min-h-[108px]"
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
              />
            </Field>
          </div>

          {/* ── Last emission ── */}
          <Card className="border-border bg-card/50">
            <CardHeader className="space-y-1">
              <CardTitle className="text-xl">Última emissão</CardTitle>
              <p className="text-sm text-muted-foreground">
                Retorno da Nuvem Fiscal / SEFAZ
              </p>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Ainda não há emissão nesta sessão.
              </p>
            </CardContent>
          </Card>

          {/* ── Download by ID ── */}
          <div className="grid gap-4 border-t border-border pt-8 xl:grid-cols-[1.5fr_220px_220px]">
            <Field label="Baixar XML/DANFE por ID da Nuvem Fiscal (nfe_...)">
              <Input
                placeholder="Ex.: nfe_3a1e..."
                value={downloadId}
                onChange={(e) => setDownloadId(e.target.value)}
              />
            </Field>
            <Button
              type="button"
              variant="outline"
              className="gap-2 self-end"
              onClick={() => handleDownload("xml")}
            >
              <Download className="h-4 w-4" />
              XML
            </Button>
            <Button
              type="button"
              variant="outline"
              className="gap-2 self-end"
              onClick={() => handleDownload("pdf")}
            >
              <Download className="h-4 w-4" />
              PDF
            </Button>
          </div>

          {/* ── History ── */}
          <div className="space-y-4 border-t border-border pt-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-foreground">
                  Histórico
                </h2>
                <p className="text-sm text-muted-foreground">
                  Salvo localmente no navegador. Até 50 itens.
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="gap-2"
                  onClick={() => setHistory(getHistory())}
                >
                  <RotateCcw className="h-4 w-4" />
                  Recarregar
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  className="gap-2"
                  onClick={handleClearHistory}
                >
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
                      <TableCell
                        colSpan={7}
                        className="py-12 text-center text-sm text-muted-foreground"
                      >
                        Nenhuma NF-e salva no histórico ainda.
                      </TableCell>
                    </TableRow>
                  ) : (
                    history.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell>
                          <StatusBadge status={entry.status} />
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {entry.nuvemFiscalId.slice(0, 12)}…
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {entry.chave
                            ? `${entry.chave.slice(0, 12)}…`
                            : "—"}
                        </TableCell>
                        <TableCell>{entry.numero || "—"}</TableCell>
                        <TableCell>{entry.serie || "—"}</TableCell>
                        <TableCell>
                          {formatCurrency(entry.valor)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setDownloadId(entry.nuvemFiscalId);
                                handleDownload("xml");
                              }}
                            >
                              <Download className="h-4 w-4" />
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
        </CardContent>
      </Card>
    </div>
  );
};

export default NFe;
