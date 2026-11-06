// Interface: abertura, barra superior, dock de câmera/sol, painel lateral (unidade, espelho, CRM, relatórios, dados).
import './estilo.css';
import type { Empreendimento, EtapaLead, StatusUnidade } from '../core/tipos.ts';
import { ETAPAS, STATUS_INFO } from '../core/tipos.ts';
import {
  alertas, atualizarUnidade, buscarLeads, criarLead, definirPin, editarLead, etapaRotulo, excluirLead, moverLead,
  nomeUnidade, pavimentoRotulo, precoParaCliente, registrarInteracao, reservasVencidas, statusContagem, tipologia, unidadeTecnica, urgenciaLead,
} from '../core/regras.ts';
import { resumoSolarUnidade, posicaoSol, instanteLocal, pontoCardeal } from '../core/sol.ts';
import { exportarJSON, nomeArquivoBackup } from '../core/backup.ts';
import { brl, dataBR, esc, hojeISO, linkSeguro, m2, num, pct } from '../core/util.ts';
import { Estado } from './estado.ts';
import { criarApp3D, ehCelular, type App3D, type Vista } from '../cena/app3d.ts';
import { imagem } from '../recursos.ts';
import { montarRelatorio } from '../relatorios/dados.ts';

type Tela = { t: 'unidade'; id: string } | { t: 'espelho' } | { t: 'empreendimento' } | { t: 'clientes'; filtro?: EtapaLead | 'ativos' | 'todos'; busca?: string } | { t: 'cliente'; id: string } | { t: 'novoCliente'; unidade?: string } | { t: 'relatorios' } | { t: 'dados' } | { t: 'alertas' };

const $ = <T extends HTMLElement = HTMLElement>(s: string, r: ParentNode = document) => r.querySelector(s) as T;

export function iniciarUI(emp: Empreendimento) {
  const est = new Estado(emp);
  const raiz = document.documentElement;
  raiz.style.setProperty('--primaria', emp.identidade.corPrimaria);
  raiz.style.setProperty('--madeira', emp.identidade.corSecundaria);
  raiz.style.setProperty('--assinatura', emp.identidade.fonteAssinatura);
  document.title = `${emp.nome} ${emp.subtitulo} — Apresentação 3D`;
  const logo = imagem(emp.incorporadora.logo);
  const fotoFachada = imagem(emp.imagensGerais[0]?.arquivo);

  const app = document.getElementById('app')!;
  app.innerHTML = `
    <div id="cena" role="application" aria-label="Maquete 3D interativa"></div>
    <header class="topo">
      <div class="marca">${logo ? `<img src="${logo}" alt="${esc(emp.incorporadora.nome)}">` : ''}<div class="nome"><b>${esc(emp.nome.toUpperCase())}</b><i>${esc(emp.subtitulo)}</i></div></div>
      <div class="espaco"></div>
      <nav class="menu-topo" aria-label="Menu principal">
        <button class="btn" data-go="espelho" title="Espelho de vendas (E)">▦ <span class="rotulo">Espelho de vendas</span></button>
        <button class="btn" data-go="empreendimento">ⓘ <span class="rotulo">O empreendimento</span></button>
        <button class="btn so-gerente" data-go="clientes">👥 <span class="rotulo">Clientes</span></button>
        <button class="btn so-gerente" data-go="relatorios">📊 <span class="rotulo">Relatórios</span></button>
        <button class="btn so-gerente" data-go="dados">💾 <span class="rotulo">Dados</span></button>
        <button class="btn so-gerente sino" data-go="alertas" aria-label="Alertas">🔔<span class="contador" hidden></span></button>
        <button class="btn" data-act="modo" title="Alternar modo cliente / gerente">🔒<span class="chip-modo">Cliente</span></button>
        <button class="btn" data-act="tela-cheia" aria-label="Tela cheia (F)">⛶</button>
      </nav>
    </header>
    <div class="bussola" aria-hidden="true"><div class="agulha"></div></div>
    <div class="legenda" aria-label="Legenda das cores">
      ${(Object.keys(STATUS_INFO) as StatusUnidade[]).map((s) => `<div class="item"><span class="bolinha" style="background:${STATUS_INFO[s].cor}">${STATUS_INFO[s].icone}</span>${STATUS_INFO[s].rotulo}</div>`).join('')}
      <div class="noite">🌙 À noite: luz acesa = disponível<br>meia-luz = reservado/negociação<br>apagada = vendido</div>
    </div>
    <div class="faixa-exemplo so-gerente" hidden>Dados de exemplo</div>
    <nav class="dock" aria-label="Câmera e iluminação">
      <button class="btn" data-vista="geral">⌂ <span>Geral</span></button>
      <button class="btn" data-act="drone" aria-pressed="false">✈ <span>Drone</span></button>
      <button class="btn" data-vista="ruaPrincipal">🚶 <span>${esc(emp.endereco.logradouro.replace(/,.*$/, ''))}</span></button>
      ${emp.endereco.esquina ? `<button class="btn" data-vista="ruaLateral">🚶 <span>${esc(emp.endereco.esquina)}</span></button>` : ''}
      <button class="btn" data-vista="aerea">⬇ <span>Aérea</span></button>
      <button class="btn" data-vista="bairro">🏙 <span>Bairro</span></button>
      <span class="sep"></span>
      <div class="relogio"><button class="btn btn-ico" data-act="sol" aria-label="Sol e horário">☀</button><input type="range" min="5" max="21" step="0.25" aria-label="Hora do dia"><output>10:30</output></div>
      <button class="btn" data-act="noite" aria-pressed="false">🌙 <span>Noite</span></button>
      <span class="sep"></span>
      <button class="btn" data-act="realce" aria-pressed="false">◧ <span>Disponibilidade</span></button>
      <button class="btn" data-act="pavimentos">☰ <span>Pavimentos</span></button>
    </nav>
    <div class="pop" id="pop-sol" hidden></div>
    <div class="pop" id="pop-pav" hidden></div>
    <aside class="painel" aria-label="Painel de informações"><div class="painel-cab"><h2></h2><button class="btn-ico" data-act="fechar" aria-label="Fechar painel">✕</button></div><div class="painel-corpo"></div></aside>
    <div class="toasts" aria-live="polite"></div>
    <div class="abertura" id="abertura">
      <div class="caixa">
        ${fotoFachada ? `<img class="foto" src="${fotoFachada}" alt="Fachada do ${esc(emp.nome)}">` : '<div></div>'}
        <div>
          ${logo ? `<img class="logo-inc" src="${logo}" alt="${esc(emp.incorporadora.nome)}">` : ''}
          <h1>${esc(emp.nome.toUpperCase())}</h1><div class="ass">${esc(emp.subtitulo)}</div>
          <p class="end">${esc(emp.endereco.logradouro)} · ${esc(emp.endereco.bairro)} · ${esc(emp.endereco.cidade)}/${esc(emp.endereco.uf)}</p>
          <div class="acoes">
            <button class="btn btn-primario btn-bloco" data-act="iniciar" disabled>▶ Iniciar apresentação</button>
            <button class="btn btn-bloco" data-act="iniciar-gerente" disabled>🔒 Entrar como gerente</button>
            <button class="btn btn-bloco" data-act="importar">⬆ Importar backup (.json)</button>
          </div>
          <div class="carregando"><span>Montando a maquete 3D…</span><div class="barra-carga"><i></i></div></div>
        </div>
      </div>
    </div>
    <input type="file" id="arquivo-json" accept=".json,application/json" hidden>`;

  const painel = $('.painel'), corpo = $('.painel-corpo'), titulo = $('.painel-cab h2');
  let tela: Tela | null = null;
  let unidadeSel: string | null = null;
  let realceOn = false, isolado: number | null = null, droneOn = false;
  const horario = { data: hojeISO(), hora: 10.5 };
  let app3d: App3D;

  // ---------- utilidades de interface ----------
  function toast(msg: string, tipo: 'ok' | 'erro' | '' = '') {
    const t = document.createElement('div');
    t.className = `toast ${tipo}`; t.textContent = msg;
    $('.toasts').appendChild(t);
    setTimeout(() => t.remove(), tipo === 'erro' ? 6000 : 3200);
  }
  function modal(html: string, aoAbrir?: (m: HTMLElement, fechar: () => void) => void) {
    const f = document.createElement('div');
    f.className = 'modal-fundo';
    f.innerHTML = `<div class="modal" role="dialog" aria-modal="true">${html}</div>`;
    document.body.appendChild(f);
    const fechar = () => f.remove();
    f.addEventListener('click', (e) => { if (e.target === f) fechar(); });
    f.addEventListener('keydown', (e) => { if (e.key === 'Escape') fechar(); });
    aoAbrir?.(f.querySelector('.modal')!, fechar);
    (f.querySelector('input,button') as HTMLElement | null)?.focus();
  }
  function lightbox(lista: { src: string; legenda: string }[], i0 = 0) {
    let i = i0;
    const f = document.createElement('div');
    f.className = 'lightbox';
    f.innerHTML = `<button class="btn-ico fechar" aria-label="Fechar">✕</button><div><img alt=""><p></p></div>${lista.length > 1 ? '<div class="nav"><button class="btn-ico" data-d="-1" aria-label="Anterior">‹</button><button class="btn-ico" data-d="1" aria-label="Próxima">›</button></div>' : ''}`;
    const mostrar = () => { (f.querySelector('img') as HTMLImageElement).src = lista[i].src; f.querySelector('p')!.textContent = lista[i].legenda; };
    f.addEventListener('click', (e) => {
      const b = (e.target as HTMLElement).closest('button') as HTMLElement | null;
      if (b?.dataset.d) { i = (i + Number(b.dataset.d) + lista.length) % lista.length; mostrar(); }
      else if (b || e.target === f) f.remove();
    });
    const kd = (e: KeyboardEvent) => { if (e.key === 'Escape') { f.remove(); window.removeEventListener('keydown', kd); } };
    window.addEventListener('keydown', kd);
    document.body.appendChild(f); mostrar();
  }
  const chipStatus = (s: StatusUnidade) => `<span class="status" style="--cor:${STATUS_INFO[s].cor}">${STATUS_INFO[s].icone} ${STATUS_INFO[s].rotulo}</span>`;
  const statusMap = () => Object.fromEntries(Object.values(est.dados.unidades).map((u) => [u.id, u.status])) as Record<string, StatusUnidade>;
  const gerente = () => est.modo === 'gerente';
  const horaTxt = (h: number) => `${String(Math.floor(h)).padStart(2, '0')}:${String(Math.round((h % 1) * 60)).padStart(2, '0')}`;

  // ---------- 3D ----------
  function atualizar3D() {
    if (!app3d) return;
    app3d.definirStatus(statusMap());
    atualizarRotulos();
  }
  function atualizarRotulos() {
    const on = realceOn || isolado != null;
    const textos: Record<string, { texto: string; cor: string }> = {};
    for (const u of emp.unidades) {
      if (isolado != null && !(u.pavimento === isolado || u.pavimentosOcupados?.includes(isolado))) continue;
      const s = est.dados.unidades[u.id].status;
      textos[u.id] = { texto: `${u.id} · ${STATUS_INFO[s].rotulo}`, cor: STATUS_INFO[s].cor };
    }
    app3d.rotulos(on, textos);
  }

  // ---------- painel ----------
  function abrir(t: Tela) {
    tela = t;
    painel.classList.add('aberto');
    document.body.classList.add('com-painel');
    renderizar();
    corpo.scrollTop = 0;
  }
  function fechar() {
    tela = null;
    painel.classList.remove('aberto');
    document.body.classList.remove('com-painel');
    unidadeSel = null;
    app3d?.selecionar(null);
  }
  function renderizar() {
    if (!tela) return;
    const r = TELAS[tela.t](tela as any);
    titulo.innerHTML = r.titulo;
    corpo.innerHTML = r.html;
    r.depois?.();
  }
  let sujo = false;
  corpo.addEventListener('input', () => { sujo = true; });

  const TELAS: Record<Tela['t'], (t: any) => { titulo: string; html: string; depois?: () => void }> = {
    unidade: ({ id }: { id: string }) => {
      const u = unidadeTecnica(emp, id)!;
      const c = est.dados.unidades[id];
      const tip = tipologia(emp, u.tipologia);
      const preco = gerente() ? c.preco : precoParaCliente(est.dados, id);
      const sol = resumoSolarUnidade(emp, u);
      const pav = emp.pavimentos.find((p) => p.numero === u.pavimento);
      const imgs = tip.imagens.filter((n) => imagem(n));
      const interessados = est.dados.leads.filter((l) => l.unidadesInteresse.includes(id) || l.unidadeId === id);
      const lead = c.leadId ? est.dados.leads.find((l) => l.id === c.leadId) : null;
      let html = `
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">${chipStatus(c.status)}<span class="nota">${esc(pavimentoRotulo(emp, u.pavimento))}${u.pavimentosOcupados ? ' + ' + u.pavimentosOcupados.slice(1).map((n) => n + 'º').join(', ') : ''}</span></div>
        <p style="margin:10px 0 4px"><b>${esc(tip.nome)}</b> — ${esc(tip.descricao)}</p>
        ${preco != null ? `<div class="preco">${brl(preco)}</div><div class="nota">${brl(Math.round(preco / u.areaPrivativa))}/m² privativo${est.dados.exemplo ? ' · <b>valores de demonstração</b>' : ''}</div>` : c.status === 'vendido' ? '<p><b>Unidade vendida.</b> Veja outras opções disponíveis no espelho de vendas.</p>' : '<p class="nota">Preço sob consulta.</p>'}
        ${c.condicoes && (gerente() || preco != null) ? `<p class="nota">${esc(c.condicoes)}</p>` : ''}
        <div class="acoes">
          <button class="btn btn-madeira btn-bloco" data-act="tour" data-id="${id}">▶ Tour virtual 3D (visita guiada)</button>
          <div class="acoes-2"><button class="btn btn-bloco" data-act="focar" data-id="${id}">🎯 Ver na fachada</button><button class="btn btn-bloco" data-act="isolar" data-n="${u.pavimento}">☰ Ver pavimento</button></div>
        </div>
        <h3>Ficha técnica</h3>
        <div class="grade">
          <div class="cartao"><small>Área privativa</small><b>${m2(u.areaPrivativa)}</b></div>
          <div class="cartao"><small>Área descoberta</small><b>${u.areaDescoberta ? m2(u.areaDescoberta) : '—'}</b></div>
          <div class="cartao"><small>Quartos</small><b>${tip.quartos} (${tip.suites} suíte${tip.suites > 1 ? 's' : ''})</b></div>
          <div class="cartao"><small>Banheiros</small><b>${tip.banheiros}</b></div>
          <div class="cartao"><small>Vagas de garagem</small><b>${c.vagas ?? u.vagas}</b></div>
          <div class="cartao"><small>Varanda</small><b style="font-size:14px">${esc(tip.varanda)}</b></div>
        </div>
        <h3>Sol e orientação</h3>
        ${sol.orientacoes.map((o) => `<div class="sol-item"><b>Fachada ${esc(o.cardeal)} (${o.azimute}°)</b><span>${esc(o.comentario)}</span><span>☀ Sol direto: ~${num(o.inverno, 1)} h no inverno · ~${num(o.verao, 1)} h no verão</span></div>`).join('')}
        <p class="nota">Cálculo astronômico para ${esc(emp.endereco.cidade)} (sem considerar sombra de vizinhos). Use ☀ na barra inferior para simular qualquer data e hora.</p>
        ${pav?.planta && imagem(pav.planta) ? `<h3>Planta do pavimento</h3><img class="planta-img" src="${imagem(pav.planta)}" alt="Planta do ${esc(pav.nome)}" data-act="ver-planta" data-src="${pav.planta}">` : ''}
        ${imgs.length ? `<h3>Imagens do projeto</h3><div class="galeria">${imgs.map((n, i) => `<button data-act="galeria" data-i="${i}" data-id="${id}" aria-label="Ampliar imagem ${i + 1}"><img src="${imagem(n)}" alt="" loading="lazy"></button>`).join('')}</div><p class="nota">${esc(emp.avisoLegal)}</p>` : ''}`;
      if (gerente()) {
        html += `
        <h3>Gestão da unidade</h3>
        ${c.status === 'reservado' && c.reservaAte ? `<div class="aviso">Reservada até <b>${dataBR(c.reservaAte)}</b>${lead ? ` para <b>${esc(lead.nome)}</b>` : ''}.</div>` : ''}
        <form class="form" data-form="unidade" data-id="${id}">
          <div class="duas">
            <label>Situação<select name="status">${(Object.keys(STATUS_INFO) as StatusUnidade[]).map((s) => `<option value="${s}" ${s === c.status ? 'selected' : ''}>${STATUS_INFO[s].rotulo}</option>`).join('')}</select></label>
            <label>Preço de tabela (R$)<input name="preco" inputmode="numeric" value="${c.preco ?? ''}" placeholder="ex.: 850000"></label>
          </div>
          <label>Condições de pagamento<textarea name="condicoes" placeholder="Entrada, parcelas, financiamento…">${esc(c.condicoes)}</textarea></label>
          <div class="duas">
            <label>Vagas<input name="vagas" type="number" min="0" max="9" value="${c.vagas ?? u.vagas}"></label>
            <label>Corretor<input name="corretor" list="lista-corretores" value="${esc(c.corretor)}"></label>
          </div>
          <label>Cliente vinculado<select name="leadId"><option value="">— nenhum —</option>${est.dados.leads.map((l) => `<option value="${l.id}" ${l.id === c.leadId ? 'selected' : ''}>${esc(l.nome)}</option>`).join('')}</select></label>
          <div class="duas">
            <label>Data da venda<input name="vendaData" type="date" value="${c.vendaData ?? ''}"></label>
            <label>Valor da venda (R$)<input name="vendaValor" inputmode="numeric" value="${c.vendaValor ?? ''}"></label>
          </div>
          <label>Observações internas<textarea name="obs">${esc(c.obs)}</textarea></label>
          <div class="erro-form" role="alert"></div>
          <button class="btn btn-primario" type="submit">Salvar unidade</button>
        </form>
        <datalist id="lista-corretores">${est.dados.config.corretores.map((n) => `<option value="${esc(n)}">`).join('')}</datalist>
        <h3>Clientes interessados (${interessados.length})</h3>
        ${interessados.map((l) => cartaoLead(l.id)).join('') || '<p class="nota">Nenhum cliente ligado a esta unidade.</p>'}
        <button class="btn btn-bloco" data-act="novo-cliente" data-id="${id}">＋ Novo cliente interessado nesta unidade</button>`;
      }
      return { titulo: `${esc(nomeUnidade(u))}`, html };
    },

    espelho: () => {
      const cont = statusContagem(est.dados);
      const pavs = [...new Set(emp.unidades.map((u) => u.pavimento))].sort((a, b) => b - a);
      const max = Math.max(...pavs.map((p) => emp.unidades.filter((u) => u.pavimento === p).length));
      const html = `
        <div class="resumo-status">${(Object.keys(STATUS_INFO) as StatusUnidade[]).filter((s) => cont[s]).map((s) => `<span class="status" style="--cor:${STATUS_INFO[s].cor}">${STATUS_INFO[s].icone} ${cont[s]} ${STATUS_INFO[s].rotulo.toLowerCase()}</span>`).join('')}</div>
        <div class="espelho" style="--cols:${max}">
          ${pavs.map((p) => `<div class="andar" style="grid-template-columns:42px repeat(${max},1fr)"><span>${p}º</span>${emp.unidades.filter((u) => u.pavimento === p).map((u) => {
            const c = est.dados.unidades[u.id];
            const pr = gerente() ? c.preco : precoParaCliente(est.dados, u.id);
            return `<button class="celula ${unidadeSel === u.id ? 'sel' : ''}" style="--cor:${STATUS_INFO[c.status].cor}" data-act="abrir-unidade" data-id="${u.id}" aria-label="Unidade ${u.id}, ${STATUS_INFO[c.status].rotulo}"><b>${u.nome ? esc(u.nome) : u.id}</b><small>${STATUS_INFO[c.status].icone} ${STATUS_INFO[c.status].rotulo}</small><small>${m2(u.areaPrivativa)}${pr != null && c.status !== 'vendido' ? ' · ' + brl(pr) : ''}</small></button>`;
          }).join('')}</div>`).join('')}
        </div>
        <p class="nota" style="margin-top:12px">Toque numa unidade para ver detalhes, voar até ela na maquete e fazer o tour virtual.</p>`;
      return { titulo: 'Espelho de vendas', html };
    },

    empreendimento: () => {
      const e = emp.endereco;
      const maps = e.mapsUrl ? linkSeguro(e.mapsUrl) : null;
      const imgs = emp.imagensGerais.filter((i) => imagem(i.arquivo));
      const p = posicaoSol(instanteLocal(horario.data, horario.hora, emp.geo.fusoHoras), emp.geo.lat, emp.geo.lon);
      const html = `
        ${imgs.length ? `<div class="galeria" style="grid-template-columns:1fr 1fr">${imgs.map((i, k) => `<button data-act="galeria-geral" data-i="${k}" aria-label="${esc(i.titulo)}"><img src="${imagem(i.arquivo)}" alt="${esc(i.titulo)}"></button>`).join('')}</div>` : ''}
        <h3>Localização</h3>
        <p>${esc(e.logradouro)}${e.esquina ? ` (esquina com ${esc(e.esquina)})` : ''} — ${esc(e.bairro)}, ${esc(e.cidade)}/${esc(e.uf)} · CEP ${esc(e.cep)}</p>
        ${maps ? `<a class="btn" href="${maps}" target="_blank" rel="noopener">📍 Abrir no Google Maps</a>` : ''}
        <h3>Diferenciais</h3>
        <ul>${emp.diferenciais.map((d) => `<li>${esc(d)}</li>`).join('')}</ul>
        <h3>Números</h3>
        <div class="grade">
          <div class="cartao"><small>Apartamentos</small><b>${emp.unidades.length}</b></div>
          <div class="cartao"><small>Pavimentos</small><b>${emp.predio.pavimentos}</b></div>
          <div class="cartao"><small>Tipologias</small><b>${Object.keys(emp.tipologias).length}</b></div>
          <div class="cartao"><small>Áreas privativas</small><b style="font-size:14px">${m2(Math.min(...emp.unidades.map((u) => u.areaPrivativa)))} a ${m2(Math.max(...emp.unidades.map((u) => u.areaPrivativa)))}</b></div>
        </div>
        <h3>Sol agora na maquete</h3>
        <p>${dataBR(horario.data)} às ${horaTxt(horario.hora)}: sol ${p.elevacao > 0 ? `a ${num(p.elevacao, 0)}° de altura, vindo do ${pontoCardeal(p.azimute)}` : 'abaixo do horizonte (noite)'}.</p>
        <h3>Incorporadora</h3>
        <p><b>${esc(emp.incorporadora.nome)}</b><br>Reservas: ${esc(emp.incorporadora.telefone)}${emp.memorial ? `<br>${esc(emp.memorial)}` : ''}</p>
        <p class="nota">${esc(emp.avisoLegal)} Entorno da maquete gerado de forma aproximada (ruas e orientação reais; prédios vizinhos ilustrativos).</p>`;
      return { titulo: `${esc(emp.nome)} ${esc(emp.subtitulo)}`, html };
    },

    clientes: ({ filtro = 'ativos', busca = '' }: { filtro?: string; busca?: string }) => {
      let lista = buscarLeads(est.dados, busca);
      if (filtro === 'ativos') lista = lista.filter((l) => l.etapa !== 'vendido' && l.etapa !== 'perdido');
      else if (filtro !== 'todos') lista = lista.filter((l) => l.etapa === filtro);
      const ordemUrg = { atrasado: 0, hoje: 1, ok: 2, encerrado: 3 } as const;
      lista = [...lista].sort((a, b) => ordemUrg[urgenciaLead(a)] - ordemUrg[urgenciaLead(b)] || (a.proximaAcao ?? '').localeCompare(b.proximaAcao ?? ''));
      const cont = (e: string) => est.dados.leads.filter((l) => l.etapa === e).length;
      const html = `
        <div class="busca form"><input type="search" placeholder="Buscar nome, telefone, e-mail ou unidade" value="${esc(busca)}" data-campo="busca-leads" aria-label="Buscar clientes"><button class="btn btn-primario" data-act="novo-cliente">＋ Novo</button></div>
        <div class="funil" role="tablist">
          ${[['ativos', 'Em andamento', est.dados.leads.filter((l) => l.etapa !== 'vendido' && l.etapa !== 'perdido').length], ...ETAPAS.map((e) => [e.id, e.rotulo, cont(e.id)]), ['todos', 'Todos', est.dados.leads.length]].map(([id, rot, n]) => `<button class="btn btn-pequeno" role="tab" aria-pressed="${filtro === id}" data-act="filtro-leads" data-f="${id}">${rot} (${n})</button>`).join('')}
        </div>
        ${lista.map((l) => cartaoLead(l.id)).join('') || '<p class="nota">Nenhum cliente nesta lista.</p>'}`;
      return { titulo: 'Clientes (CRM)', html };
    },

    cliente: ({ id }: { id: string }) => {
      const l = est.dados.leads.find((x) => x.id === id);
      if (!l) return { titulo: 'Cliente', html: '<p>Cliente não encontrado.</p>' };
      const urg = urgenciaLead(l);
      const opUn = emp.unidades.map((u) => `<option value="${u.id}" ${u.id === l.unidadeId ? 'selected' : ''}>${u.id} · ${STATUS_INFO[est.dados.unidades[u.id].status].rotulo}</option>`).join('');
      const html = `
        <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center"><span class="status" style="--cor:#3b4350">${esc(etapaRotulo(l.etapa))}</span><span class="urg urg-${urg}">${urg === 'atrasado' ? '⚠ Retorno atrasado' : urg === 'hoje' ? '⏰ Retornar hoje' : urg === 'ok' ? `Próx. contato ${dataBR(l.proximaAcao)}` : 'Encerrado'}</span></div>
        <p>${l.telefone ? `📞 <a href="tel:${esc(l.telefone.replace(/[^\d+]/g, ''))}">${esc(l.telefone)}</a>` : ''} ${l.telefone ? `· <a href="https://wa.me/55${esc(l.telefone.replace(/\D/g, ''))}" target="_blank" rel="noopener">WhatsApp</a>` : ''}<br>${l.email ? `✉ ${esc(l.email)}` : ''}</p>
        <p class="nota">Origem: ${esc(l.origem || '—')} · Corretor: ${esc(l.corretor || '—')} · Cadastro: ${dataBR(l.criadoEm)}</p>
        ${l.unidadesInteresse.length ? `<p>Interesse: ${l.unidadesInteresse.map((u) => `<button class="btn btn-pequeno" data-act="abrir-unidade" data-id="${u}">${u}</button>`).join(' ')}</p>` : ''}
        <h3>Avançar no funil</h3>
        <form class="form" data-form="mover" data-id="${l.id}">
          <div class="duas">
            <label>Nova etapa<select name="etapa">${ETAPAS.map((e) => `<option value="${e.id}" ${e.id === l.etapa ? 'selected' : ''}>${e.rotulo}</option>`).join('')}</select></label>
            <label>Unidade<select name="unidadeId"><option value="">—</option>${opUn}</select></label>
          </div>
          <div class="duas">
            <label>Valor proposto/fechado (R$)<input name="valor" inputmode="numeric" value="${l.valorProposta ?? ''}"></label>
            <label>Motivo (se perdido)<input name="motivo" value="${esc(l.motivoPerda)}"></label>
          </div>
          <p class="nota">Proposta deixa a unidade "em negociação"; Reserva bloqueia por ${est.dados.config.prazoReservaDias} dias; Contrato/Vendido marca como vendida; Perdido libera a unidade.</p>
          <div class="erro-form" role="alert"></div>
          <button class="btn btn-primario">Aplicar etapa</button>
        </form>
        <h3>Registrar contato</h3>
        <form class="form" data-form="interacao" data-id="${l.id}">
          <div class="duas">
            <label>Tipo<select name="tipo"><option value="ligacao">Ligação</option><option value="whatsapp">WhatsApp</option><option value="visita">Visita</option><option value="email">E-mail</option><option value="nota">Anotação</option></select></label>
            <label>Próximo contato<input type="date" name="proxima" value="${l.proximaAcao ?? ''}"></label>
          </div>
          <label>O que aconteceu<textarea name="texto" placeholder="Ex.: gostou do 502, vai trazer a esposa no sábado"></textarea></label>
          <div class="erro-form" role="alert"></div>
          <button class="btn">Registrar</button>
        </form>
        <h3>Histórico</h3>
        <ul class="historico">${[...l.historico].reverse().map((h) => `<li><time>${dataBR(h.data)}</time>${esc(h.texto)}</li>`).join('')}</ul>
        <h3>Dados do cliente</h3>
        <form class="form" data-form="editar-cliente" data-id="${l.id}">
          <label>Nome<input name="nome" value="${esc(l.nome)}" required></label>
          <div class="duas"><label>Telefone<input name="telefone" value="${esc(l.telefone)}" inputmode="tel"></label><label>E-mail<input name="email" value="${esc(l.email)}" type="email"></label></div>
          <div class="duas"><label>Origem<select name="origem">${['', ...est.dados.config.origens].map((o) => `<option ${o === l.origem ? 'selected' : ''}>${esc(o)}</option>`).join('')}</select></label><label>Corretor<input name="corretor" list="lista-corretores2" value="${esc(l.corretor)}"></label></div>
          <label>Unidades de interesse (separe por vírgula)<input name="interesse" value="${esc(l.unidadesInteresse.join(', '))}"></label>
          <label>Observações<textarea name="obs">${esc(l.obs)}</textarea></label>
          <div class="erro-form" role="alert"></div>
          <button class="btn">Salvar dados</button>
        </form>
        <datalist id="lista-corretores2">${est.dados.config.corretores.map((n) => `<option value="${esc(n)}">`).join('')}</datalist>
        <p style="margin-top:18px"><button class="btn btn-perigo btn-pequeno" data-act="excluir-cliente" data-id="${l.id}" data-confirm="Toque de novo para excluir">Excluir cliente</button></p>`;
      return { titulo: esc(l.nome), html };
    },

    novoCliente: ({ unidade }: { unidade?: string }) => ({
      titulo: 'Novo cliente',
      html: `
        <form class="form" data-form="novo-cliente">
          <label>Nome*<input name="nome" required autocomplete="off"></label>
          <div class="duas"><label>Telefone / WhatsApp<input name="telefone" inputmode="tel"></label><label>E-mail<input name="email" type="email"></label></div>
          <div class="duas"><label>Origem<select name="origem">${['', ...est.dados.config.origens].map((o) => `<option>${esc(o)}</option>`).join('')}</select></label><label>Corretor<input name="corretor" list="lista-corretores3"></label></div>
          <label>Unidades de interesse (separe por vírgula)<input name="interesse" value="${esc(unidade ?? '')}"></label>
          <label>Observações<textarea name="obs"></textarea></label>
          <div class="erro-form" role="alert"></div>
          <button class="btn btn-primario">Cadastrar</button>
        </form>
        <datalist id="lista-corretores3">${est.dados.config.corretores.map((n) => `<option value="${esc(n)}">`).join('')}</datalist>
        <p class="nota">Os dados ficam só neste computador. Faça backup com frequência (Dados → Exportar).</p>`,
    }),

    relatorios: () => {
      const r = montarRelatorio(emp, est.dados);
      const maxF = Math.max(1, ...r.funil.map((f) => f.qtd));
      const html = `
        ${r.exemplo ? '<div class="aviso">Os números abaixo usam <b>dados de exemplo</b>. Em Dados → "Começar do zero" você limpa tudo e cadastra os reais.</div>' : ''}
        <div class="grade">
          <div class="cartao"><small>VGV vendido</small><b>${brl(r.totais.vgvVendido)}</b></div>
          <div class="cartao"><small>Unidades vendidas</small><b>${r.porStatus.find((s) => s.status === 'vendido')!.qtd} de ${r.totais.unidades} (${pct(r.totais.percUnidadesVendidas)})</b></div>
          <div class="cartao"><small>Estoque à venda</small><b>${brl(r.totais.vgvDisponivel)}</b></div>
          <div class="cartao"><small>R$/m² médio vendido</small><b>${brl(r.totais.precoM2Medio)}</b></div>
        </div>
        <h3>Situação das unidades</h3>
        <div class="barras">${r.porStatus.map((s) => `<div class="barra" style="--cor:${STATUS_INFO[s.status].cor}"><span>${s.rotulo}</span><span class="trilho"><i style="width:${(s.perc * 100).toFixed(1)}%"></i></span><b>${s.qtd}</b></div>`).join('')}</div>
        <h3>Funil de clientes</h3>
        <div class="barras">${r.funil.map((f) => `<div class="barra"><span>${f.etapa}</span><span class="trilho"><i style="width:${(f.qtd / maxF) * 100}%"></i></span><b>${f.qtd}</b></div>`).join('')}</div>
        <h3>Baixar relatório completo</h3>
        <div class="acoes">
          <button class="btn btn-primario btn-bloco" data-act="rel" data-f="pdf">📄 PDF</button>
          <button class="btn btn-bloco" data-act="rel" data-f="docx">📝 Word (.docx)</button>
          <button class="btn btn-bloco" data-act="rel" data-f="xlsx">📈 Excel (.xlsx) com fórmulas</button>
        </div>
        <p class="nota">Inclui resumo, imagem atual da maquete, situação por tipologia, espelho de vendas, vendas, funil, origem dos clientes e corretores.</p>`;
      return { titulo: 'Relatórios de vendas', html };
    },

    dados: () => {
      const c = est.dados.config;
      const html = `
        ${!est.salvouOk ? '<div class="aviso erro">⚠ Não foi possível salvar no navegador (memória cheia ou janela anônima). <b>Exporte um backup agora.</b></div>' : ''}
        ${est.dados.exemplo ? '<div class="aviso">Você está usando <b>dados de exemplo</b> para demonstração (preços e clientes fictícios).</div>' : ''}
        <h3>Backup (sem banco de dados)</h3>
        <p>Tudo fica salvo neste navegador, neste computador. O backup é um arquivo <b>.json</b> com todos os dados: guarde em pendrive/Drive e use para levar a outro computador.</p>
        <div class="acoes">
          <button class="btn btn-primario btn-bloco" data-act="exportar">⬇ Exportar backup (.json)</button>
          <button class="btn btn-bloco" data-act="importar">⬆ Importar backup (.json)</button>
        </div>
        <p class="nota">Último backup: ${c.ultimoBackup ? dataBR(c.ultimoBackup) : 'nunca'}. Importar substitui os dados atuais (arquivo inválido é recusado sem apagar nada).</p>
        <h3>Configurações</h3>
        <form class="form" data-form="config">
          <label class="check"><input type="checkbox" name="mostrarPreco" ${c.mostrarPrecoCliente ? 'checked' : ''}> Mostrar preço das unidades disponíveis no modo cliente</label>
          <div class="duas"><label>Prazo da reserva (dias)<input type="number" name="prazo" min="1" max="60" value="${c.prazoReservaDias}"></label><label>Avisar backup após (dias)<input type="number" name="aviso" min="1" max="60" value="${c.diasAvisoBackup}"></label></div>
          <label>Corretores (um por linha)<textarea name="corretores">${esc(c.corretores.join('\n'))}</textarea></label>
          <div class="erro-form" role="alert"></div>
          <button class="btn">Salvar configurações</button>
        </form>
        <h3>Segurança</h3>
        <div class="acoes"><button class="btn btn-bloco" data-act="trocar-pin">🔑 Trocar PIN do gerente</button><button class="btn btn-bloco" data-act="segunda-tela">🖥 Abrir 2ª tela para o cliente (TV)</button></div>
        <p class="nota">O PIN só trava a tela neste computador; não é uma proteção forte. Não compartilhe backups: eles têm telefones e dados de clientes.</p>
        <h3>Recomeçar</h3>
        <div class="acoes">
          <button class="btn btn-perigo btn-bloco" data-act="recomecar" data-confirm="Toque de novo: apaga clientes, preços e vendas">🧹 Começar do zero (apaga tudo, mantém o PIN)</button>
          ${!est.dados.exemplo ? '<button class="btn btn-bloco" data-act="exemplo" data-confirm="Toque de novo: substitui seus dados pelos de exemplo">↺ Carregar dados de exemplo</button>' : ''}
        </div>`;
      return { titulo: 'Dados e configurações', html };
    },

    alertas: () => {
      const a = alertas(est.dados);
      const html = a.length ? a.map((x) => `<button class="alerta-item ${x.nivel}" data-act="${x.leadId ? 'abrir-cliente' : x.unidadeId ? 'abrir-unidade' : 'nada'}" data-id="${x.leadId ?? x.unidadeId ?? ''}">${esc(x.texto)}</button>`).join('') + (reservasVencidas(est.dados).length ? `<button class="btn btn-bloco" data-act="liberar-vencidas" data-confirm="Toque de novo para liberar">Liberar reservas vencidas</button>` : '') : '<p>Nenhum alerta. 🎉</p>';
      return { titulo: 'Alertas', html };
    },
  };

  function cartaoLead(id: string) {
    const l = est.dados.leads.find((x) => x.id === id)!;
    const urg = urgenciaLead(l);
    return `<button class="lead" data-act="abrir-cliente" data-id="${l.id}"><span class="linha1"><b>${esc(l.nome)}</b><span class="urg urg-${urg}">${urg === 'atrasado' ? '⚠ atrasado' : urg === 'hoje' ? '⏰ hoje' : urg === 'ok' ? dataBR(l.proximaAcao) : etapaRotulo(l.etapa)}</span></span><small>${esc(etapaRotulo(l.etapa))}${l.unidadeId ? ` · unidade ${l.unidadeId}` : l.unidadesInteresse.length ? ` · interesse ${l.unidadesInteresse.join(', ')}` : ''}${l.corretor ? ` · ${esc(l.corretor)}` : ''}</small></button>`;
  }

  // ---------- ações ----------
  const numero = (v: FormDataEntryValue | null) => { const s = String(v ?? '').replace(/[^\d,.-]/g, '').replace(/\.(?=\d{3}(\D|$))/g, '').replace(',', '.'); return s ? Number(s) : null; };
  const confirmacoes = new WeakMap<HTMLElement, number>();

  async function acao(act: string, el: HTMLElement) {
    if (el.dataset.confirm) {
      const t = confirmacoes.get(el);
      if (!t || Date.now() - t > 4000) { confirmacoes.set(el, Date.now()); const orig = el.textContent; el.textContent = el.dataset.confirm; setTimeout(() => { if (el.isConnected) el.textContent = orig; }, 4000); return; }
    }
    const id = el.dataset.id!;
    switch (act) {
      case 'fechar': fechar(); break;
      case 'abrir-unidade': selecionarUnidade(id, true); break;
      case 'abrir-cliente': abrir({ t: 'cliente', id }); break;
      case 'novo-cliente': abrir({ t: 'novoCliente', unidade: id }); break;
      case 'filtro-leads': abrir({ t: 'clientes', filtro: el.dataset.f as any, busca: (tela as any)?.busca ?? '' }); break;
      case 'tour': iniciarTour(id); break;
      case 'focar': app3d.focarUnidade(id); if (ehCelular()) fechar(); break;
      case 'isolar': definirIsolado(Number(el.dataset.n)); break;
      case 'ver-planta': lightbox([{ src: imagem(el.dataset.src!)!, legenda: 'Planta humanizada do pavimento — ' + emp.avisoLegal }]); break;
      case 'galeria': { const t = tipologia(emp, unidadeTecnica(emp, id)!.tipologia); const l = t.imagens.filter((n) => imagem(n)).map((n) => ({ src: imagem(n)!, legenda: emp.avisoLegal })); lightbox(l, Number(el.dataset.i)); break; }
      case 'galeria-geral': lightbox(emp.imagensGerais.filter((i) => imagem(i.arquivo)).map((i) => ({ src: imagem(i.arquivo)!, legenda: i.titulo })), Number(el.dataset.i)); break;
      case 'modo': gerente() ? (est.sairGerente(), toast('Modo cliente ativado: só visualização.')) : pedirPin(); break;
      case 'tela-cheia': telaCheia(); break;
      case 'drone': droneOn = !droneOn; app3d.drone(droneOn); marcarDock(); break;
      case 'noite': { const noite = horario.hora >= 18.5 || horario.hora < 5.8; definirHora(noite ? 10.5 : 20); break; }
      case 'realce': realceOn = !realceOn; app3d.realce(realceOn); atualizarRotulos(); marcarDock(); break;
      case 'pavimentos': alternarPop('pop-pav', montarPopPav); break;
      case 'sol': alternarPop('pop-sol', montarPopSol); break;
      case 'exportar': exportar(); break;
      case 'importar': $<HTMLInputElement>('#arquivo-json').click(); break;
      case 'trocar-pin': pedirNovoPin(); break;
      case 'segunda-tela': window.open(location.href.split('#')[0] + '#cliente', `${emp.id}-tv`, 'popup'); break;
      case 'recomecar': est.recomecar(true); toast('Dados apagados. Cadastre preços e clientes reais.', 'ok'); break;
      case 'exemplo': est.restaurarExemplo(); toast('Dados de exemplo carregados.'); break;
      case 'excluir-cliente': { const r = est.aplicar((d) => excluirLead(d, id)); if (r.ok) { toast('Cliente excluído.'); abrir({ t: 'clientes' }); } else toast(r.erro, 'erro'); break; }
      case 'liberar-vencidas': for (const u of reservasVencidas(est.dados)) atualizarUnidade(est.dados, u.id, { status: 'disponivel', leadId: null }); est.salvar(); toast('Reservas vencidas liberadas.', 'ok'); break;
      case 'rel': await gerarRelatorio(el.dataset.f as any, el); break;
      case 'iniciar': sairAbertura(); break;
      case 'iniciar-gerente': sairAbertura(); pedirPin(); break;
    }
  }

  document.addEventListener('click', (e) => {
    const el = (e.target as HTMLElement).closest('[data-act],[data-go],[data-vista]') as HTMLElement | null;
    if (!el || el.closest('.tour')) return;
    if (el.dataset.go) { const g = el.dataset.go as Tela['t']; if (tela?.t === g && painel.classList.contains('aberto')) fechar(); else abrir({ t: g } as Tela); return; }
    if (el.dataset.vista) { droneOn = false; app3d.vista(el.dataset.vista as Vista); marcarDock(); return; }
    if (el.tagName === 'IMG' && el.dataset.act !== 'ver-planta') return;
    void acao(el.dataset.act!, el);
  });

  corpo.addEventListener('input', (e) => {
    const el = e.target as HTMLInputElement;
    if (el.dataset.campo === 'busca-leads') {
      const pos = el.selectionStart;
      (tela as any).busca = el.value;
      renderizar();
      const n = corpo.querySelector('[data-campo="busca-leads"]') as HTMLInputElement;
      n.focus(); n.setSelectionRange(pos, pos);
    }
  });

  corpo.addEventListener('submit', (e) => {
    e.preventDefault();
    const f = e.target as HTMLFormElement;
    const fd = new FormData(f);
    const erro = f.querySelector('.erro-form') as HTMLElement;
    const id = f.dataset.id!;
    let r: { ok: boolean; erro?: string } = { ok: true };
    switch (f.dataset.form) {
      case 'unidade': {
        const status = fd.get('status') as StatusUnidade;
        const leadId = (fd.get('leadId') as string) || null;
        r = est.aplicar((d) => atualizarUnidade(d, id, {
          status, preco: numero(fd.get('preco')), condicoes: String(fd.get('condicoes') ?? ''), vagas: numero(fd.get('vagas')),
          corretor: String(fd.get('corretor') ?? ''), leadId, vendaData: (fd.get('vendaData') as string) || null, vendaValor: numero(fd.get('vendaValor')), obs: String(fd.get('obs') ?? ''),
        }));
        if (r.ok) toast(`Unidade ${id} salva.`, 'ok');
        break;
      }
      case 'novo-cliente': {
        const res = est.aplicar((d) => criarLead(d, { nome: String(fd.get('nome')), telefone: String(fd.get('telefone') ?? ''), email: String(fd.get('email') ?? ''), origem: String(fd.get('origem') ?? ''), corretor: String(fd.get('corretor') ?? ''), unidadesInteresse: String(fd.get('interesse') ?? '').split(/[,;\s]+/).filter(Boolean), obs: String(fd.get('obs') ?? '') }));
        r = res;
        if (res.ok) { toast('Cliente cadastrado.', 'ok'); sujo = false; abrir({ t: 'cliente', id: res.valor!.id }); return; }
        break;
      }
      case 'mover': {
        r = est.aplicar((d) => moverLead(d, id, fd.get('etapa') as EtapaLead, { unidadeId: (fd.get('unidadeId') as string) || null, valor: numero(fd.get('valor')), motivo: String(fd.get('motivo') ?? '') }));
        if (r.ok) toast('Etapa atualizada.', 'ok');
        break;
      }
      case 'interacao': {
        r = est.aplicar((d) => registrarInteracao(d, id, fd.get('tipo') as any, String(fd.get('texto') ?? ''), hojeISO(), (fd.get('proxima') as string) || null));
        if (r.ok) toast('Contato registrado.', 'ok');
        break;
      }
      case 'editar-cliente': {
        const inter = String(fd.get('interesse') ?? '').split(/[,;\s]+/).filter(Boolean);
        const inval = inter.find((u) => !est.dados.unidades[u]);
        r = inval ? { ok: false, erro: `Unidade ${inval} não existe.` } : est.aplicar((d) => editarLead(d, id, { nome: String(fd.get('nome')), telefone: String(fd.get('telefone') ?? ''), email: String(fd.get('email') ?? ''), origem: String(fd.get('origem') ?? ''), corretor: String(fd.get('corretor') ?? ''), unidadesInteresse: inter, obs: String(fd.get('obs') ?? '') }));
        if (r.ok) toast('Dados salvos.', 'ok');
        break;
      }
      case 'config': {
        const c = est.dados.config;
        c.mostrarPrecoCliente = fd.get('mostrarPreco') === 'on';
        c.prazoReservaDias = Math.max(1, Math.min(60, Number(fd.get('prazo')) || 7));
        c.diasAvisoBackup = Math.max(1, Math.min(60, Number(fd.get('aviso')) || 7));
        c.corretores = String(fd.get('corretores') ?? '').split('\n').map((s) => s.trim()).filter(Boolean);
        est.salvar('config');
        toast('Configurações salvas.', 'ok');
        break;
      }
    }
    if (!r.ok) { erro.textContent = r.erro ?? 'Não foi possível salvar.'; return; }
    sujo = false;
    renderizar();
  });

  // ---------- PIN ----------
  function pedirPin() {
    if (est.semPin) return pedirNovoPin(true);
    modal(`<h2>Entrar como gerente</h2><p>Digite o PIN.</p><form class="form" id="f-pin"><input class="pin" type="password" inputmode="numeric" autocomplete="off" maxlength="8" aria-label="PIN"><div class="erro-form" role="alert"></div><div class="botoes"><button type="button" class="btn" data-fechar>Cancelar</button><button class="btn btn-primario">Entrar</button></div></form><p class="nota">Esqueceu o PIN? Importe um backup feito antes da troca, ou use "Começar do zero" pelo modo gerente em outro acesso. (O PIN é só uma trava de tela.)</p>`, (m, fecharM) => {
      m.querySelector('[data-fechar]')!.addEventListener('click', fecharM);
      m.querySelector('form')!.addEventListener('submit', (e) => {
        e.preventDefault();
        const v = (m.querySelector('input') as HTMLInputElement).value;
        if (est.entrarGerente(v)) { fecharM(); toast('Modo gerente: controle total.', 'ok'); }
        else m.querySelector('.erro-form')!.textContent = 'PIN incorreto.';
      });
    });
  }
  function pedirNovoPin(primeiro = false) {
    modal(`<h2>${primeiro ? 'Criar PIN do gerente' : 'Trocar PIN'}</h2><p>${primeiro ? 'Primeiro acesso: crie um PIN de 4 a 8 números. Ele protege as telas de gestão (clientes, preços, relatórios).' : 'Novo PIN (4 a 8 números).'}</p><form class="form"><input class="pin" type="password" inputmode="numeric" maxlength="8" aria-label="Novo PIN"><input class="pin" type="password" inputmode="numeric" maxlength="8" aria-label="Repita o PIN" placeholder="repita"><div class="erro-form" role="alert"></div><div class="botoes"><button type="button" class="btn" data-fechar>Cancelar</button><button class="btn btn-primario">Salvar PIN</button></div></form>`, (m, fecharM) => {
      m.querySelector('[data-fechar]')!.addEventListener('click', fecharM);
      m.querySelector('form')!.addEventListener('submit', (e) => {
        e.preventDefault();
        const [a, b] = [...m.querySelectorAll('input')].map((i) => (i as HTMLInputElement).value);
        if (a !== b) { m.querySelector('.erro-form')!.textContent = 'Os dois PINs não são iguais.'; return; }
        const r = definirPin(est.dados, a);
        if (!r.ok) { m.querySelector('.erro-form')!.textContent = r.erro; return; }
        est.salvar('pin');
        fecharM();
        if (primeiro) est.entrarGerente(a);
        toast(primeiro ? 'PIN criado. Modo gerente ativado.' : 'PIN alterado.', 'ok');
      });
    });
  }

  // ---------- backup ----------
  function exportar() {
    est.marcarBackup();
    const blob = new Blob([exportarJSON(est.dados)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = nomeArquivoBackup(emp);
    document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
    toast('Backup exportado. Guarde o arquivo em local seguro.', 'ok');
  }
  $<HTMLInputElement>('#arquivo-json').addEventListener('change', async (e) => {
    const inp = e.target as HTMLInputElement;
    const arq = inp.files?.[0];
    inp.value = '';
    if (!arq) return;
    const r = est.importar(await arq.text());
    if (r.ok) toast(`Backup "${arq.name}" importado.`, 'ok');
    else modal(`<h2>Arquivo recusado</h2><p>${esc(r.erro)}</p><p class="nota">Nada foi alterado nos dados atuais.</p><div class="botoes"><button class="btn btn-primario" data-fechar>Entendi</button></div>`, (m, f) => m.querySelector('[data-fechar]')!.addEventListener('click', f));
  });

  // ---------- relatórios ----------
  async function gerarRelatorio(f: 'pdf' | 'docx' | 'xlsx', btn: HTMLElement) {
    const orig = btn.innerHTML;
    btn.innerHTML = 'Gerando…'; btn.setAttribute('disabled', '');
    try {
      const { gerarPDF, gerarDOCX, gerarXLSX, baixar } = await import('../relatorios/exportar.ts');
      const r = montarRelatorio(emp, est.dados);
      const img = f !== 'xlsx' ? app3d.capturar() : null;
      const base = `relatorio-vendas-${emp.id}-${hojeISO()}`;
      if (f === 'pdf') baixar(await gerarPDF(r, emp.identidade.corPrimaria, logoPng, img), base + '.pdf');
      if (f === 'docx') baixar(await gerarDOCX(r, emp.identidade.corPrimaria, img), base + '.docx');
      if (f === 'xlsx') baixar(await gerarXLSX(r, emp.identidade.corPrimaria), base + '.xlsx');
      toast('Relatório gerado.', 'ok');
    } catch (err) {
      console.error(err);
      toast('Não foi possível gerar o relatório.', 'erro');
    } finally { btn.innerHTML = orig; btn.removeAttribute('disabled'); }
  }
  let logoPng: string | null = null;
  if (logo) { const im = new Image(); im.onload = () => { const c = document.createElement('canvas'); c.width = im.width; c.height = im.height; c.getContext('2d')!.drawImage(im, 0, 0); try { logoPng = c.toDataURL('image/png'); } catch { /* */ } }; im.src = logo; }

  // ---------- sol, pavimentos, dock ----------
  const range = $<HTMLInputElement>('.relogio input');
  const saida = $<HTMLOutputElement>('.relogio output');
  range.value = String(horario.hora);
  range.addEventListener('input', () => definirHora(Number(range.value)));
  function definirHora(h: number, data = horario.data) {
    horario.hora = h; horario.data = data;
    range.value = String(h); saida.textContent = horaTxt(h);
    const r = app3d.definirHorario(data, h);
    $('[data-act="noite"]').setAttribute('aria-pressed', String(r.noite > 0.5));
    if (!$('#pop-sol').hidden) atualizarInfoSol();
  }
  function atualizarInfoSol() {
    const p = posicaoSol(instanteLocal(horario.data, horario.hora, emp.geo.fusoHoras), emp.geo.lat, emp.geo.lon);
    const info = $('#pop-sol .info-sol');
    if (info) info.textContent = `${dataBR(horario.data)} às ${horaTxt(horario.hora)} — ${p.elevacao > 0 ? `sol a ${num(p.elevacao, 0)}° de altura, vindo do ${pontoCardeal(p.azimute)} (${num(p.azimute, 0)}°)` : 'sol abaixo do horizonte'}.`;
  }
  let trilhaOn = false, lapseOn = false;
  function montarPopSol(el: HTMLElement) {
    const ano = horario.data.slice(0, 4);
    el.innerHTML = `<h3>☀ Projeção solar</h3>
      <div class="linha"><button class="btn btn-pequeno" data-d="${hojeISO()}">Hoje</button><button class="btn btn-pequeno" data-d="${ano}-12-21">Verão (21/12)</button><button class="btn btn-pequeno" data-d="${ano}-06-21">Inverno (21/06)</button><button class="btn btn-pequeno" data-d="${ano}-03-20">Equinócio</button><input type="date" value="${horario.data}" aria-label="Data" class="btn btn-pequeno"></div>
      <div class="linha"><button class="btn btn-pequeno" data-h="7">Manhã</button><button class="btn btn-pequeno" data-h="12">Meio-dia</button><button class="btn btn-pequeno" data-h="17.5">Pôr do sol</button><button class="btn btn-pequeno" data-h="20">Noite</button><button class="btn btn-pequeno" data-h="agora">Agora</button></div>
      <div class="linha"><button class="btn btn-pequeno" data-x="trilha" aria-pressed="${trilhaOn}">Trajetória do sol</button><button class="btn btn-pequeno" data-x="lapse" aria-pressed="${lapseOn}">▶ Animação do dia</button></div>
      <p class="info-sol"></p>`;
    atualizarInfoSol();
    el.onclick = (e) => {
      const b = (e.target as HTMLElement).closest('button') as HTMLElement | null;
      if (!b) return;
      if (b.dataset.d) { definirHora(horario.hora, b.dataset.d); if (trilhaOn) app3d.trilhaSolar(true, horario.data); (el.querySelector('input[type=date]') as HTMLInputElement).value = horario.data; }
      if (b.dataset.h) { if (b.dataset.h === 'agora') { const n = new Date(); definirHora(Math.max(5, Math.min(21, n.getHours() + n.getMinutes() / 60)), hojeISO()); } else definirHora(Number(b.dataset.h)); }
      if (b.dataset.x === 'trilha') { trilhaOn = !trilhaOn; app3d.trilhaSolar(trilhaOn, horario.data); b.setAttribute('aria-pressed', String(trilhaOn)); if (trilhaOn) app3d.vista('bairro'); }
      if (b.dataset.x === 'lapse') { lapseOn = !lapseOn; app3d.timelapse(lapseOn); b.setAttribute('aria-pressed', String(lapseOn)); }
    };
    (el.querySelector('input[type=date]') as HTMLInputElement).onchange = (e) => { const v = (e.target as HTMLInputElement).value; if (v) { definirHora(horario.hora, v); if (trilhaOn) app3d.trilhaSolar(true, v); } };
  }
  function montarPopPav(el: HTMLElement) {
    const pavs = emp.pavimentos.slice().sort((a, b) => b.numero - a.numero);
    el.innerHTML = `<h3>☰ Ver pavimento (corte)</h3><div class="linha"><button class="btn btn-pequeno" data-n="" aria-pressed="${isolado == null}">Prédio inteiro</button>${pavs.filter((p) => p.tipo !== 'embasamento').map((p) => `<button class="btn btn-pequeno" data-n="${p.numero}" aria-pressed="${isolado === p.numero}">${p.numero}º</button>`).join('')}</div><p class="info-sol">Esconde os andares de cima para mostrar as unidades do pavimento escolhido.</p>`;
    el.onclick = (e) => { const b = (e.target as HTMLElement).closest('button') as HTMLElement | null; if (!b) return; definirIsolado(b.dataset.n ? Number(b.dataset.n) : null); montarPopPav(el); };
  }
  function definirIsolado(n: number | null) {
    isolado = n;
    if (n != null) { droneOn = false; marcarDock(); }
    app3d.isolarPavimento(n);
    atualizarRotulos();
    if (n != null) toast(`${pavimentoRotulo(emp, n)} — toque numa unidade.`);
  }
  function alternarPop(id: string, montar: (el: HTMLElement) => void) {
    const el = $('#' + id);
    const abrirP = el.hidden;
    document.querySelectorAll<HTMLElement>('.pop').forEach((p) => (p.hidden = true));
    if (abrirP) { montar(el); el.hidden = false; }
  }
  document.addEventListener('pointerdown', (e) => {
    const t = e.target as HTMLElement;
    if (!t.closest('.pop') && !t.closest('[data-act="sol"],[data-act="pavimentos"]')) document.querySelectorAll<HTMLElement>('.pop').forEach((p) => (p.hidden = true));
  });
  function marcarDock() {
    $('[data-act="drone"]').setAttribute('aria-pressed', String(droneOn));
    $('[data-act="realce"]').setAttribute('aria-pressed', String(realceOn));
  }
  function telaCheia() {
    if (document.fullscreenElement) document.exitFullscreen();
    else document.documentElement.requestFullscreen?.().catch(() => toast('Tela cheia não permitida neste navegador.'));
  }

  function selecionarUnidade(id: string | null, voar = false) {
    unidadeSel = id;
    app3d.selecionar(id);
    if (!id) { if (tela?.t === 'unidade') fechar(); return; }
    abrir({ t: 'unidade', id });
    if (voar) app3d.focarUnidade(id);
  }

  function iniciarTour(id: string) {
    const t = app3d.iniciarTour(id);
    void t;
    fechar();
    document.body.classList.add('em-tour');
    $('.dock').hidden = true; $('.topo').hidden = true; $('.legenda').hidden = true; $('.bussola').hidden = true;
  }

  // ---------- reação a mudanças ----------
  function atualizarTopo() {
    document.body.classList.toggle('modo-gerente', gerente());
    $('.chip-modo').textContent = gerente() ? 'Gerente' : 'Cliente';
    $('[data-act="modo"]').firstChild!.textContent = gerente() ? '🔓' : '🔒';
    const a = alertas(est.dados).filter((x) => x.nivel !== 'info');
    const cont = $('.sino .contador');
    cont.hidden = !a.length; cont.textContent = String(a.length);
    $('.faixa-exemplo').hidden = !est.dados.exemplo;
  }
  est.ouvir((motivo) => {
    atualizarTopo();
    atualizar3D();
    if (motivo === 'modo' && !gerente() && tela && ['clientes', 'cliente', 'novoCliente', 'relatorios', 'dados', 'alertas'].includes(tela.t)) { fechar(); return; }
    if (tela && !(sujo && motivo === 'externo')) renderizar();
    if (!est.salvouOk) toast('Não foi possível salvar no navegador. Exporte um backup!', 'erro');
  });

  window.addEventListener('keydown', (e) => {
    if ((e.target as HTMLElement).closest('input,textarea,select') || app3d?.tourAtivo()) return;
    const k = e.key.toLowerCase();
    if (k === 'f') telaCheia();
    else if (k === 'd') { droneOn = !droneOn; app3d.drone(droneOn); marcarDock(); }
    else if (k === 'n') void acao('noite', document.body);
    else if (k === 'e') abrir({ t: 'espelho' });
    else if (k === 'escape') fechar();
  });

  // modo apresentação: sem interação por 2 min no modo cliente → voo de drone automático
  let ultimaInteracao = Date.now();
  ['pointerdown', 'keydown', 'wheel'].forEach((ev) => window.addEventListener(ev, () => (ultimaInteracao = Date.now()), { passive: true }));
  setInterval(() => {
    if (!app3d || gerente() || droneOn || app3d.tourAtivo() || !iniciado) return;
    if (Date.now() - ultimaInteracao > 120000) { droneOn = true; app3d.drone(true); marcarDock(); }
  }, 5000);

  // ---------- abertura e montagem do 3D ----------
  const barra = $('.barra-carga i');
  let iniciado = false;
  function sairAbertura() {
    iniciado = true;
    const a = $('#abertura');
    if (!a) return;
    a.classList.add('saindo');
    setTimeout(() => a.remove(), 700);
    app3d.vista('geral');
  }
  requestAnimationFrame(() => {
    barra.style.width = '35%';
    setTimeout(() => {
      try {
        app3d = criarApp3D({
          emp, container: $('#cena'), qualidade: ehCelular() ? 'media' : 'alta',
          aoSelecionar: (id) => { if (id) selecionarUnidade(id); else if (tela?.t === 'unidade') fechar(); },
          aoPassar: () => {},
          aoMudarHora: (h) => { horario.hora = h; range.value = String(h); saida.textContent = horaTxt(h); },
          aoFimTour: () => { document.body.classList.remove('em-tour'); $('.dock').hidden = false; $('.topo').hidden = false; $('.legenda').hidden = false; $('.bussola').hidden = false; },
          aoMudarVista: (v) => { if (v !== 'drone') { droneOn = false; marcarDock(); } },
        });
        definirHora(horario.hora);
        atualizar3D();
        atualizarTopo();
        barra.style.width = '100%';
        $('.carregando span').textContent = 'Pronto.';
        document.querySelectorAll('#abertura [disabled]').forEach((b) => b.removeAttribute('disabled'));
        ($('[data-act="iniciar"]') as HTMLButtonElement).focus();
        const agulha = $('.bussola .agulha');
        setInterval(() => { agulha.style.transform = `rotate(${-app3d.rumoCamera()}deg)`; }, 120);
        if (location.hash === '#cliente') { est.sairGerente(); sairAbertura(); }
      } catch (err) {
        console.error(err);
        $('.carregando span').textContent = 'Não foi possível iniciar o 3D. Use o Google Chrome atualizado e verifique se a aceleração de hardware está ligada.';
      }
    }, 30);
  });
  (window as any).__ui = { est, abrir, fechar, selecionarUnidade, definirHora, definirIsolado, iniciarTour, get app3d() { return app3d; } };
}
