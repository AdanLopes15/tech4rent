
import React from "react";

const StaticLayout = ({ title, children }: { title: string; children: React.ReactNode }) => {
  return (
    <div className="min-h-screen bg-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 border-b-2 border-[#F97316] pb-4 mb-8">
          {title}
        </h1>
        <div className="prose prose-orange max-w-none text-gray-700 space-y-6">
          {children}
        </div>
      </div>
    </div>
  );
};

export const PoliticaPrivacidade = () => {
  return (
    <StaticLayout title="Política de Privacidade">
      <p>
        A TECH4RENT respeita a privacidade dos usuários e está comprometida com a proteção dos dados pessoais tratados em suas plataformas e integrações.
      </p>
      <p>
        Esta política explica, de forma simples, como coletamos, usamos, armazenamos e protegemos informações fornecidas por usuários, clientes e integrações com plataformas de terceiros, incluindo Meta, Facebook e Instagram.
      </p>
      
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">1. Informações coletadas</h2>
        <p>
          Podemos coletar informações básicas fornecidas pelo usuário, como nome, e-mail, telefone, identificadores de conta, informações de perfil público, identificadores de páginas, contas profissionais do Instagram/Facebook e mensagens trocadas por meio das integrações autorizadas.
        </p>
      </div>

      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">2. Uso das informações</h2>
        <p>
          As informações são utilizadas exclusivamente para permitir o funcionamento da plataforma TECH4RENT, incluindo atendimento, organização de conversas, envio e recebimento de mensagens, gestão de contatos, integrações com canais de comunicação e melhoria da experiência do usuário.
        </p>
      </div>

      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">3. Integrações com Meta, Facebook e Instagram</h2>
        <p>
          Quando o usuário autoriza uma integração com Facebook ou Instagram, a TECH4RENT pode acessar dados permitidos pela própria Meta, como identificadores de conta, páginas conectadas, contas profissionais e mensagens, conforme as permissões concedidas no momento da autorização.
        </p>
      </div>

      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">4. Compartilhamento de dados</h2>
        <p>
          A TECH4RENT não vende, aluga ou comercializa dados pessoais. Os dados podem ser compartilhados apenas quando necessário para operação técnica da plataforma, cumprimento de obrigações legais ou mediante autorização do usuário.
        </p>
      </div>

      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">5. Armazenamento e segurança</h2>
        <p>
          Adotamos medidas técnicas e organizacionais para proteger os dados contra acesso não autorizado, alteração, divulgação ou destruição indevida.
        </p>
      </div>

      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">6. Direitos do usuário</h2>
        <p>
          O usuário pode solicitar acesso, correção, atualização ou exclusão de seus dados pessoais entrando em contato pelo e-mail: joaovmorais06@gmail.com.
        </p>
      </div>

      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">7. Exclusão de dados</h2>
        <p>
          O usuário pode solicitar a exclusão de seus dados por meio da página de Exclusão de Dados disponível em /exclusao-de-dados.
        </p>
      </div>

      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">8. Alterações nesta política</h2>
        <p>
          Esta Política de Privacidade pode ser atualizada periodicamente. A versão mais recente estará sempre disponível nesta página.
        </p>
      </div>

      <p className="pt-8 text-sm text-gray-500 border-t border-gray-100">
        Última atualização: 07/05/2026.
      </p>
    </StaticLayout>
  );
};

export const TermosUso = () => {
  return (
    <StaticLayout title="Termos de Uso">
      <p>
        Bem-vindo à TECH4RENT. Ao acessar ou utilizar nossas plataformas, serviços, sites e integrações, você concorda com estes Termos de Uso.
      </p>

      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">1. Uso da plataforma</h2>
        <p>
          A TECH4RENT oferece soluções digitais para gestão, atendimento, comunicação e integrações com canais externos, incluindo WhatsApp, Facebook, Instagram e outros serviços compatíveis.
        </p>
      </div>

      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">2. Responsabilidades do usuário</h2>
        <p>
          O usuário é responsável por fornecer informações corretas, manter suas credenciais seguras e utilizar a plataforma de acordo com a legislação vigente e as políticas das plataformas integradas.
        </p>
      </div>

      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">3. Integrações externas</h2>
        <p>
          Ao conectar contas de terceiros, como Facebook ou Instagram, o usuário declara possuir autorização para realizar essa integração e concorda com as permissões solicitadas durante o processo de autenticação.
        </p>
      </div>

      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">4. Uso adequado</h2>
        <p>
          É proibido utilizar a plataforma para atividades ilegais, envio de spam, fraude, violação de direitos de terceiros ou descumprimento das políticas das plataformas integradas.
        </p>
      </div>

      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">5. Disponibilidade</h2>
        <p>
          A TECH4RENT busca manter seus serviços disponíveis, mas não garante funcionamento ininterrupto, podendo ocorrer manutenções, instabilidades ou indisponibilidades temporárias.
        </p>
      </div>

      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">6. Limitação de responsabilidade</h2>
        <p>
          A TECH4RENT não se responsabiliza por falhas causadas por serviços externos, indisponibilidades de plataformas de terceiros, uso indevido da ferramenta ou informações inseridas incorretamente pelo usuário.
        </p>
      </div>

      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">7. Alterações dos termos</h2>
        <p>
          Estes Termos de Uso podem ser atualizados a qualquer momento. A versão mais recente estará sempre disponível nesta página.
        </p>
      </div>

      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">8. Contato</h2>
        <p>
          Para dúvidas sobre estes Termos de Uso, entre em contato pelo e-mail: joaovmorais06@gmail.com.
        </p>
      </div>

      <p className="pt-8 text-sm text-gray-500 border-t border-gray-100">
        Última atualização: 07/05/2026.
      </p>
    </StaticLayout>
  );
};

export const ExclusaoDados = () => {
  return (
    <StaticLayout title="Exclusão de Dados do Usuário">
      <p>
        A TECH4RENT permite que usuários solicitem a exclusão de seus dados pessoais armazenados em nossas plataformas e integrações.
      </p>

      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Como solicitar a exclusão:</h2>
        <p>Para solicitar a exclusão dos seus dados, envie um e-mail para:</p>
        <p className="font-semibold text-[#F97316] mt-2">joaovmorais06@gmail.com</p>
      </div>

      <div className="bg-gray-50 p-6 rounded-lg border border-gray-100">
        <p className="font-semibold mb-2">No assunto do e-mail, informe:</p>
        <p className="mb-4 italic">Solicitação de Exclusão de Dados</p>
        
        <p className="font-semibold mb-2">No corpo da mensagem, envie:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Nome completo</li>
          <li>E-mail utilizado na plataforma</li>
          <li>Canal ou conta integrada, se aplicável</li>
          <li>Descrição da solicitação</li>
        </ul>
      </div>

      <p>
        Após o recebimento da solicitação, analisaremos as informações e realizaremos a exclusão dos dados aplicáveis dentro de um prazo razoável, respeitando obrigações legais, fiscais, regulatórias ou de segurança que possam exigir a retenção de determinadas informações por período adicional.
      </p>

      <p>
        Caso a solicitação esteja relacionada a uma integração com Meta, Facebook ou Instagram, o usuário também pode remover o acesso diretamente nas configurações de aplicativos e sites da própria plataforma Meta.
      </p>

      <p className="pt-8 text-sm text-gray-500 border-t border-gray-100">
        Última atualização: 07/05/2026.
      </p>
    </StaticLayout>
  );
};
