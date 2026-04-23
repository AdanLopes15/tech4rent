//src/store/index.ts

import { create } from "zustand";
import {
  collection,
  getDocs,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  getDoc,
  query,
  orderBy,
  limit,
  where,
  addDoc,
  serverTimestamp,
  Timestamp,
  type DocumentData,
  type DocumentSnapshot,
  type QuerySnapshot,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  type User,
} from "firebase/auth";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { db, auth, storage } from "@/lib/firebase";
import { getNextId as getNextIdUtil } from "./utils";
import { format, differenceInMonths, addMonths, addDays, addYears, addWeeks, getDate } from "date-fns";
import { addSale, updateSale, cancelSale, deleteSale } from "./methods/sales";

export type Differentiator = {
  title: string;
  description: string;
};

export type MediaSource = {
  imageUrl?: string;
  videoUrl?: string;
};

export type StatItem = { icon?: string; value: string; label: string };
export type IconTextItem = { icon?: string; title: string; description?: string };
export type SimpleLinkItem = { label: string; url?: string };

/* ===========================
 * Estrutura COMPLETA editável
 * =========================== */
export type SiteContent = {
  /* Compatibilidade com versão anterior (usada em vários lugares) */
  hero: {
    title: string;
    subtitle: string;
    backgroundImageUrl: string;
    backgroundVideoUrl?: string;
    primaryCtaLabel?: string;
    secondaryCtaLabel?: string;
  };
  featuredProduct: {
    tag: string;
    title: string;
    description: string;
    imageUrl: string;
    backgroundImageUrl: string;
    backgroundVideoUrl?: string;
  };
  productHighlight?: {
    backgroundImageUrl?: string;
  };
  differentiators: {
    title: string;
    subtitle?: string;
    items: Differentiator[];
  };
  about: {
    title: string;
    description: string;
    backgroundImageUrl: string;
    backgroundVideoUrl?: string;
  };
  contact: {
    title?: string;
    description?: string;
    backgroundImageUrl: string;
    backgroundVideoUrl?: string;
  };

  /* ====== HOME (página inicial) ====== */
  home?: {
    benefits?: { title: string; description: string; icon?: string }[];
    equipmentHeader?: { eyebrow?: string; title?: string; subtitle?: string };
    presence?: {
      logosTitle?: string;
      logos?: string[];
      sectionTitle?: string;
      stats?: StatItem[];
      segmentsTitle?: string;
      segments?: IconTextItem[];
    };
    results?: {
      eyebrow?: string;
      title?: string;
      items?: { tag: string; title: string; description: string; icon?: string }[];
    };
    video?: {
      title?: string;
      videoUrl?: string;
      placeholderTopText?: string;
      placeholderBottomText?: string;
    };
  };

  /* ====== PRODUTOS ====== */
  produtos?: {
    hero?: { title?: string; subtitle?: string; ctaLabel?: string };
    emptyTitle?: string;
    emptySubtitle?: string;
    fallbackTags?: { icon?: string; label: string }[];
  };

  /* ====== SOBRE ====== */
  sobre?: {
    hero?: { eyebrow?: string; title?: string; subtitle?: string; backgroundImageUrl?: string; backgroundVideoUrl?: string };
    quemSomos?: { eyebrow?: string; title?: string; titleHighlight?: string; paragraphs?: string[] };
    mvp?: { icon?: string; title: string; text: string }[];
    stats?: StatItem[];
    estrutura?: {
      eyebrow?: string;
      title?: string;
      items?: { title: string; description: string; imageUrl?: string }[];
    };
    duvidas?: {
      eyebrow?: string;
      title?: string;
      items?: { icon?: string; text: string }[];
    };
    valores?: {
      eyebrow?: string;
      title?: string;
      items?: { icon?: string; title: string; description: string }[];
    };
    localizacao?: {
      eyebrow?: string;
      title?: string;
    };
    cta?: { title?: string; subtitle?: string; buttonLabel?: string };
  };

  /* ====== CONTATO ====== */
  contato?: {
    hero?: { eyebrow?: string; title?: string; subtitle?: string; backgroundImageUrl?: string; backgroundVideoUrl?: string };
    channels?: { icon?: string; title: string; subtitle: string; value: string; actionLabel?: string }[];
    form?: { eyebrow?: string; title?: string; subtitle?: string; submitLabel?: string; whatsappLabel?: string; interests?: string[] };
  };

  /* ====== NAVBAR ====== */
  navbar?: {
    productsLabel?: string;
    questionsLabel?: string;
    aboutLabel?: string;
    contactLabel?: string;
    ctaLabel?: string;
    restrictedAreaLabel?: string;
  };

  /* ====== FOOTER ====== */
  footer?: {
    tagline?: string;
    columns?: {
      title: string;
      items: string[];
    }[];
    hoursLabel?: string;
    copyrightExtra?: string;
    restrictedAreaLabel?: string;
  };
};

export type SectionStyle = {
  backgroundColor: string;
  titleColor: string;
  textColor: string;
  accentColor: string;
};

export type StyleSettings = {
  typography: {
    heading: { fontSize: string; fontWeight: string };
    body: { fontSize: string; fontWeight: string };
  };
  sectionOrder: string[];
  sections: Record<string, SectionStyle>;
};

export interface CompanySettings {
  name: string;
  fantasyName: string;
  cnpj: string;
  phone: string;
  email: string;
  logoUrl: string;
  siteLogoUrl: string;
  instagramUrl?: string;
  youtubeUrl?: string;
  linkedinUrl?: string;
  address: {
    cep: string;
    logradouro: string;
    numero: string;
    complemento: string;
    bairro: string;
    localidade: string;
    uf: string;
  };
  siteContent: SiteContent;
  styleSettings: StyleSettings;
}

export interface SmtpSettings {
  server: string;
  port: number;
  user: string;
  password?: string;
  senderEmail: string;
}

export interface SubClause {
  id: number;
  text: string;
}

export interface Clause {
  id: number;
  text: string;
  subClauses: SubClause[];
}

type State = {
  user: User | null;
  clients: any[];
  equipments: any[];
  contracts: any[];
  sales: any[];
  quotes: any[];
  suppliers: any[];
  purchaseOrders: any[];
  bankAccounts: any[];
  costCenters: any[];
  chartOfAccounts: any[];
  revenues: any[];
  expenses: any[];
  collaborators: any[];
  systemUsers: any[];
  siteContacts: any[];
  notifications: any[];
  companySettings: CompanySettings;
  smtpSettings: SmtpSettings;
  rentalClauses: Clause[];
  saleClauses: Clause[];
  loading: boolean;
  isQuoteDialogOpen: boolean;
};

type Actions = {
  fetchAllData: (publicOnly?: boolean) => Promise<void>;
  getNextId: (collectionName: string) => Promise<string>;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setQuoteDialogOpen: (isOpen: boolean) => void;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  addClient: (client: any) => Promise<void>;
  updateClient: (client: any) => Promise<void>;
  deleteClient: (clientId: string) => Promise<void>;
  addEquipment: (equipment: any) => Promise<void>;
  updateEquipment: (equipment: any) => Promise<void>;
  deleteEquipment: (equipmentId: string) => Promise<void>;
  addQuote: (quoteData: any) => Promise<any>;
  updateQuote: (quoteData: any) => Promise<void>;
  deleteQuote: (quoteId: string) => Promise<void>;
  convertQuoteToContract: (quoteId: string) => Promise<any>;
  addContract: (contractData: any) => Promise<any>;
  updateContract: (contractData: any) => Promise<void>;
  recalculateContractInstallments: (contractId: string) => Promise<void>;
  finalizeContract: (contractId: string, fineAmount: number, itemStatuses: any[]) => Promise<void>;
  deleteContract: (contractId: string) => Promise<void>;
  attachSignedContract: (contractId: string, file: File) => Promise<void>;
  deleteSignedContract: (contractId: string) => Promise<void>;
  addSale: (saleData: any) => Promise<any>;
  updateSale: (saleData: any) => Promise<void>;
  cancelSale: (saleId: string) => Promise<void>;
  deleteSale: (saleId: string) => Promise<void>;
  addSystemUser: (userData: any) => Promise<void>;
  updateSystemUser: (userData: any) => Promise<void>;
  deleteSystemUser: (uid: string) => Promise<void>;
  addSupplier: (supplier: any) => Promise<void>;
  updateSupplier: (supplier: any) => Promise<void>;
  deleteSupplier: (supplierId: string) => Promise<void>;
  addPurchaseOrder: (order: any) => Promise<void>;
  updatePurchaseOrder: (order: any) => Promise<void>;
  deletePurchaseOrder: (orderId: string) => Promise<void>;
  addCollaborator: (collaborator: any) => Promise<void>;
  updateCollaborator: (collaborator: any) => Promise<void>;
  deleteCollaborator: (collaboratorId: string) => Promise<void>;
  addRevenue: (revenue: any) => Promise<void>;
  updateRevenue: (revenue: any) => Promise<void>;
  deleteRevenue: (revenueId: string) => Promise<void>;
  markRevenueAsReceived: (revenueId: string) => Promise<void>;
  markRevenueAsPending: (revenueId: string) => Promise<void>;
  attachBoletoToRevenue: (revenueId: string, file: File) => Promise<void>;
  deleteBoletoFromRevenue: (revenueId: string) => Promise<void>;
  addExpense: (expense: any) => Promise<void>;
  updateExpense: (expense: any) => Promise<void>;
  deleteExpense: (expenseId: string) => Promise<void>;
  markExpenseAsPaid: (expenseId: string) => Promise<void>;
  unmarkExpenseAsPaid: (expenseId: string) => Promise<void>;
  attachReceiptToExpense: (expenseId: string, file: File) => Promise<void>;
  deleteReceiptFromExpense: (expenseId: string) => Promise<void>;
  addTransfer: (
    fromAccountId: string,
    toAccountId: string,
    amount: number,
    date: Date,
    description?: string,
  ) => Promise<void>;
  updateSiteContact: (contactId: string, data: any) => Promise<void>;
  deleteSiteContact: (contactId: string) => Promise<void>;
  addCostCenter: (costCenter: any) => Promise<void>;
  updateCostCenter: (costCenter: any) => Promise<void>;
  deleteCostCenter: (costCenterId: string) => Promise<void>;
  addChartOfAccount: (account: any) => Promise<void>;
  updateChartOfAccount: (account: any) => Promise<void>;
  deleteChartOfAccount: (accountId: string) => Promise<void>;
  addBankAccount: (account: any) => Promise<void>;
  updateBankAccount: (account: any) => Promise<void>;
  deleteBankAccount: (accountId: string) => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  clearAllNotifications: () => Promise<void>;
  updateCompanySettings: (
    settings: CompanySettings,
    logoFile: File | null,
    siteLogoFile: File | null,
    siteContent: SiteContent,
    siteFiles: { [key: string]: File | null },
    styleSettings: StyleSettings,
  ) => Promise<void>;
  updateSiteContent: (
    siteContent: SiteContent,
    siteFiles: { [path: string]: File | null },
  ) => Promise<void>;
  updateSmtpSettings: (settings: SmtpSettings) => Promise<void>;
  updateRentalClauses: (clauses: Clause[]) => Promise<void>;
  updateSaleClauses: (clauses: Clause[]) => Promise<void>;
};

const defaultSectionStyles: SectionStyle = {
  backgroundColor: "#ffffff",
  titleColor: "#000000",
  textColor: "#333333",
  accentColor: "#2563eb",
};

const initialCompanySettings: CompanySettings = {
  name: "TECH4RENT LTDA.",
  fantasyName: "TECH4RENT",
  cnpj: "00.111.222/0001-33",
  phone: "(19) 97107-6928",
  email: "vendas@tech4rent.com.br",
  logoUrl: "",
  siteLogoUrl: "",
  instagramUrl: "",
  youtubeUrl: "",
  linkedinUrl: "",
  address: {
    cep: "01311-000",
    logradouro: "Avenida Paulista",
    numero: "1578",
    complemento: "Andar 8",
    bairro: "Bela Vista",
    localidade: "São Paulo",
    uf: "SP",
  },
  siteContent: {
    hero: {
      title: "Soluções em Equipamentos para sua Empresa",
      subtitle: "Qualidade, segurança e a tecnologia que você precisa para alcançar os melhores resultados.",
      backgroundImageUrl: "",
      backgroundVideoUrl: "",
      primaryCtaLabel: "Ver Catálogo",
      secondaryCtaLabel: "Falar no WhatsApp",
    },
    featuredProduct: {
      tag: "Soluções para grandes empresas",
      title: "PDA TC60 - Mais rápido do mercado!",
      description:
        "A TECH4RENT oferece soluções de automação personalizadas, colaborando com fabricantes para garantir ofertas competitivas e prazos rápidos. A gestão de projetos e a supervisão técnica asseguram a qualidade. Fornecemos suporte especializado na aplicação inicial e realizamos testes completos na instalação para garantir desempenho máximo. Com a Tech4Rent, sua operação é transformada com tecnologia de ponta e suporte dedicado.",
      imageUrl: "https://placehold.co/400x400.png",
      backgroundImageUrl: "",
    },
    productHighlight: { backgroundImageUrl: "" },
    differentiators: {
      title: "Nossos Diferenciais",
      items: [
        { title: "Qualidade Garantida", description: "Equipamentos modernos e com manutenção em dia para sua segurança." },
        { title: "Atendimento Especializado", description: "Nossa equipe está pronta para te ajudar a escolher a melhor solução." },
        { title: "Suporte Completo", description: "Oferecemos suporte técnico durante todo o período de locação." },
      ],
    },
    about: {
      title: "Sobre Nós",
      description:
        "Com anos de experiência no mercado, somos especialistas em fornecer os melhores equipamentos para construção civil e indústrias. Nossa missão é garantir a eficiência e a segurança do seu projeto com um catálogo moderno e um atendimento de excelência.",
      backgroundImageUrl: "",
    },
    contact: { backgroundImageUrl: "" },

    home: {
      benefits: [
        { icon: "Shield", title: "Garantia de 1 ano", description: "Todos os produtos com garantia" },
        { icon: "BriefcaseBusiness", title: "Solução para sua operação", description: "Indicação conforme sua rotina logística" },
        { icon: "Headphones", title: "Suporte especializado", description: "Atendimento técnico dedicado" },
      ],
      equipmentHeader: { eyebrow: "Catálogo", title: "Equipamentos em destaque", subtitle: "Conheça os principais produtos da nossa frota." },
      presence: {
        logosTitle: "Empresas que tiveram resultados com a Tech4Rent",
        logos: ["Pelog", "Memphis Courier", "CEVA Logistics", "VDC Log", "Porto Guimarães", "Maxton"],
        sectionTitle: "Presença em todo o Brasil",
        stats: [
          { icon: "Package", value: "10.000+", label: "Aparelhos em operação" },
          { icon: "Users", value: "1.000+", label: "Clientes ativos" },
          { icon: "MapPin", value: "20+", label: "Estados atendidos" },
        ],
        segmentsTitle: "Segmentos atendidos",
        segments: [
          { icon: "Truck", title: "Logística & Transporte" },
          { icon: "ShoppingCart", title: "E-commerce & Fulfillment" },
          { icon: "Warehouse", title: "Varejo & Atacado" },
          { icon: "Factory", title: "Indústria & Manufatura" },
          { icon: "Heart", title: "Saúde & Hospitalar" },
          { icon: "Package", title: "Alimentício & Frigorífico" },
        ],
      },
      results: {
        eyebrow: "Cases",
        title: "Resultados reais de quem usa Tech4Rent",
        items: [
          { icon: "TrendingUp", tag: "E-commerce", title: "Redução de 40% nos erros de leitura", description: "Operação de picking com SKUs migrou de coletores antigos para equipamentos atualizados. Os erros de separação caíram quase pela metade." },
          { icon: "Zap", tag: "Logística", title: "2x mais agilidade no picking", description: "Transportadora substituiu leitores convencionais por PDAs com leitor 2D integrado. O tempo médio de separação por pedido caiu de 4 para 2 minutos." },
          { icon: "Clock", tag: "Distribuição", title: "Implantação em 5 dias úteis", description: "Distribuidora recebeu equipamentos configurados e prontos para uso. Operação rodando sem paradas desde o primeiro dia." },
        ],
      },
      video: {
        title: "Veja na prática",
        videoUrl: "",
        placeholderTopText: "Coletor de dados",
        placeholderBottomText: "TC60",
      },
    },

    produtos: {
      hero: { title: "Catálogo de Produtos", subtitle: "Coletores, leitores e impressoras para sua operação", ctaLabel: "Baixar Catálogo PDF" },
      emptyTitle: "Nenhum produto encontrado",
      emptySubtitle: "Tente ajustar sua busca ou remover filtros.",
      fallbackTags: [
        { icon: "Smartphone", label: "Android" },
        { icon: "Wifi", label: "Wi-Fi" },
        { icon: "Bluetooth", label: "Bluetooth" },
        { icon: "Usb", label: "USB" },
      ],
    },

    sobre: {
      hero: {
        eyebrow: "Desde 2020 · Rio Claro, SP",
        title: "Sobre a TECH4RENT",
        subtitle: "Tecnologia e equipamentos para quem move o Brasil",
        backgroundImageUrl: "",
        backgroundVideoUrl: "",
      },
      quemSomos: {
        eyebrow: "Quem somos",
        title: "Uma marca brasileira",
        titleHighlight: "feita para o campo de operação",
        paragraphs: [
          "A TECH4RENT é uma marca brasileira especializada em locação e venda de equipamentos para operações de logística, estoque e varejo. Desenvolvemos soluções robustas, pensadas para o dia a dia intenso das operações no Brasil.",
          "Nossos equipamentos são projetados para entregar performance, durabilidade e conectividade, atendendo desde pequenas empresas até grandes centros de distribuição.",
          "Garantimos atendimento próximo, suporte técnico especializado e condições comerciais competitivas para empresas de todos os portes.",
        ],
      },
      mvp: [
        { icon: "Target", title: "Missão", text: "Fornecer soluções tecnológicas que aceleram e simplificam operações de logística e varejo em todo o Brasil." },
        { icon: "Eye", title: "Visão", text: "Ser referência nacional em equipamentos para automação de operações, reconhecida pela qualidade e atendimento." },
        { icon: "Heart", title: "Propósito", text: "Empoderar empresas com tecnologia que transforma a eficiência e competitividade de suas operações." },
      ],
      stats: [
        { value: "500+", label: "Clientes atendidos" },
        { value: "20+", label: "Estados atendidos" },
        { value: "98%", label: "Satisfação" },
      ],
      estrutura: {
        eyebrow: "Por dentro",
        title: "Conheça nossa estrutura",
        items: [
          { title: "Entrada Tech4Rent", description: "Estrutura preparada para receber clientes e parceiros com conforto e profissionalismo.", imageUrl: "" },
          { title: "Bancada de suporte", description: "Equipamentos testados e configurados antes do envio, com diagnóstico técnico e reparo.", imageUrl: "" },
          { title: "Equipamentos em operação", description: "PDAs, leitores e impressoras em uso no dia a dia de centros de distribuição e operações logísticas.", imageUrl: "" },
        ],
      },
      duvidas: {
        eyebrow: "Confiança",
        title: "Por que escolher a TECH4RENT?",
        items: [
          { icon: "BR", text: "Empresa 100% brasileira" },
          { icon: "🛠️", text: "Suporte técnico no Brasil" },
          { icon: "✅", text: "Garantia de 1 ano" },
          { icon: "🎯", text: "Atendimento técnico dedicado" },
          { icon: "💪", text: "Robustez garantida na operação" },
        ],
      },
      valores: {
        eyebrow: "Princípios",
        title: "Nossos Valores",
        items: [
          { icon: "Shield", title: "Confiança", description: "Produtos de qualidade com garantia e suporte técnico no Brasil." },
          { icon: "Zap", title: "Agilidade", description: "Atendimento rápido e entregas em todo o Brasil." },
          { icon: "Users", title: "Parceria", description: "Relações de longo prazo com clientes, equipes e parceiros." },
        ],
      },
      localizacao: { eyebrow: "Localização", title: "Onde Estamos" },
      cta: {
        title: "Pronto para modernizar sua operação?",
        subtitle: "Fale com nosso time comercial e descubra o melhor equipamento para sua necessidade.",
        buttonLabel: "Falar com especialista",
      },
    },

    contato: {
      hero: {
        eyebrow: "Fale conosco",
        title: "Contato",
        subtitle: "Estamos prontos para ajudar. Escolha o melhor canal para falar conosco.",
        backgroundImageUrl: "",
        backgroundVideoUrl: "",
      },
      channels: [
        { icon: "MessageCircle", title: "WhatsApp", subtitle: "Atendimento rápido e direto", value: "", actionLabel: "Iniciar conversa" },
        { icon: "Mail", title: "E-mail", subtitle: "Para orçamentos e documentos", value: "", actionLabel: "Enviar e-mail" },
        { icon: "Clock", title: "Horário", subtitle: "Atendimento comercial", value: "Segunda a Sexta, 8h às 18h" },
        { icon: "MapPin", title: "Localização", subtitle: "Atendemos todo o Brasil", value: "" },
      ],
      form: {
        eyebrow: "Formulário",
        title: "Envie sua mensagem",
        subtitle: "Preencha o formulário e entraremos em contato",
        submitLabel: "Enviar Mensagem",
        whatsappLabel: "Prefiro WhatsApp",
        interests: ["Locação de equipamentos", "Compra de equipamentos", "Assistência técnica", "Suporte comercial"],
      },
    },

    navbar: {
      productsLabel: "Produtos",
      questionsLabel: "Dúvidas",
      aboutLabel: "Sobre",
      contactLabel: "Contato",
      ctaLabel: "Fale Conosco",
      restrictedAreaLabel: "Área Restrita",
    },

    footer: {
      tagline: "Coletores, leitores, tablets e equipamentos para logística e operação.",
      columns: [
        { title: "Navegação", items: ["Produtos", "Coletores PDA", "Leitores de Código", "Impressoras Térmicas"] },
        { title: "Institucional", items: ["Sobre a Tech4Rent", "Suporte e Contato", "Política de Devolução", "Dúvidas Frequentes"] },
      ],
      hoursLabel: "Segunda a Sexta, 8h às 18h",
      copyrightExtra: "Empresa orgulhosamente brasileira BR",
      restrictedAreaLabel: "Área Restrita",
    },
  },
  styleSettings: {
    typography: {
      heading: { fontSize: "2.25rem", fontWeight: "700" },
      body: { fontSize: "1rem", fontWeight: "400" },
    },
    sectionOrder: ["hero", "contactBar", "featuredProduct", "productHighlight", "differentiators", "about", "contact"],
    sections: {
      hero: {
        ...defaultSectionStyles,
        backgroundColor: "#1f2937",
        titleColor: "#ffffff",
        textColor: "#e5e7eb",
        accentColor: "#f97316",
      },
      contactBar: {
        ...defaultSectionStyles,
        backgroundColor: "#111827",
        titleColor: "#ffffff",
        textColor: "#f3f4f6",
        accentColor: "#ffffff",
      },
      featuredProduct: {
        ...defaultSectionStyles,
        backgroundColor: "#ffffff",
        accentColor: "#f97316",
      },
      productHighlight: {
        ...defaultSectionStyles,
        backgroundColor: "#f9fafb",
        accentColor: "#f97316",
      },
      differentiators: {
        ...defaultSectionStyles,
        backgroundColor: "#ffffff",
        accentColor: "#f97316",
      },
      about: {
        ...defaultSectionStyles,
        backgroundColor: "#f9fafb",
        accentColor: "#f97316",
      },
      contact: {
        ...defaultSectionStyles,
        backgroundColor: "#374151",
        titleColor: "#ffffff",
        textColor: "#d1d5db",
        accentColor: "#f97316",
      },
    },
  },
};

const initialSmtpSettings: SmtpSettings = {
  server: "smtp.example.com",
  port: 587,
  user: "seu-email@example.com",
  password: "",
  senderEmail: "contato@sua-empresa.com",
};

const initialRentalClauses: Clause[] = [
  {
    id: 1,
    text: "O locatário se responsabiliza pela guarda e bom uso do equipamento.",
    subClauses: [],
  },
  {
    id: 2,
    text: "Qualquer dano ao equipamento será de responsabilidade do locatário.",
    subClauses: [],
  },
];

const initialSaleClauses: Clause[] = [
  {
    id: 1,
    text: "Garantia de 90 (noventa) dias contra defeitos de fabricação, não cobrindo mau uso.",
    subClauses: [],
  },
];

const useStore = create<State & Actions>((set, get) => {
  const centralValidateDocument = (
    document: string,
    entityType: "client" | "supplier" | "employee",
    entityId: string | null,
  ): void => {
    if (!document) return;
    const sanitizedDoc = document.replace(/\D/g, "");
    if (!sanitizedDoc) return;

    const { clients, suppliers, collaborators } = get();
    let isDuplicate = false;

    switch (entityType) {
      case "client":
        isDuplicate = clients.some(
          (c) =>
            c.id !== entityId &&
            (c.cnpj?.replace(/\D/g, "") === sanitizedDoc || c.cpf?.replace(/\D/g, "") === sanitizedDoc),
        );
        break;
      case "supplier":
        isDuplicate = suppliers.some(
          (s) =>
            s.id !== entityId &&
            (s.cnpj?.replace(/\D/g, "") === sanitizedDoc || s.cpf?.replace(/\D/g, "") === sanitizedDoc),
        );
        break;
      case "employee":
        isDuplicate = collaborators.some((e) => e.id !== entityId && e.cpf?.replace(/\D/g, "") === sanitizedDoc);
        break;
    }

    if (isDuplicate) {
      throw new Error("Este CPF/CNPJ já está cadastrado no sistema.");
    }
  };

  const mapDoc = (d: QueryDocumentSnapshot<DocumentData>) => ({
    id: d.id,
    ...d.data(),
  });

  const convertTimestampToISO = (data: any, fields: string[]) => {
    const newData = { ...data };
    fields.forEach((field) => {
      if (newData[field] && newData[field] instanceof Timestamp) {
        newData[field] = newData[field].toDate().toISOString();
      }
    });
    return newData;
  };

  const normalizeClientData = (client: any) => {
    const address = {
      street: client.address?.street || client.street || "",
      number: client.address?.number || client.number || "",
      complement: client.address?.complement || client.complement || "",
      neighborhood: client.address?.neighborhood || client.neighborhood || "",
      city: client.address?.city || client.city || "",
      state: client.address?.state || client.state || "",
    };

    const razaoSocial = client.razaoSocial || client.name || "";
    const contato = client.contato || client.contactPerson || "";
    const observacoes = client.observacoes || client.notes || "";
    const telefone = client.telefone || client.phone || client.whatsapp || "";

    return {
      ...client,
      razaoSocial,
      contato,
      observacoes,
      telefone,
      address,
      name: razaoSocial,
      contactPerson: contato,
      notes: observacoes,
      phone: telefone,
      whatsapp: telefone,
      street: address.street,
      number: address.number,
      complement: address.complement,
      neighborhood: address.neighborhood,
      city: address.city,
      state: address.state,
    };
  };

  const normalizeSupplierData = (supplier: any) => {
    const address = {
      street: supplier.address?.street || supplier.street || "",
      number: supplier.address?.number || supplier.number || "",
      complement: supplier.address?.complement || supplier.complement || "",
      neighborhood: supplier.address?.neighborhood || supplier.neighborhood || "",
      city: supplier.address?.city || supplier.city || "",
      state: supplier.address?.state || supplier.state || "",
    };

    const razaoSocial = supplier.razaoSocial || supplier.name || "";
    const contato = supplier.contato || supplier.contactPerson || "";
    const observacoes = supplier.observacoes || supplier.notes || "";
    const telefone = supplier.telefone || supplier.phone || supplier.whatsapp || "";

    return {
      ...supplier,
      razaoSocial,
      contato,
      observacoes,
      telefone,
      address,
      name: razaoSocial,
      contactPerson: contato,
      notes: observacoes,
      phone: telefone,
      whatsapp: telefone,
      street: address.street,
      number: address.number,
      complement: address.complement,
      neighborhood: address.neighborhood,
      city: address.city,
      state: address.state,
    };
  };

  const normalizeCollaboratorData = (collaborator: any) => {
    const telefone = collaborator.telefone || collaborator.phone || collaborator.whatsapp || "";

    return {
      ...collaborator,
      telefone,
      phone: telefone,
      whatsapp: telefone,
      clientName: collaborator.clientName || "",
      permission: collaborator.permission || "colaborador",
      status: collaborator.status || "ativo",
    };
  };

  return {
    user: null,
    clients: [],
    equipments: [],
    contracts: [],
    sales: [],
    quotes: [],
    suppliers: [],
    purchaseOrders: [],
    bankAccounts: [],
    costCenters: [],
    chartOfAccounts: [],
    revenues: [],
    expenses: [],
    collaborators: [],
    systemUsers: [],
    siteContacts: [],
    notifications: [],
    companySettings: initialCompanySettings,
    smtpSettings: initialSmtpSettings,
    rentalClauses: initialRentalClauses,
    saleClauses: initialSaleClauses,
    loading: true,
    isQuoteDialogOpen: false,

    fetchAllData: async (publicOnly = false) => {
      set({ loading: true });
      try {
        const baseSnaps = (await Promise.all([
          getDoc(doc(db, "settings", "company")),
          getDoc(doc(db, "settings", "smtp")),
          getDoc(doc(db, "settings", "clauses")),
          getDocs(collection(db, "equipments")),
        ])) as [
          DocumentSnapshot<DocumentData>,
          DocumentSnapshot<DocumentData>,
          DocumentSnapshot<DocumentData>,
          QuerySnapshot<DocumentData>,
        ];

        const [companySettingsSnap, smtpSettingsSnap, clausesSnap, equipmentsSnap] = baseSnaps;

        const existingCompanySettings = companySettingsSnap.exists()
          ? (companySettingsSnap.data() as Partial<CompanySettings>)
          : {};

        const mergedCompanySettings: CompanySettings = {
          ...initialCompanySettings,
          ...existingCompanySettings,
          address: {
            ...initialCompanySettings.address,
            ...(existingCompanySettings.address || {}),
          },
          siteContent: {
            ...initialCompanySettings.siteContent,
            ...(existingCompanySettings.siteContent || {}),
            hero: {
              ...initialCompanySettings.siteContent.hero,
              ...(existingCompanySettings.siteContent?.hero || {}),
            },
            featuredProduct: {
              ...initialCompanySettings.siteContent.featuredProduct,
              ...(existingCompanySettings.siteContent?.featuredProduct || {}),
            },
            productHighlight: {
              ...initialCompanySettings.siteContent.productHighlight,
              ...(existingCompanySettings.siteContent?.productHighlight || {}),
            },
            differentiators: {
              ...initialCompanySettings.siteContent.differentiators,
              ...(existingCompanySettings.siteContent?.differentiators || {}),
              items:
                existingCompanySettings.siteContent?.differentiators?.items ||
                initialCompanySettings.siteContent.differentiators.items,
            },
            about: {
              ...initialCompanySettings.siteContent.about,
              ...(existingCompanySettings.siteContent?.about || {}),
            },
            contact: {
              ...initialCompanySettings.siteContent.contact,
              ...(existingCompanySettings.siteContent?.contact || {}),
            },
          },
        };

        const newState: Partial<State> = {
          companySettings: mergedCompanySettings,
          smtpSettings: smtpSettingsSnap.exists() ? (smtpSettingsSnap.data() as SmtpSettings) : get().smtpSettings,
          rentalClauses: clausesSnap.exists()
            ? clausesSnap.data()?.rental || initialRentalClauses
            : initialRentalClauses,
          saleClauses: clausesSnap.exists() ? clausesSnap.data()?.sale || initialSaleClauses : initialSaleClauses,
          equipments: equipmentsSnap.docs.map(mapDoc),
        };

        if (!publicOnly) {
          const otherSnaps = (await Promise.all([
            getDocs(collection(db, "clients")),
            getDocs(collection(db, "contracts")),
            getDocs(collection(db, "sales")),
            getDocs(collection(db, "quotes")),
            getDocs(collection(db, "suppliers")),
            getDocs(collection(db, "purchaseOrders")),
            getDocs(collection(db, "bankAccounts")),
            getDocs(collection(db, "costCenters")),
            getDocs(collection(db, "chartOfAccounts")),
            getDocs(query(collection(db, "revenues"), orderBy("dueDate", "asc"))),
            getDocs(query(collection(db, "expenses"), orderBy("dueDate", "asc"))),
            getDocs(collection(db, "collaborators")),
            getDocs(collection(db, "users")),
            getDocs(collection(db, "siteContacts")),
            getDocs(query(collection(db, "notifications"), orderBy("createdAt", "desc"), limit(10))),
          ])) as [
            QuerySnapshot<DocumentData>,
            QuerySnapshot<DocumentData>,
            QuerySnapshot<DocumentData>,
            QuerySnapshot<DocumentData>,
            QuerySnapshot<DocumentData>,
            QuerySnapshot<DocumentData>,
            QuerySnapshot<DocumentData>,
            QuerySnapshot<DocumentData>,
            QuerySnapshot<DocumentData>,
            QuerySnapshot<DocumentData>,
            QuerySnapshot<DocumentData>,
            QuerySnapshot<DocumentData>,
            QuerySnapshot<DocumentData>,
            QuerySnapshot<DocumentData>,
            QuerySnapshot<DocumentData>,
          ];

          const [
            clientsSnap,
            contractsSnap,
            salesSnap,
            quotesSnap,
            suppliersSnap,
            purchaseOrdersSnap,
            bankAccountsSnap,
            costCentersSnap,
            chartOfAccountsSnap,
            revenuesSnap,
            expensesSnap,
            collaboratorsSnap,
            systemUsersSnap,
            siteContactsSnap,
            notificationsSnap,
          ] = otherSnaps;

          newState.clients = clientsSnap.docs.map((d) => normalizeClientData(mapDoc(d)));
          newState.contracts = contractsSnap.docs.map((d) =>
            convertTimestampToISO(mapDoc(d), ["startDate", "endDate", "createdAt"]),
          );
          newState.sales = salesSnap.docs.map((d) =>
            convertTimestampToISO(mapDoc(d), ["saleDate", "createdAt", "downPaymentDate"]),
          );
          newState.quotes = quotesSnap.docs.map((d) =>
            convertTimestampToISO(mapDoc(d), ["startDate", "endDate", "createdAt", "downPaymentDate"]),
          );
          newState.suppliers = suppliersSnap.docs.map((d) => normalizeSupplierData(mapDoc(d)));
          newState.purchaseOrders = purchaseOrdersSnap.docs.map((d) =>
            convertTimestampToISO(mapDoc(d), ["date", "createdAt"]),
          );
          newState.bankAccounts = bankAccountsSnap.docs.map(mapDoc);
          newState.costCenters = costCentersSnap.docs.map(mapDoc);
          newState.chartOfAccounts = chartOfAccountsSnap.docs.map(mapDoc);
          newState.revenues = revenuesSnap.docs.map((d) =>
            convertTimestampToISO(mapDoc(d), ["dueDate", "createdAt", "paymentDate", "competenceDate"]),
          );
          newState.expenses = expensesSnap.docs.map((d) =>
            convertTimestampToISO(mapDoc(d), ["dueDate", "createdAt", "paymentDate", "competenceDate"]),
          );
          newState.collaborators = collaboratorsSnap.docs.map((d) => normalizeCollaboratorData(mapDoc(d)));
          newState.systemUsers = systemUsersSnap.docs.map((d) => ({
            uid: d.id,
            ...d.data(),
          }));
          newState.siteContacts = siteContactsSnap.docs.map((d) => ({
            ...mapDoc(d),
            createdAt: d.data().createdAt as Timestamp,
          }));
          newState.notifications = notificationsSnap.docs.map((d) => ({
            ...mapDoc(d),
            createdAt: d.data().createdAt as Timestamp,
          }));
        }

        set(newState as State);
      } catch (error) {
        console.error("Error fetching data from Firestore:", error);
      } finally {
        set({ loading: false });
      }
    },

    getNextId: async (collectionName: string) => {
      return getNextIdUtil(collectionName);
    },

    setUser: (user) => set({ user }),
    setLoading: (loading) => set({ loading }),
    setQuoteDialogOpen: (isOpen) => set({ isQuoteDialogOpen: isOpen }),

    signIn: async (email, password) => {
      try {
        await signInWithEmailAndPassword(auth, email, password);
      } catch (error: any) {
        if (
          error.code === "auth/invalid-credential" ||
          error.code === "auth/wrong-password" ||
          error.code === "auth/user-not-found"
        ) {
          throw new Error("Email ou senha incorretos.");
        } else {
          throw new Error("Ocorreu um erro inesperado durante o login.");
        }
      }
    },

    signOut: async () => {
      await firebaseSignOut(auth);
      set({ user: null });
      await get().fetchAllData(true);
    },

    addClient: async (client) => {
      centralValidateDocument(client.personType === "juridica" ? client.cnpj : client.cpf, "client", null);

      const newId = await get().getNextId("clients");
      const normalizedClient = normalizeClientData(client);
      const { id, ...clientData } = normalizedClient;

      await setDoc(doc(db, "clients", newId), {
        ...clientData,
        id: newId,
      });

      set((state) => ({
        clients: [...state.clients, { id: newId, ...clientData }],
      }));
    },

    updateClient: async (updatedClient) => {
      centralValidateDocument(
        updatedClient.personType === "juridica" ? updatedClient.cnpj : updatedClient.cpf,
        "client",
        updatedClient.id,
      );

      const normalizedClient = normalizeClientData(updatedClient);
      const clientRef = doc(db, "clients", updatedClient.id);

      await updateDoc(clientRef, normalizedClient);

      set((state) => ({
        clients: state.clients.map((client) => (client.id === updatedClient.id ? normalizedClient : client)),
      }));
    },

    deleteClient: async (clientId) => {
      await deleteDoc(doc(db, "clients", clientId));
      set((state) => ({
        clients: state.clients.filter((client) => client.id !== clientId),
      }));
    },

    addEquipment: async (equipment) => {
      const { imageFiles, ...equipmentData } = equipment;
      const newId = await get().getNextId("equipments");

      const uploadPromises = imageFiles
        .filter((file: any) => file)
        .map((file: File, index: number) => {
          const storageRef = ref(storage, `equipments/${newId}-${index}-${file.name}`);
          return uploadBytes(storageRef, file).then((snapshot) => getDownloadURL(snapshot.ref));
        });

      const uploadedImageUrls = await Promise.all(uploadPromises);

      const finalEquipmentData = {
        ...equipmentData,
        id: newId,
        imageUrls: uploadedImageUrls,
        imageUrl: uploadedImageUrls[0] || "",
      };
      delete finalEquipmentData.imageFiles;

      await setDoc(doc(db, "equipments", newId), finalEquipmentData);
      set((state) => ({
        equipments: [...state.equipments, finalEquipmentData],
      }));
    },

    updateEquipment: async (updatedEquipment) => {
      const { id, imageFiles, imageUrls, ...equipmentData } = updatedEquipment;
      if (!id) {
        throw new Error("ID do equipamento é obrigatório para atualização.");
      }

      const newImageUrls = [...imageUrls.filter((url: string | null) => url)];

      const uploadPromises = imageFiles
        .map((file: File | null, index: number) => ({ file, index }))
        .filter((item: any) => item.file)
        .map(async (item: any) => {
          const storageRef = ref(storage, `equipments/${id}-${item.index}-${item.file.name}`);
          const snapshot = await uploadBytes(storageRef, item.file);
          const downloadURL = await getDownloadURL(snapshot.ref);
          return { index: item.index, url: downloadURL };
        });

      const uploadedImages = await Promise.all(uploadPromises);

      uploadedImages.forEach((uploaded) => {
        newImageUrls[uploaded.index] = uploaded.url;
      });

      const finalEquipmentData = {
        ...equipmentData,
        imageUrls: newImageUrls,
        imageUrl: newImageUrls[0] || "",
      };
      delete finalEquipmentData.imageFiles;

      const equipmentRef = doc(db, "equipments", id);
      await updateDoc(equipmentRef, finalEquipmentData);

      const fullUpdatedEquipment = { id, ...finalEquipmentData };

      set((state) => ({
        equipments: state.equipments.map((equipment) => (equipment.id === id ? fullUpdatedEquipment : equipment)),
      }));
    },

    deleteEquipment: async (equipmentId) => {
      await deleteDoc(doc(db, "equipments", equipmentId));
      set((state) => ({
        equipments: state.equipments.filter((eq) => eq.id !== equipmentId),
      }));
    },

    addQuote: async (quoteData) => {
      const newId = await get().getNextId("quotes");
      const dataToSave: any = {
        ...quoteData,
        createdAt: serverTimestamp(),
        id: newId,
      };

      if (quoteData.startDate) dataToSave.startDate = Timestamp.fromDate(new Date(quoteData.startDate));
      if (quoteData.endDate) dataToSave.endDate = Timestamp.fromDate(new Date(quoteData.endDate));

      if (quoteData.paymentMethods) {
        dataToSave.paymentMethods = quoteData.paymentMethods.map((pm: any) => {
          if (pm.downPaymentDate) {
            return {
              ...pm,
              downPaymentDate: Timestamp.fromDate(new Date(pm.downPaymentDate)),
            };
          }
          return pm;
        });
      }

      await setDoc(doc(db, "quotes", newId), dataToSave);

      const notificationRef = doc(collection(db, "notifications"));
      await setDoc(notificationRef, {
        message: `Novo orçamento solicitado por ${quoteData.clientName}.`,
        type: "new_quote",
        entityId: newId,
        link: "/admin/orcamentos",
        createdAt: serverTimestamp(),
        read: false,
      });

      const newQuote = {
        ...dataToSave,
        id: newId,
        createdAt: new Date().toISOString(),
      };
      set((state: any) => ({ quotes: [...state.quotes, newQuote] }));
      return newQuote;
    },

    updateQuote: async (updatedQuote) => {
      const { id, ...quoteData } = updatedQuote;
      const dataToUpdate: any = { ...quoteData };

      if (dataToUpdate.startDate) dataToUpdate.startDate = Timestamp.fromDate(new Date(dataToUpdate.startDate));
      if (dataToUpdate.endDate) dataToUpdate.endDate = Timestamp.fromDate(new Date(dataToUpdate.endDate));

      if (dataToUpdate.paymentMethods) {
        dataToUpdate.paymentMethods = dataToUpdate.paymentMethods.map((pm: any) => {
          if (pm.downPaymentDate) {
            return {
              ...pm,
              downPaymentDate: Timestamp.fromDate(new Date(pm.downPaymentDate)),
            };
          }
          return pm;
        });
      }

      const quoteRef = doc(db, "quotes", id);
      await updateDoc(quoteRef, dataToUpdate);

      set((state) => ({
        quotes: state.quotes.map((q) => (q.id === id ? { ...q, ...updatedQuote } : q)),
      }));
    },

    deleteQuote: async (quoteId) => {
      await deleteDoc(doc(db, "quotes", quoteId));
      set((state) => ({
        quotes: state.quotes.filter((q) => q.id !== quoteId),
      }));
    },

    convertQuoteToContract: async (quoteId) => {
      const { clients } = get();
      const quoteDoc = await getDoc(doc(db, "quotes", quoteId));
      if (!quoteDoc.exists()) throw new Error("Orçamento não encontrado.");

      const quote = { id: quoteDoc.id, ...quoteDoc.data() } as any;

      if (quote.status !== "Pendente") throw new Error("Apenas orçamentos pendentes podem ser convertidos.");
      if (quote.budgetType !== "locacao") throw new Error("Este orçamento não é de locação.");

      const client = clients.find((c) => c.id === quote.clientId);

      const startDate = quote.startDate?.toDate ? quote.startDate.toDate() : new Date(quote.startDate);
      const endDate = quote.endDate?.toDate ? quote.endDate.toDate() : new Date(quote.endDate);

      const contractData = {
        clientId: quote.clientId,
        client: client || null,
        startDate,
        endDate,
        items: quote.items,
        totalValue: quote.totalValue,
        status: "Em Andamento",
        quoteId: quote.id,
        costCenterId: quote.costCenterId || "",
        chartOfAccountId: quote.chartOfAccountId || "",
        bankAccountId: quote.bankAccountId || "",
        firstInstallmentDate: addMonths(startDate, 1),
      };

      const newContract = await get().addContract(contractData);

      const quoteRef = doc(db, "quotes", quoteId);
      await updateDoc(quoteRef, { status: "Aprovado" });

      await get().fetchAllData();
      return newContract;
    },

    addContract: async (contractData) => {
      const { equipments } = get();
      const { client, items, startDate, endDate, firstInstallmentDate, ...rest } = contractData;

      const contractId = await get().getNextId("contracts");
      const batch = writeBatch(db);

      for (const item of items) {
        const equipment = equipments.find((e) => e.id === item.equipmentId);
        if (!equipment || equipment.stock < item.quantity) {
          throw new Error(`Estoque insuficiente para ${equipment?.name || "equipamento"}.`);
        }
        const newStock = equipment.stock - item.quantity;
        const equipmentRef = doc(db, "equipments", item.equipmentId);
        batch.update(equipmentRef, { stock: newStock });
      }

      const finalDate = new Date(endDate);
      const monthlyValue = items.reduce((acc: number, item: any) => acc + item.quantity * item.unitPrice, 0);

      const dataToSave = {
        ...rest,
        id: contractId,
        client,
        items,
        startDate,
        endDate,
        totalValue: contractData.totalValue,
        createdAt: serverTimestamp(),
      };

      const contractRef = doc(db, "contracts", contractId);
      batch.set(contractRef, dataToSave);

      let totalMonths = differenceInMonths(finalDate, new Date(startDate));
      if (getDate(finalDate) > getDate(new Date(startDate))) totalMonths++;
      if (totalMonths === 0) totalMonths = 1;

      let currentDueDate = new Date(firstInstallmentDate);
      for (let i = 0; i < totalMonths; i++) {
        const revenueData = {
          clientId: client.id,
          contractId: contractId,
          description: `Parcela ${i + 1}/${totalMonths} do contrato ${contractId}`,
          valorTotal: monthlyValue,
          valorBruto: monthlyValue,
          dueDate: Timestamp.fromDate(currentDueDate),
          status: "Pendente",
          createdAt: serverTimestamp(),
          costCenterId: rest.costCenterId,
          chartOfAccountId: rest.chartOfAccountId,
          bankAccountId: rest.bankAccountId,
        };
        const revenueRef = doc(collection(db, "revenues"));
        batch.set(revenueRef, revenueData);

        currentDueDate = addMonths(currentDueDate, 1);
      }

      await batch.commit();
      await get().fetchAllData();

      return { ...dataToSave, createdAt: new Date().toISOString() };
    },

    updateContract: async (contractData) => {
      const { id, ...data } = contractData;
      if (!id) throw new Error("ID do contrato é obrigatório para atualização.");

      const contractRef = doc(db, "contracts", id);
      const dataToUpdate = {
        ...data,
        startDate: Timestamp.fromDate(new Date(data.startDate)),
        endDate: Timestamp.fromDate(new Date(data.endDate)),
      };

      await updateDoc(contractRef, dataToUpdate);
      await get().fetchAllData();
    },

    recalculateContractInstallments: async (contractId: string) => {
      const { contracts, revenues } = get();
      const contract = contracts.find((c) => c.id === contractId);
      if (!contract) throw new Error("Contrato não encontrado.");

      const batch = writeBatch(db);

      const existingRevenues = revenues.filter((r) => r.contractId === contractId);
      const paidRevenues = existingRevenues.filter((r) => r.status === "recebido");
      const pendingRevenues = existingRevenues.filter((r) => r.status !== "recebido");

      pendingRevenues.forEach((rev) => {
        const revRef = doc(db, "revenues", rev.id);
        batch.delete(revRef);
      });

      const monthlyValue = contract.items.reduce((acc: number, item: any) => acc + item.quantity * item.unitPrice, 0);

      const finalDate = new Date(contract.endDate);
      const firstInstallmentDate = addMonths(new Date(contract.startDate), 1);

      let currentDueDate = new Date(firstInstallmentDate);
      let installmentCount = 0;

      let totalMonths = differenceInMonths(finalDate, new Date(contract.startDate));
      if (getDate(finalDate) > getDate(new Date(contract.startDate))) totalMonths++;
      if (totalMonths === 0) totalMonths = 1;

      while (installmentCount < totalMonths) {
        const installmentMonth = format(currentDueDate, "MM/yyyy");
        const isAlreadyPaid = paidRevenues.some((pr) => format(new Date(pr.dueDate), "MM/yyyy") === installmentMonth);

        if (!isAlreadyPaid) {
          const revenueData = {
            clientId: contract.clientId,
            contractId: contract.id,
            description: `Parcela ${installmentCount + 1}/${totalMonths} do contrato ${contract.id}`,
            valorTotal: monthlyValue,
            valorBruto: monthlyValue,
            dueDate: Timestamp.fromDate(currentDueDate),
            status: "Pendente",
            createdAt: serverTimestamp(),
            costCenterId: contract.costCenterId || "",
            chartOfAccountId: contract.chartOfAccountId || "",
            bankAccountId: contract.bankAccountId || "",
          };
          const revenueRef = doc(collection(db, "revenues"));
          batch.set(revenueRef, revenueData);
        }

        currentDueDate = addMonths(currentDueDate, 1);
        installmentCount++;
      }

      await batch.commit();
      await get().fetchAllData();
    },

    finalizeContract: async (contractId, fineAmount, itemStatuses) => {
      const { contracts, equipments, revenues } = get();
      const contractToFinalize = contracts.find((c) => c.id === contractId);
      if (!contractToFinalize) throw new Error("Contrato não encontrado.");

      const batch = writeBatch(db);
      const competence = format(new Date(), "MM/yyyy");

      const contractRef = doc(db, "contracts", contractId);
      batch.update(contractRef, { status: "Finalizado" });

      const missingItemsForSale: any[] = [];
      for (const itemStatus of itemStatuses) {
        const equipment = equipments.find((e) => e.id === itemStatus.equipmentId);
        if (!equipment) continue;

        if (itemStatus.quantityReturned > 0) {
          const newStock = equipment.stock + itemStatus.quantityReturned;
          const equipmentRef = doc(db, "equipments", itemStatus.equipmentId);
          batch.update(equipmentRef, { stock: newStock });
        }

        const quantityMissing = itemStatus.quantityRented - itemStatus.quantityReturned;
        if (quantityMissing > 0) {
          missingItemsForSale.push({
            equipmentId: itemStatus.equipmentId,
            quantity: quantityMissing,
            unitPrice: equipment.salePrice || 0,
          });
        }
      }

      if (missingItemsForSale.length > 0) {
        const totalSaleValue = missingItemsForSale.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0);
        const saleId = await get().getNextId("sales");
        const saleData = {
          id: saleId,
          clientId: contractToFinalize.clientId,
          clientName: contractToFinalize.client?.razaoSocial || "N/A",
          items: missingItemsForSale,
          totalValue: totalSaleValue,
          status: "Concluída",
          saleDate: Timestamp.fromDate(new Date()),
          createdAt: serverTimestamp(),
          competence,
          description: `Venda de itens faltantes do contrato ${contractId}`,
        };
        const saleRef = doc(db, "sales", saleId);
        batch.set(saleRef, saleData);

        const saleRevenueRef = doc(collection(db, "revenues"));
        batch.set(saleRevenueRef, {
          clientId: contractToFinalize.clientId,
          saleId: saleId,
          description: `Fatura de itens faltantes do contrato ${contractId}`,
          valorTotal: totalSaleValue,
          valorBruto: totalSaleValue,
          dueDate: Timestamp.fromDate(new Date()),
          status: "Pendente",
          competence,
          createdAt: serverTimestamp(),
        });
      }

      if (fineAmount > 0) {
        const fineRevenueRef = doc(collection(db, "revenues"));
        batch.set(fineRevenueRef, {
          clientId: contractToFinalize.clientId,
          contractId: contractId,
          description: `Multa por rescisão do contrato ${contractId}`,
          valorTotal: fineAmount,
          valorBruto: fineAmount,
          dueDate: Timestamp.fromDate(new Date()),
          status: "Pendente",
          competence,
          createdAt: serverTimestamp(),
        });
      }

      const revenuesToCancel = revenues.filter((r) => r.contractId === contractId && r.status === "Pendente");
      for (const revenue of revenuesToCancel) {
        const revenueRef = doc(db, "revenues", revenue.id);
        batch.update(revenueRef, { status: "Cancelado" });
      }

      await batch.commit();
      await get().fetchAllData();
    },

    deleteContract: async (contractId) => {
      const { contracts, revenues, equipments } = get();
      const batch = writeBatch(db);

      const contractToDelete = contracts.find((c) => c.id === contractId);
      if (!contractToDelete) {
        throw new Error("Contrato não encontrado para exclusão.");
      }

      for (const item of contractToDelete.items) {
        const equipment = equipments.find((e) => e.id === item.equipmentId);
        if (equipment) {
          const newStock = equipment.stock + item.quantity;
          const equipmentRef = doc(db, "equipments", item.equipmentId);
          batch.update(equipmentRef, { stock: newStock });
        }
      }

      const revenuesToDelete = revenues.filter((r) => r.contractId === contractId);
      revenuesToDelete.forEach((revenue) => {
        const revenueRef = doc(db, "revenues", revenue.id);
        batch.delete(revenueRef);
      });

      const contractRef = doc(db, "contracts", contractId);
      batch.delete(contractRef);

      await batch.commit();
      await get().fetchAllData();
    },

    attachSignedContract: async (contractId, file) => {
      if (!file) throw new Error("Nenhum arquivo selecionado.");

      const storageRef = ref(storage, `contracts/${contractId}/${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);

      const contractRef = doc(db, "contracts", contractId);
      await updateDoc(contractRef, { signedContractUrl: downloadURL });

      set((state) => ({
        contracts: state.contracts.map((contract) =>
          contract.id === contractId ? { ...contract, signedContractUrl: downloadURL } : contract,
        ),
      }));
    },

    deleteSignedContract: async (contractId: string) => {
      const { contracts } = get();
      const contract = contracts.find((c) => c.id === contractId);
      if (!contract || !contract.signedContractUrl) {
        throw new Error("Nenhum contrato assinado encontrado para este ID.");
      }

      const fileRef = ref(storage, contract.signedContractUrl);
      await deleteObject(fileRef);

      const contractRef = doc(db, "contracts", contractId);
      await updateDoc(contractRef, { signedContractUrl: "" });

      set((state) => ({
        contracts: state.contracts.map((c) => (c.id === contractId ? { ...c, signedContractUrl: "" } : c)),
      }));
    },

    addSale: (saleData) => addSale(get, set, saleData),
    updateSale: (saleData) => updateSale(get, set, saleData),
    cancelSale: (saleId) => cancelSale(get, set, saleId),
    deleteSale: (saleId) => deleteSale(get, set, saleId),

    addSystemUser: async (userData) => {
      const { email, password, ...rest } = userData;

      const q = query(collection(db, "users"), where("email", "==", email));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        throw new Error("Este e-mail já está em uso.");
      }

      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        const dataToSave = {
          name: rest.name,
          email: email,
          permission: rest.permission,
          status: rest.status,
        };

        await setDoc(doc(db, "users", user.uid), dataToSave);
        await get().fetchAllData();
      } catch (error: any) {
        if (error.code === "auth/email-already-in-use") {
          throw new Error("Este e-mail já está cadastrado no sistema de autenticação.");
        }
        throw error;
      }
    },

    updateSystemUser: async (userData: any) => {
      const { uid, password, ...rest } = userData;
      if (!uid) throw new Error("UID do usuário não encontrado.");

      const userRef = doc(db, "users", uid);
      await updateDoc(userRef, rest);

      if (password) {
        try {
          const response = await fetch("/api/update-user-password", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ uid, password }),
          });
          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || "Falha ao atualizar a senha.");
          }
        } catch (error: any) {
          console.error("Erro ao chamar a API de atualização de senha:", error);
          throw new Error(error.message || "Não foi possível atualizar a senha.");
        }
      }

      set((state) => ({
        systemUsers: state.systemUsers.map((u) => (u.uid === uid ? { ...u, ...rest } : u)),
      }));
    },

    deleteSystemUser: async (uid: string) => {
      if (!uid) throw new Error("UID do usuário não encontrado.");
      console.warn(
        "Excluir um usuário do Firebase Auth do cliente é arriscado e geralmente requer privilégios de administrador via Cloud Functions.",
      );

      await deleteDoc(doc(db, "users", uid));
      set((state) => ({
        systemUsers: state.systemUsers.filter((u) => u.uid !== uid),
      }));
    },

    addSupplier: async (supplier) => {
      centralValidateDocument(supplier.personType === "juridica" ? supplier.cnpj : supplier.cpf, "supplier", null);

      const newId = await get().getNextId("suppliers");
      const normalizedSupplier = normalizeSupplierData(supplier);
      const { id, ...supplierData } = normalizedSupplier;

      await setDoc(doc(db, "suppliers", newId), {
        ...supplierData,
        id: newId,
      });

      set((state) => ({
        suppliers: [...state.suppliers, { id: newId, ...supplierData }],
      }));
    },

    updateSupplier: async (updatedSupplier) => {
      centralValidateDocument(
        updatedSupplier.personType === "juridica" ? updatedSupplier.cnpj : updatedSupplier.cpf,
        "supplier",
        updatedSupplier.id,
      );

      const normalizedSupplier = normalizeSupplierData(updatedSupplier);
      const supplierRef = doc(db, "suppliers", updatedSupplier.id);

      await updateDoc(supplierRef, normalizedSupplier);

      set((state) => ({
        suppliers: state.suppliers.map((supplier) =>
          supplier.id === updatedSupplier.id ? normalizedSupplier : supplier,
        ),
      }));
    },

    deleteSupplier: async (supplierId) => {
      await deleteDoc(doc(db, "suppliers", supplierId));
      set((state) => ({
        suppliers: state.suppliers.filter((supplier) => supplier.id !== supplierId),
      }));
    },

    addPurchaseOrder: async (order) => {
      const { id, ...orderData } = order;
      await setDoc(doc(db, "purchaseOrders", id), orderData);
      set((state) => ({ purchaseOrders: [...state.purchaseOrders, order] }));
    },

    updatePurchaseOrder: async (order) => {
      const { id, ...orderData } = order;
      const orderRef = doc(db, "purchaseOrders", id);
      await updateDoc(orderRef, orderData);
      set((state) => ({
        purchaseOrders: state.purchaseOrders.map((o) => (o.id === id ? order : o)),
      }));
    },

    deletePurchaseOrder: async (orderId) => {
      await deleteDoc(doc(db, "purchaseOrders", orderId));
      set((state) => ({
        purchaseOrders: state.purchaseOrders.filter((o) => o.id !== orderId),
      }));
    },

    addCollaborator: async (collaborator) => {
      centralValidateDocument(collaborator.cpf, "employee", null);

      const newId = await get().getNextId("collaborators");
      const normalizedCollaborator = normalizeCollaboratorData(collaborator);

      await setDoc(doc(db, "collaborators", newId), {
        ...normalizedCollaborator,
        id: newId,
      });

      set((state) => ({
        collaborators: [...state.collaborators, { id: newId, ...normalizedCollaborator }],
      }));
    },

    updateCollaborator: async (collaborator) => {
      centralValidateDocument(collaborator.cpf, "employee", collaborator.id);

      const normalizedCollaborator = normalizeCollaboratorData(collaborator);
      const { id, ...data } = normalizedCollaborator;

      const collaboratorRef = doc(db, "collaborators", id);
      await updateDoc(collaboratorRef, data);

      set((state) => ({
        collaborators: state.collaborators.map((c) => (c.id === id ? normalizedCollaborator : c)),
      }));
    },

    deleteCollaborator: async (collaboratorId) => {
      await deleteDoc(doc(db, "collaborators", collaboratorId));
      set((state) => ({
        collaborators: state.collaborators.filter((c) => c.id !== collaboratorId),
      }));
    },

    addRevenue: async (revenue) => {
      const { isRecurring, repetitionQuantity, repetitionType, ...revenueData } = revenue;
      const batch = writeBatch(db);

      if (isRecurring && repetitionQuantity > 1) {
        let currentDate = new Date(revenueData.dueDate);
        for (let i = 0; i < repetitionQuantity; i++) {
          const dataToSave = {
            ...revenueData,
            description: `${revenueData.description} (Parcela ${i + 1} de ${repetitionQuantity})`,
            dueDate: Timestamp.fromDate(currentDate),
            createdAt: serverTimestamp(),
          };
          const docRef = doc(collection(db, "revenues"));
          batch.set(docRef, dataToSave);

          switch (repetitionType) {
            case "diario":
              currentDate = addDays(currentDate, 1);
              break;
            case "semanal":
              currentDate = addWeeks(currentDate, 1);
              break;
            case "mensal":
              currentDate = addMonths(currentDate, 1);
              break;
            case "anual":
              currentDate = addYears(currentDate, 1);
              break;
          }
        }
      } else {
        const dataToSave = { ...revenueData, createdAt: serverTimestamp() };
        const docRef = doc(collection(db, "revenues"));
        batch.set(docRef, dataToSave);
      }

      await batch.commit();
      await get().fetchAllData();
    },

    updateRevenue: async (revenue) => {
      const { id, isRecurring, ...dataToUpdate } = revenue;
      const revenueRef = doc(db, "revenues", id);
      await updateDoc(revenueRef, dataToUpdate);
      set((state) => ({
        revenues: state.revenues.map((r) => (r.id === id ? { ...r, ...dataToUpdate } : r)),
      }));
    },

    deleteRevenue: async (revenueId) => {
      await deleteDoc(doc(db, "revenues", revenueId));
      set((state) => ({
        revenues: state.revenues.filter((revenue) => revenue.id !== revenueId),
      }));
    },

    markRevenueAsReceived: async (revenueId: string) => {
      const revenueRef = doc(db, "revenues", revenueId);
      await updateDoc(revenueRef, {
        status: "recebido",
        paymentDate: serverTimestamp(),
      });
      await get().fetchAllData();
    },

    markRevenueAsPending: async (revenueId: string) => {
      const revenueRef = doc(db, "revenues", revenueId);
      await updateDoc(revenueRef, { status: "pendente" });
      set((state) => ({
        revenues: state.revenues.map((revenue) =>
          revenue.id === revenueId ? { ...revenue, status: "pendente" } : revenue,
        ),
      }));
    },

    attachBoletoToRevenue: async (revenueId: string, file: File) => {
      if (!file) throw new Error("Nenhum arquivo selecionado.");
      const revenue = get().revenues.find((r) => r.id === revenueId);
      if (!revenue) throw new Error("Parcela não encontrada.");

      const storageRef = ref(storage, `boletos/${revenue.contractId}/${revenueId}-${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);

      const revenueRef = doc(db, "revenues", revenueId);
      await updateDoc(revenueRef, { boletoUrl: downloadURL });

      await get().fetchAllData();
    },

    deleteBoletoFromRevenue: async (revenueId: string) => {
      const revenue = get().revenues.find((r) => r.id === revenueId);
      if (!revenue || !revenue.boletoUrl) {
        throw new Error("Nenhum boleto anexado encontrado para esta parcela.");
      }

      const fileRef = ref(storage, revenue.boletoUrl);
      await deleteObject(fileRef);

      const revenueRef = doc(db, "revenues", revenueId);
      await updateDoc(revenueRef, { boletoUrl: "" });

      await get().fetchAllData();
    },

    addExpense: async (expense) => {
      const { isRecurring, repetitionQuantity, repetitionType, ...expenseData } = expense;
      const batch = writeBatch(db);

      if (isRecurring && repetitionQuantity > 1) {
        let currentDate = new Date(expenseData.dueDate);
        for (let i = 0; i < repetitionQuantity; i++) {
          const dataToSave = {
            ...expenseData,
            description: `${expenseData.description} (Parcela ${i + 1} de ${repetitionQuantity})`,
            dueDate: Timestamp.fromDate(currentDate),
            createdAt: serverTimestamp(),
          };
          const docRef = doc(collection(db, "expenses"));
          batch.set(docRef, dataToSave);

          switch (repetitionType) {
            case "diario":
              currentDate = addDays(currentDate, 1);
              break;
            case "semanal":
              currentDate = addWeeks(currentDate, 1);
              break;
            case "mensal":
              currentDate = addMonths(currentDate, 1);
              break;
            case "anual":
              currentDate = addYears(currentDate, 1);
              break;
          }
        }
      } else {
        const newId = await get().getNextId("expenses");
        const dataToSave = { ...expense, id: newId, createdAt: serverTimestamp() };
        await setDoc(doc(db, "expenses", newId), dataToSave);
      }

      await batch.commit();
      await get().fetchAllData();
    },

    updateExpense: async (expense) => {
      const { id, isRecurring, ...dataToUpdate } = expense;
      const expenseRef = doc(db, "expenses", id);
      await updateDoc(expenseRef, dataToUpdate);
      set((state) => ({
        expenses: state.expenses.map((e) => (e.id === id ? { ...e, ...dataToUpdate } : e)),
      }));
    },

    deleteExpense: async (expenseId) => {
      await deleteDoc(doc(db, "expenses", expenseId));
      set((state) => ({
        expenses: state.expenses.filter((expense) => expense.id !== expenseId),
      }));
    },

    markExpenseAsPaid: async (expenseId: string) => {
      const expenseRef = doc(db, "expenses", expenseId);
      await updateDoc(expenseRef, {
        status: "pago",
        paymentDate: serverTimestamp(),
      });
      await get().fetchAllData();
    },

    unmarkExpenseAsPaid: async (expenseId: string) => {
      const expenseRef = doc(db, "expenses", expenseId);
      await updateDoc(expenseRef, {
        status: "pendente",
        paymentDate: null,
      });
      await get().fetchAllData();
    },

    attachReceiptToExpense: async (expenseId: string, file: File) => {
      if (!file) throw new Error("Nenhum arquivo selecionado.");
      const storageRef = ref(storage, `receipts/expenses/${expenseId}/${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);

      const expenseRef = doc(db, "expenses", expenseId);
      await updateDoc(expenseRef, { receiptUrl: downloadURL });

      set((state) => ({
        expenses: state.expenses.map((expense) =>
          expense.id === expenseId ? { ...expense, receiptUrl: downloadURL } : expense,
        ),
      }));
    },

    deleteReceiptFromExpense: async (expenseId: string) => {
      const expense = get().expenses.find((e) => e.id === expenseId);
      if (!expense || !expense.receiptUrl) {
        throw new Error("Nenhum comprovante encontrado para esta despesa.");
      }

      const fileRef = ref(storage, expense.receiptUrl);
      await deleteObject(fileRef);

      const expenseRef = doc(db, "expenses", expenseId);
      await updateDoc(expenseRef, { receiptUrl: "" });

      set((state) => ({
        expenses: state.expenses.map((e) => (e.id === expenseId ? { ...e, receiptUrl: "" } : e)),
      }));
    },

    addTransfer: async (fromAccountId, toAccountId, amount, date, description) => {
      const batch = writeBatch(db);

      const expenseData = {
        description:
          description ||
          `Transferência para conta ${get().bankAccounts.find((a) => a.id === toAccountId)?.name || "N/A"}`,
        valorTotal: amount,
        valorBruto: amount,
        desconto: 0,
        juros: 0,
        dueDate: Timestamp.fromDate(date),
        paymentDate: Timestamp.fromDate(date),
        status: "pago",
        bankAccountId: fromAccountId,
        createdAt: serverTimestamp(),
        isTransfer: true,
        competenceDate: Timestamp.fromDate(date),
      };
      const expenseRef = doc(collection(db, "expenses"));
      batch.set(expenseRef, expenseData);

      const revenueData = {
        description:
          description ||
          `Transferência de conta ${get().bankAccounts.find((a) => a.id === fromAccountId)?.name || "N/A"}`,
        valorTotal: amount,
        valorBruto: amount,
        desconto: 0,
        juros: 0,
        dueDate: Timestamp.fromDate(date),
        paymentDate: Timestamp.fromDate(date),
        status: "recebido",
        bankAccountId: toAccountId,
        createdAt: serverTimestamp(),
        isTransfer: true,
        competenceDate: Timestamp.fromDate(date),
      };
      const revenueRef = doc(collection(db, "revenues"));
      batch.set(revenueRef, revenueData);

      await batch.commit();
      await get().fetchAllData();
    },

    updateSiteContact: async (contactId, data) => {
      const contactRef = doc(db, "siteContacts", contactId);
      await updateDoc(contactRef, data);
      set((state) => ({
        siteContacts: state.siteContacts.map((c) => (c.id === contactId ? { ...c, ...data } : c)),
      }));
    },

    deleteSiteContact: async (contactId) => {
      await deleteDoc(doc(db, "siteContacts", contactId));
      set((state) => ({
        siteContacts: state.siteContacts.filter((c) => c.id !== contactId),
      }));
    },

    addCostCenter: async (costCenter) => {
      const newId = await get().getNextId("costCenters");
      const dataToSave = { ...costCenter, id: newId };
      await setDoc(doc(db, "costCenters", newId), dataToSave);
      set((state) => ({ costCenters: [...state.costCenters, dataToSave] }));
    },

    updateCostCenter: async (costCenter) => {
      const { id, ...data } = costCenter;
      const costCenterRef = doc(db, "costCenters", id);
      await updateDoc(costCenterRef, data);
      set((state) => ({
        costCenters: state.costCenters.map((cc) => (cc.id === id ? costCenter : cc)),
      }));
    },

    deleteCostCenter: async (costCenterId) => {
      await deleteDoc(doc(db, "costCenters", costCenterId));
      set((state) => ({
        costCenters: state.costCenters.filter((cc) => cc.id !== costCenterId),
      }));
    },

    addChartOfAccount: async (account) => {
      const docRef = await addDoc(collection(db, "chartOfAccounts"), account);
      set((state) => ({
        chartOfAccounts: [...state.chartOfAccounts, { id: docRef.id, ...account }],
      }));
    },

    updateChartOfAccount: async (account) => {
      const { id, ...data } = account;
      const accountRef = doc(db, "chartOfAccounts", id);
      await updateDoc(accountRef, data);
      set((state) => ({
        chartOfAccounts: state.chartOfAccounts.map((acc) => (acc.id === id ? account : acc)),
      }));
    },

    deleteChartOfAccount: async (accountId) => {
      await deleteDoc(doc(db, "chartOfAccounts", accountId));
      set((state) => ({
        chartOfAccounts: state.chartOfAccounts.filter((acc) => acc.id !== accountId),
      }));
    },

    addBankAccount: async (account) => {
      const newId = await get().getNextId("bankAccounts");
      const dataToSave = { ...account, id: newId };
      await setDoc(doc(db, "bankAccounts", newId), dataToSave);
      set((state) => ({ bankAccounts: [...state.bankAccounts, dataToSave] }));
    },

    updateBankAccount: async (account) => {
      const { id, ...data } = account;
      const accountRef = doc(db, "bankAccounts", id);
      await updateDoc(accountRef, data);
      set((state) => ({
        bankAccounts: state.bankAccounts.map((acc) => (acc.id === id ? account : acc)),
      }));
    },

    deleteBankAccount: async (accountId) => {
      await deleteDoc(doc(db, "bankAccounts", accountId));
      set((state) => ({
        bankAccounts: state.bankAccounts.filter((acc) => acc.id !== accountId),
      }));
    },

    deleteNotification: async (notificationId: string) => {
      const notificationRef = doc(db, "notifications", notificationId);
      await deleteDoc(notificationRef);
      set((state) => ({
        notifications: state.notifications.filter((n) => n.id !== notificationId),
      }));
    },

    clearAllNotifications: async () => {
      const { notifications } = get();
      const batch = writeBatch(db);
      notifications.forEach((n) => {
        batch.delete(doc(db, "notifications", n.id));
      });
      await batch.commit();
      set({ notifications: [] });
    },

    updateCompanySettings: async (settings, logoFile, siteLogoFile, siteContent, siteFiles, styleSettings) => {
      const uploadAndGetURL = async (file: File, path: string) => {
        const storageRef = ref(storage, path);
        const snapshot = await uploadBytes(storageRef, file);
        return await getDownloadURL(snapshot.ref);
      };

      let updatedSettings = JSON.parse(JSON.stringify({ ...settings, siteContent, styleSettings }));

      if (logoFile) {
        updatedSettings.logoUrl = await uploadAndGetURL(logoFile, `company/logo-${logoFile.name}`);
      }

      if (siteLogoFile) {
        updatedSettings.siteLogoUrl = await uploadAndGetURL(siteLogoFile, `company/siteLogo-${siteLogoFile.name}`);
      }

      const fileKeys: { [key: string]: keyof SiteContent } = {
        featuredProductImage: "featuredProduct",
        heroBackgroundImage: "hero",
        heroBackgroundVideo: "hero",
        featuredProductBackgroundImage: "featuredProduct",
        aboutBackgroundImage: "about",
        contactBackgroundImage: "contact",
        productHighlightBackgroundImage: "productHighlight",
      };

      for (const key in siteFiles) {
        if (siteFiles[key]) {
          const file = siteFiles[key]!;
          const downloadURL = await uploadAndGetURL(file, `site/${key}-${file.name}`);

          const sectionKey = fileKeys[key];
          if (sectionKey) {
            if (!updatedSettings.siteContent[sectionKey]) {
              (updatedSettings.siteContent as any)[sectionKey] = {};
            }

            if (key === "featuredProductImage") {
              (updatedSettings.siteContent[sectionKey] as any).imageUrl = downloadURL;
            } else if (key === "heroBackgroundVideo") {
              (updatedSettings.siteContent[sectionKey] as any).backgroundVideoUrl = downloadURL;
            } else {
              (updatedSettings.siteContent[sectionKey] as any).backgroundImageUrl = downloadURL;
            }
          }
        }
      }

      const settingsRef = doc(db, "settings", "company");
      await setDoc(settingsRef, updatedSettings, { merge: true });
      set({ companySettings: updatedSettings });
    },

    updateSmtpSettings: async (settings) => {
      const settingsRef = doc(db, "settings", "smtp");
      await setDoc(settingsRef, settings, { merge: true });
      set({ smtpSettings: settings });
    },

    updateRentalClauses: async (clauses) => {
      const clausesRef = doc(db, "settings", "clauses");
      await setDoc(clausesRef, { rental: clauses }, { merge: true });
      set({ rentalClauses: clauses });
    },

    updateSaleClauses: async (clauses) => {
      const clausesRef = doc(db, "settings", "clauses");
      await setDoc(clausesRef, { sale: clauses }, { merge: true });
      set({ saleClauses: clauses });
    },
  };
});

export { useStore };
