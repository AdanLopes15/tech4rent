
Plano atualizado para trocar a homepage `/` mantendo o padrão visual atual da Tech4Rent:

1. Manter a identidade visual da Tech4Rent
   - Preservar a paleta atual do projeto:
     - Laranja principal: `#F97316`
     - Preto/cinza escuro para áreas institucionais
     - Branco e cinzas claros para seções de conteúdo
   - Manter o estilo da logo e não trocar a identidade por outra paleta.
   - Usar o site de referência apenas como inspiração de estrutura, impacto visual e organização, não como cópia literal das cores.

2. Reestruturar a ordem da homepage
   - Nova sequência:
     1. Header com visual profissional e aderente à marca
     2. Hero com fundo em vídeo/imagem escurecido
     3. Barra de benefícios
     4. Produtos mais procurados
     5. Seção de presença/resultados no Brasil
     6. Cards de resultados/cases
     7. Bloco de vídeo demonstrativo
     8. Sobre/contato
     9. Footer escuro

3. Atualizar o header da landing page
   - Manter logo configurável via `siteLogoUrl`.
   - Usar fundo branco ou escuro conforme melhor contraste com a logo atual.
   - Manter laranja Tech4Rent nos botões e estados de hover.
   - Menu com links:
     - Produtos
     - Diferenciais
     - Sobre
     - Contato
     - Área Restrita
   - Botão principal para contato/orçamento com destaque em laranja.

4. Refazer o hero principal
   - Criar uma primeira dobra mais impactante, inspirada na foto 1:
     - Fundo em vídeo, se configurado.
     - Fallback para imagem de fundo já cadastrada.
     - Fallback final para gradiente escuro com laranja.
   - Aplicar overlay escuro para manter legibilidade.
   - Título grande com destaque em laranja Tech4Rent.
   - Subtítulo institucional.
   - Botões:
     - “Ver Catálogo”
     - “Falar no WhatsApp” ou “Solicitar Orçamento”

5. Adicionar suporte a vídeo de fundo no Hero
   - Incluir campo opcional `backgroundVideoUrl` nas configurações do conteúdo do Hero.
   - Atualizar `/admin/configuracoes` para permitir cadastrar/enviar vídeo do Hero.
   - Renderizar vídeo com:
     - autoplay
     - muted
     - loop
     - playsInline
   - Se não houver vídeo, continuar usando a imagem atual.

6. Criar barra de benefícios
   - Nova seção logo abaixo do Hero.
   - Usar ícones e textos curtos:
     - Garantia
     - Suporte especializado
     - Solução para sua operação
   - Visual limpo, com detalhes em laranja e fundo claro.

7. Redesenhar “Produtos Mais Procurados”
   - Atualizar os cards para ficarem mais modernos, mantendo as cores da marca.
   - Cada card deve mostrar:
     - Imagem do equipamento
     - Categoria/código, quando disponível
     - Nome do equipamento
     - Descrição curta
     - Texto “Sob Consulta”
     - Botão de detalhes/contato
   - Continuar usando os equipamentos cadastrados no sistema.

8. Adicionar seção “Presença em todo o Brasil”
   - Criar seção institucional com fundo claro ou escuro, usando laranja como destaque.
   - Conteúdo sugerido:
     - “Presença em todo o Brasil”
     - “10.000+ aparelhos em operação”
     - “1.000+ clientes ativos”
     - “20+ estados atendidos”
   - Listar segmentos atendidos:
     - Logística & Transporte
     - E-commerce & Fulfillment
     - Varejo & Atacado
     - Indústria & Manufatura
     - Saúde & Hospitalar
     - Alimentício & Frigorífico

9. Adicionar seção de resultados/cases
   - Criar cards com métricas de impacto:
     - “Redução de 40% nos erros de leitura”
     - “2x mais agilidade no picking”
     - “Implantação em 5 dias úteis”
   - Visual com bordas suaves, fundo branco e detalhes em laranja.

10. Adicionar bloco de vídeo demonstrativo
   - Criar seção “Veja na prática”.
   - Incorporar vídeo institucional ou do YouTube quando houver URL.
   - Se não houver vídeo, exibir placeholder elegante com chamada para contato.

11. Atualizar o footer
   - Footer escuro, alinhado ao padrão da marca.
   - Colunas:
     - Logo e descrição da Tech4Rent
     - Navegação
     - Institucional
     - Contato
     - Redes sociais
   - Manter dados vindos das configurações da empresa.

Arquivos principais que serão alterados/criados:
- `src/pages/Index.tsx`
- `src/components/landing/Navbar.tsx`
- `src/components/landing/HeroSection.tsx`
- `src/components/landing/EquipmentSection.tsx`
- `src/components/landing/Footer.tsx`
- `src/components/landing/BenefitsBarSection.tsx` novo
- `src/components/landing/PresenceSection.tsx` novo
- `src/components/landing/ResultsSection.tsx` novo
- `src/components/landing/VideoShowcaseSection.tsx` novo
- `src/components/admin/ImageUploadField.tsx`
- `src/pages/admin/Configuracoes.tsx`
- `src/store/index.ts`

Detalhes técnicos:
- Manter React, Vite, Tailwind e shadcn.
- Não alterar arquivos auto-gerados de integração.
- Preservar os dados atuais de `companySettings` e `equipments`.
- A homepage continuará carregando dados públicos com `fetchAllData(true)`.
- O vídeo do Hero será opcional.
- A identidade visual seguirá o padrão atual da Tech4Rent, especialmente o laranja `#F97316` e a logo configurada no sistema.
