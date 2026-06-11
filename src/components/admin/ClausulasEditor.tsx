import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, Plus } from "lucide-react";

interface SubClause {
  id: string;
  text: string;
}

interface Clause {
  id: string;
  title: string;
  subClauses: SubClause[];
}

interface ClausulasEditorProps {
  initialClauses?: Clause[];
  onSave?: (clauses: Clause[]) => void;
  title: string;
  description: string;
}

const defaultLocacaoClauses: Clause[] = [
  {
    id: "1", title: "CLÁUSULA PRIMEIRA – OBJETO DO CONTRATO",
    subClauses: [
      { id: "1.1", text: "Parágrafo primeiro — A LOCADORA afirma que os equipamentos descritos estão em perfeitas condições de uso, sem apresentar defeitos aparentes ou ocultos que possam comprometer ou impedir sua utilização regular." },
      { id: "1.2", text: "Parágrafo segundo — A partir do momento em que os equipamentos forem entregues, a LOCATÁRIA se compromete a cuidar e conservar adequadamente os bens sob sua responsabilidade." },
      { id: "1.3", text: "Parágrafo terceiro — Por meio deste contrato, a LOCADORA entrega à LOCATÁRIA, para fins de locação, os equipamentos especificados, mediante o pagamento dos valores definidos na Cláusula Terceira." },
    ],
  },
  {
    id: "2", title: "CLÁUSULA SEGUNDA – PRAZO DA LOCAÇÃO",
    subClauses: [
      { id: "2.1", text: "A locação será de 12 (doze) meses, com início DATA descrita abaixo. Ao término da locação, os bens deverão ser devolvidos nas mesmas condições em que foram entregues." },
      { id: "2.2", text: "Parágrafo único — O contrato poderá ser renovado mediante aditivo, desde que uma das partes notifique a outra com pelo menos 5 (cinco) dias de antecedência do término do contrato." },
    ],
  },
  {
    id: "3", title: "CLÁUSULA TERCEIRA – VALOR E FORMA DE PAGAMENTO",
    subClauses: [
      { id: "3.1", text: "A LOCATÁRIA se compromete a pagar à LOCADORA, mediante boleto bancário, com vencimento informado no contrato." },
      { id: "3.2", text: "Parágrafo único — Alterações no valor somente com acordo formalizado entre as partes via termo aditivo." },
    ],
  },
  {
    id: "4", title: "CLÁUSULA QUARTA – DO ATRASO NO PAGAMENTO",
    subClauses: [
      { id: "4.1", text: "Pagamentos em atraso serão corrigidos com base na Tabela de Atualização Monetária do TJ/SP, acrescidos de multa de 1,5% e juros de 1% ao mês." },
    ],
  },
  {
    id: "5", title: "CLÁUSULA QUINTA – ENTREGA DOS EQUIPAMENTOS",
    subClauses: [
      { id: "5.1", text: "Os equipamentos serão entregues com nota fiscal de remessa, contendo nome, características e quantidade." },
      { id: "5.2", text: "Parágrafo único — Em caso de dano ou perda dos bens, a LOCADORA emitirá nota fiscal simbólica para formalizar a transferência da posse à LOCATÁRIA." },
    ],
  },
  {
    id: "6", title: "CLÁUSULA SEXTA – RESPONSABILIDADES DAS PARTES",
    subClauses: [
      { id: "6.1", text: "LOCADORA: emitir recibos, entregar e manter os equipamentos em perfeito estado, realizar vistorias, substituições em até 72 horas, atender chamados de suporte." },
      { id: "6.2", text: "LOCATÁRIA: pagar pontualmente, zelar pelo equipamento, assumir os custos por danos causados por mal uso, não contratar terceiros para manutenção sem autorização." },
    ],
  },
  {
    id: "7", title: "CLÁUSULA SÉTIMA – CESSÃO DE DIREITOS",
    subClauses: [
      { id: "7.1", text: "É vedada a transferência dos direitos e deveres deste contrato a terceiros, sem autorização expressa. O descumprimento implica rescisão e devolução dos bens." },
    ],
  },
  {
    id: "8", title: "CLÁUSULA OITAVA – MULTA CONTRATUAL",
    subClauses: [
      { id: "8.1", text: "A rescisão imotivada ou o descumprimento do contrato pela LOCATÁRIA ensejará o pagamento integral do valor do mês vigente e possíveis perdas e danos." },
    ],
  },
  {
    id: "9", title: "CLÁUSULA NONA – MULTA POR ATRASO NA DEVOLUÇÃO",
    subClauses: [
      { id: "9.1", text: "Havendo atraso na devolução, incidirá multa de 3% diários sobre o valor do contrato, mais valor proporcional da locação. Após 10 dias, a LOCADORA poderá considerar o bem como não devolvido." },
    ],
  },
  {
    id: "10", title: "CLÁUSULA DÉCIMA – FALÊNCIA OU RECUPERAÇÃO JUDICIAL",
    subClauses: [
      { id: "10.1", text: "Caso a LOCATÁRIA entre em falência ou recuperação judicial, o contrato será rescindido de pleno direito, cabendo à massa a devolução dos equipamentos." },
    ],
  },
  {
    id: "11", title: "CLÁUSULA DÉCIMA PRIMEIRA – FORO",
    subClauses: [
      { id: "11.1", text: "Fica eleito o foro da comarca de Rio Claro/SP para dirimir quaisquer questões oriundas deste contrato, com renúncia a qualquer outro." },
    ],
  },
];

const defaultVendaClauses: Clause[] = [
  {
    id: "v1", title: "CLÁUSULA PRIMEIRA – ESTADO DOS EQUIPAMENTOS",
    subClauses: [
      { id: "v1.1", text: "O COMPRADOR declara ter examinado os equipamentos descritos acima, recebendo-os em perfeitas condições de uso e funcionamento, conforme combinado entre as partes." },
    ],
  },
  {
    id: "v2", title: "CLÁUSULA SEGUNDA – GARANTIA",
    subClauses: [
      { id: "v2.1", text: "O VENDEDOR oferece garantia de 90 dias apenas para defeitos de fabricação, contados a partir da data deste recibo. Não estão cobertos pela garantia danos causados por: mau uso, quedas, variações de tensão elétrica, oxidação, tentativas de reparo por terceiros, desgaste natural ou uso indevido." },
    ],
  },
  {
    id: "v3", title: "CLÁUSULA TERCEIRA – IRRETRATABILIDADE",
    subClauses: [
      { id: "v3.1", text: "Esta venda é considerada irretratável e irrevogável, não cabendo cancelamento ou devolução dos produtos, salvo vício oculto comprovado dentro do prazo de garantia, se houver." },
    ],
  },
  {
    id: "v4", title: "CLÁUSULA QUARTA – PAGAMENTO",
    subClauses: [
      { id: "v4.1", text: "O COMPRADOR reconhece e assume total responsabilidade pelo cumprimento integral do acordo firmado nesta venda, comprometendo-se a efetuar os pagamentos nas condições ajustadas, sejam à vista, parcelados ou por meio de boletos bancários." },
    ],
  },
  {
    id: "v5", title: "CLÁUSULA QUINTA – ENTREGA",
    subClauses: [
      { id: "v5.1", text: "O VENDEDOR se compromete a entregar os equipamentos eletrônicos descritos neste recibo ao COMPRADOR. Após a entrega, o COMPRADOR deverá verificar imediatamente o estado dos equipamentos. Caso constate avarias ou divergências, deverá comunicar o VENDEDOR no prazo de até 24 horas para fins de análise e providências." },
    ],
  },
];

let idCounter = 100;
const genId = () => String(++idCounter);

const ClausulasEditor = ({ initialClauses, onSave, title, description }: ClausulasEditorProps) => {
  const [clauses, setClauses] = useState<Clause[]>([]);

  useEffect(() => {
    if (initialClauses && initialClauses.length > 0) {
      setClauses(initialClauses);
    } else if (!initialClauses || initialClauses.length === 0) {
      // Se não houver cláusulas iniciais (vazio do banco), usa o default apenas se for a primeira carga
      setClauses(defaultLocacaoClauses);
    }
  }, [initialClauses]);

  const updateClauseTitle = (clauseId: string, newTitle: string) => {
    setClauses((prev) => prev.map((c) => (c.id === clauseId ? { ...c, title: newTitle } : c)));
  };

  const updateSubClause = (clauseId: string, subId: string, text: string) => {
    setClauses((prev) =>
      prev.map((c) =>
        c.id === clauseId
          ? { ...c, subClauses: c.subClauses.map((s) => (s.id === subId ? { ...s, text } : s)) }
          : c
      )
    );
  };

  const addSubClause = (clauseId: string) => {
    setClauses((prev) =>
      prev.map((c) =>
        c.id === clauseId
          ? { ...c, subClauses: [...c.subClauses, { id: genId(), text: "" }] }
          : c
      )
    );
  };

  const removeSubClause = (clauseId: string, subId: string) => {
    setClauses((prev) =>
      prev.map((c) =>
        c.id === clauseId
          ? { ...c, subClauses: c.subClauses.filter((s) => s.id !== subId) }
          : c
      )
    );
  };

  const addClause = () => {
    setClauses((prev) => [...prev, { id: genId(), title: "", subClauses: [{ id: genId(), text: "" }] }]);
  };

  const removeClause = (clauseId: string) => {
    setClauses((prev) => prev.filter((c) => c.id !== clauseId));
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">{title}</h2>
        <p className="text-sm text-muted-foreground mt-1">{description}</p>
      </div>

      <div className="space-y-6">
        {clauses.map((clause, ci) => (
          <div key={clause.id} className="rounded-lg border border-border p-5 space-y-4">
            {/* Clause header */}
            <div className="flex items-start gap-3">
              <span className="text-sm font-bold text-primary mt-2.5 shrink-0">{ci + 1}.</span>
              <Textarea
                value={clause.title}
                onChange={(e) => updateClauseTitle(clause.id, e.target.value)}
                rows={2}
                className="font-medium"
              />
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0 text-destructive hover:text-destructive"
                onClick={() => removeClause(clause.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            {/* Sub-clauses */}
            <div className="space-y-3 ml-6">
              {clause.subClauses.map((sub, si) => (
                <div key={sub.id} className="flex items-start gap-3">
                  <span className="text-xs font-semibold text-primary mt-2.5 shrink-0">
                    {ci + 1}.{si + 1}
                  </span>
                  <Textarea
                    value={sub.text}
                    onChange={(e) => updateSubClause(clause.id, sub.id, e.target.value)}
                    rows={3}
                    className="text-sm"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0 text-destructive hover:text-destructive"
                    onClick={() => removeSubClause(clause.id, sub.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            <Button variant="outline" size="sm" onClick={() => addSubClause(clause.id)} className="ml-6 gap-1">
              <Plus className="h-3 w-3" /> Adicionar Sub-Cláusula ({ci + 1})
            </Button>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={addClause} className="gap-1">
          <Plus className="h-4 w-4" /> Adicionar Cláusula Principal
        </Button>
      </div>

      <Button onClick={() => onSave?.(clauses)}>Salvar Alterações</Button>
    </div>
  );
};

export { ClausulasEditor, defaultLocacaoClauses, defaultVendaClauses };
export type { Clause };
export default ClausulasEditor;
