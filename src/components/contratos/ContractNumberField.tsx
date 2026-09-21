// src/components/contratos/ContractNumberField.tsx
// Campo "Número do contrato" usado na criação direta e na conversão de
// orçamento. A checagem de duplicidade aqui é só um aviso antecipado com os
// dados já carregados; a garantia real é a transação de criação
// (store/methods/contractCreate.ts) e as regras do Firestore.

import { useCallback, useEffect, useMemo, useState } from "react";
import { useStore } from "@/store";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";
import { duplicateContractMessage, formatContractId, parseContractNumber } from "@/lib/contract-number";

export function useContractNumber(active: boolean) {
  const { contracts, deletedContracts, getSuggestedContractNumber } = useStore();
  const [value, setValue] = useState("");
  const [suggestedId, setSuggestedId] = useState<string | null>(null);
  const [loadingSuggestion, setLoadingSuggestion] = useState(false);
  const [suggestionError, setSuggestionError] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const loadSuggestion = useCallback(async () => {
    setLoadingSuggestion(true);
    setSuggestionError(null);
    try {
      const id = await getSuggestedContractNumber();
      setSuggestedId(id);
      setValue(id);
      return id;
    } catch (err: any) {
      setSuggestionError("Não foi possível sugerir o próximo número. Informe o número manualmente.");
      console.error("Falha ao sugerir número de contrato:", err);
      return null;
    } finally {
      setLoadingSuggestion(false);
    }
  }, [getSuggestedContractNumber]);

  useEffect(() => {
    if (!active) return;
    setServerError(null);
    setValue("");
    setSuggestedId(null);
    loadSuggestion();
  }, [active, loadSuggestion]);

  const parsed = useMemo(() => parseContractNumber(value), [value]);

  // Contratos ativos e da Lixeira ocupam o número.
  const takenLocally = useMemo(() => {
    if (!parsed.ok) return false;
    return [...(contracts || []), ...(deletedContracts || [])].some((c: any) => c?.id === parsed.id);
  }, [parsed, contracts, deletedContracts]);

  const validationError = !parsed.ok
    ? parsed.error
    : takenLocally
      ? duplicateContractMessage(parsed.id!)
      : null;

  return {
    value,
    setValue: (v: string) => {
      setServerError(null);
      setValue(v);
    },
    suggestedId,
    loadingSuggestion,
    suggestionError,
    parsed,
    error: serverError || validationError,
    isValid: !loadingSuggestion && parsed.ok && !takenLocally,
    setServerError,
    reloadSuggestion: loadSuggestion,
  };
}

export type ContractNumberState = ReturnType<typeof useContractNumber>;

export function ContractNumberField({ state, disabled }: { state: ContractNumberState; disabled?: boolean }) {
  const { value, setValue, suggestedId, loadingSuggestion, suggestionError, parsed, error, reloadSuggestion } = state;
  const suggestedNumber = suggestedId ? parseContractNumber(suggestedId).number : null;

  const hints: string[] = [];
  if (!error && parsed.ok) {
    if (value !== parsed.id) hints.push(`Será salvo como ${parsed.id}.`);
    if (suggestedId && parsed.id !== suggestedId && suggestedNumber) {
      hints.push(
        parsed.number! > suggestedNumber
          ? `Número manual. Os próximos números automáticos continuarão a partir de ${formatContractId(parsed.number! + 1)}.`
          : "Número manual. A numeração automática não será alterada.",
      );
    }
  }
  const hint = hints.join(" ") || null;

  return (
    <div className="space-y-2">
      <Label htmlFor="contract-number" className="font-semibold">
        Número do contrato
      </Label>
      <div className="flex gap-2">
        <Input
          id="contract-number"
          data-testid="contract-number-input"
          value={value}
          placeholder={loadingSuggestion ? "Carregando..." : "CTR-000"}
          disabled={disabled || loadingSuggestion}
          maxLength={20}
          autoComplete="off"
          aria-invalid={!!error}
          aria-describedby="contract-number-help"
          className={error ? "border-destructive focus-visible:ring-destructive" : undefined}
          onChange={(e) => setValue(e.target.value)}
          onBlur={() => {
            if (parsed.ok && value !== parsed.id) setValue(parsed.id!);
          }}
        />
        {suggestedId && value !== suggestedId && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="shrink-0"
            disabled={disabled || loadingSuggestion}
            onClick={() => reloadSuggestion()}
            title="Voltar ao próximo número automático"
          >
            <RotateCcw className="mr-1 h-4 w-4" /> Usar automático
          </Button>
        )}
      </div>
      <div id="contract-number-help" className="text-xs" data-testid="contract-number-help">
        {error ? (
          <p className="text-destructive font-medium" role="alert">
            {error}
          </p>
        ) : suggestionError ? (
          <p className="text-destructive">{suggestionError}</p>
        ) : hint ? (
          <p className="text-muted-foreground">{hint}</p>
        ) : (
          <p className="text-muted-foreground">
            Sugerido automaticamente. Você pode alterá-lo antes de criar o contrato (formato CTR-120 ou apenas 120).
          </p>
        )}
      </div>
    </div>
  );
}
