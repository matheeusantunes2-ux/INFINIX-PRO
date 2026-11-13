const modules = [
  ['👥', 'Clientes', 'Cadastro e relacionamento'],
  ['💬', 'Chat', 'Comunicação da equipe'],
  ['🛍️', 'Shop Feed', 'Publicações e produtos'],
  ['📅', 'Agenda', 'Compromissos e marcações'],
  ['💰', 'Financeiro', 'Contas e movimentações'],
  ['📄', 'Propostas', 'Envio e aprovação comercial'],
  ['🗺️', 'Regiões', 'Equipes e metas regionais'],
  ['🧾', 'Comandas', 'Pedidos e fechamento'],
];
export default function App() {
  return <main className="shell">
    <aside className="sidebar">
      <div className="brand"><span className="brand-mark">I</span><div><b>INFINIX</b><small>PRO</small></div></div>
      <p className="nav-label">PLATAFORMA</p>
      <a className="active">▦ Visão geral</a>
      {modules.map(([icon, name]) => <a key={name}>{icon} {name}</a>)}
      <div className="sidebar-bottom"><span className="status-dot"/> Fundação do sistema · v0.1</div>
    </aside>
    <section className="content">
      <header><div><span className="eyebrow">ESPAÇO DE TRABALHO</span><h1>Visão geral</h1><p>Bem-vindo ao início da sua operação.</p></div><div className="avatar">IP</div></header>
      <div className="notice"><b>Ambiente inicial</b><span>Estrutura do sistema criada. Os módulos serão ativados após implementação da API, autenticação e testes.</span></div>
      <h2>Módulos da plataforma</h2>
      <div className="grid">{modules.map(([icon, name, desc]) => <article className="card" key={name}><div className="icon">{icon}</div><h3>{name}</h3><p>{desc}</p><span className="tag">Em desenvolvimento</span></article>)}</div>
      <footer>INFINIX PRO <span>Gestão integrada para sua empresa.</span></footer>
    </section>
  </main>;
}
