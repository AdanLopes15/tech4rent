# Tech4Rent

vou migrar meu sistema da tech4rent pra ca, preciso criar um novo projeto, que tenha

Aqui está uma descrição completa e detalhada do sistema TECH4RENT, estruturada para que você possa replicar ou descrever o projeto no Lovable.

O sistema é um ERP (Enterprise Resource Planning) especializado em Locação e Venda de Equipamentos. Ele gerencia desde o catálogo de produtos e CRM de clientes até a geração de contratos, controle de estoque, faturamento parcelado e relatórios financeiros avançados (DRE e Fluxo de Caixa).

Framework: Next.js 14/15 (App Router).

Linguagem: TypeScript.

Estilização: Tailwind CSS + Shadcn UI (Componentes de interface).

Banco de Dados e Backend: Firebase (Firestore para dados, Auth para usuários, Storage para arquivos/PDFs).

Gerenciamento de Estado: Zustand (Centraliza toda a lógica de negócio no arquivo src/store/index.ts).

Biblioteca de Ícones: Lucide React.

Datas: Date-fns.

Landing page dinâmica para clientes finais.

Seções: Hero (Início), Barra de Contato (WhatsApp/E-mail), Produto em Destaque, Vitrine de Equipamentos (Carrossel), Diferenciais, Sobre Nós e Formulário de Contato.

Funcionalidade: Permite ao cliente solicitar orçamentos que caem direto no dashboard administrativo.

Cards de resumo: Receita/Despesa do mês, Contratos ativos e Equipamentos disponíveis.

Tabelas de atividades recentes: Últimos contratos e últimas vendas.

Equipamentos: Cadastro completo com nome, categoria, nº de série, status (disponível, alugado, manutenção), finalidade (venda/locação), taxas diária/semanal/mensal e upload de múltiplas fotos.

Clientes: Cadastro de Pessoa Física (CPF) ou Jurídica (CNPJ) com busca automática de endereço via CEP (ViaCEP) e dados de empresa via BrasilAPI.

Fornecedores: Gestão de parceiros para compras e serviços.

Colaboradores: Usuários vinculados aos clientes que operam os equipamentos.

Orçamentos: Criação de orçamentos internos ou gestão de pedidos vindos do site. Permite conversão direta de um orçamento aprovado em Contrato ou Venda.

Contratos (O Coração do Sistema):

Geração de contratos de locação.

Lógica de Faturamento: Calcula automaticamente o valor mensal e gera todas as parcelas financeiras para o período do contrato.

Fatura de Locação (PDF): Gera um documento de cobrança dinâmico que sempre identifica a próxima parcela pendente (ex: se pagou 4 de 12, a fatura mostra 5/12).

Recibo de Entrega: Gera termo de entrega para assinatura.

Finalização: Processo de encerramento que verifica itens devolvidos, atualiza estoque e cobra multas ou itens perdidos.

Venda de Equipamentos: Registro de venda direta com baixa automática de estoque e geração de receitas no financeiro.

Ordens de Compra: Pedidos de aquisição de novos equipamentos para fornecedores.

Visão Geral: Gráficos de performance (Receitas vs Despesas) e status de recebimentos.

Contas a Receber: Gestão de todas as faturas de contratos e vendas.

Contas a Pagar: Gestão de despesas fixas e variáveis, com anexo de comprovantes.

Boletos: Central para anexar PDFs de boletos bancários às parcelas dos clientes.

Fluxo de Caixa: Projeção diária de saldo baseada em vencimentos futuros.

Extrato: Histórico de movimentações reais por conta bancária e transferências entre contas.

DRE (Demonstrativo do Resultado do Exercício): Relatório contábil que mostra lucro/prejuízo real baseado no Plano de Contas.

NFe: Módulo para emissão de notas fiscais de serviço ou produto via API (Nuvem Fiscal).

Perfil da Empresa: Dados para documentos e logos.

Layout & Estilo: Personalização de cores e tipografia do site público.

Plano de Contas: Estrutura hierárquica para categorizar receitas e despesas (essencial para o DRE).

Bancos: Cadastro de contas bancárias e saldos iniciais.

Cláusulas Contratuais: Editor de textos padrões para contratos e recibos.

Usuários do Sistema: Gestão de permissões (Admin, Gestor, Colaborador).

Validação de Documentos: O sistema impede duplicidade de CPF/CNPJ no banco de dados.

Gestão de Estoque: A criação de um contrato ou venda "reserva" o item, e a finalização/cancelamento devolve ao estoque.

Recalcular Parcelas: Se as datas ou valores de um contrato mudam, o sistema limpa as parcelas futuras e gera novas sem afetar o que já foi pago.

Fatura Dinâmica: O sistema percorre as receitas do contrato, ordena por data e seleciona a primeira que não tenha status "recebido" para exibir no PDF de cobrança.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://tech4rent.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/f8725897-9321-43de-abc7-1efb6270142a).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
