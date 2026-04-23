// src/lib/site-builder/history.ts
// Hook simples de histórico Undo/Redo para o Page Builder.

import { useCallback, useEffect, useRef, useState } from "react";

export function useHistory<T>(initial: T, limit = 50) {
  const [state, setState] = useState<T>(initial);
  const past = useRef<T[]>([]);
  const future = useRef<T[]>([]);
  const skipNext = useRef(false);

  // Reset histórico quando o estado inicial muda externamente (load do firestore)
  const reset = useCallback((next: T) => {
    past.current = [];
    future.current = [];
    skipNext.current = true;
    setState(next);
  }, []);

  const set = useCallback((updater: T | ((prev: T) => T)) => {
    setState((prev) => {
      const next = typeof updater === "function" ? (updater as (p: T) => T)(prev) : updater;
      if (skipNext.current) {
        skipNext.current = false;
        return next;
      }
      past.current.push(prev);
      if (past.current.length > limit) past.current.shift();
      future.current = [];
      return next;
    });
  }, [limit]);

  const undo = useCallback(() => {
    setState((prev) => {
      const prevState = past.current.pop();
      if (prevState === undefined) return prev;
      future.current.push(prev);
      skipNext.current = true;
      return prevState;
    });
  }, []);

  const redo = useCallback(() => {
    setState((prev) => {
      const nextState = future.current.pop();
      if (nextState === undefined) return prev;
      past.current.push(prev);
      skipNext.current = true;
      return nextState;
    });
  }, []);

  const canUndo = past.current.length > 0;
  const canRedo = future.current.length > 0;

  return { state, set, reset, undo, redo, canUndo, canRedo };
}

export function useUndoRedoShortcut(undo: () => void, redo: () => void) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      // não interceptar quando usuário está em campo digitável
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) {
        return;
      }
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;
      const key = e.key.toLowerCase();
      if (key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if ((key === "z" && e.shiftKey) || key === "y") {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undo, redo]);
}
