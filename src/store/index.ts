import { create } from "zustand";

interface StoreState {
  equipments: any[];
  contracts: any[];
  sales: any[];
  revenues: any[];
  expenses: any[];
  loading: boolean;
  fetchAllData: () => Promise<void>;
}

export const useStore = create<StoreState>((set) => ({
  equipments: [],
  contracts: [],
  sales: [],
  revenues: [],
  expenses: [],
  loading: false,
  fetchAllData: async () => {
    set({ loading: true });
    try {
      // TODO: Integrar com backend (Lovable Cloud)
      // Por enquanto, dados vazios
      set({
        equipments: [],
        contracts: [],
        sales: [],
        revenues: [],
        expenses: [],
        loading: false,
      });
    } catch (error) {
      console.error("Erro ao buscar dados:", error);
      set({ loading: false });
    }
  },
}));
