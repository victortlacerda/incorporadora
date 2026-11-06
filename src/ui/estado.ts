// Estado da aplicação no navegador: dados comerciais (localStorage), modo de uso, sessão do gerente
// e sincronia entre janelas (ex.: notebook do corretor + TV do plantão).
import type { Dados, Empreendimento, Resultado } from '../core/tipos.ts';
import { completarUnidades, conferirPin } from '../core/regras.ts';
import { migrar, validarImportacao } from '../core/backup.ts';
import { gerarExemplo } from '../core/exemplo.ts';
import { hojeISO } from '../core/util.ts';

export type Modo = 'cliente' | 'gerente';

type Ouvinte = (motivo: string) => void;

export class Estado {
  emp: Empreendimento;
  dados: Dados;
  modo: Modo = 'cliente';
  salvouOk = true;
  private chave: string;
  private ouvintes: Ouvinte[] = [];
  private canal: BroadcastChannel | null = null;

  constructor(emp: Empreendimento) {
    this.emp = emp;
    this.chave = `inc3d.${emp.id}.dados`;
    this.dados = this.carregar();
    if (sessionStorage.getItem(`inc3d.${emp.id}.sessao`) === 'gerente' && this.dados.config.pinHash) this.modo = 'gerente';
    try {
      this.canal = new BroadcastChannel(`inc3d.${emp.id}`);
      this.canal.onmessage = () => this.recarregarDeFora();
    } catch { /* navegador sem BroadcastChannel: o evento storage cobre */ }
    window.addEventListener('storage', (e) => { if (e.key === this.chave) this.recarregarDeFora(); });
  }

  private carregar(): Dados {
    try {
      const txt = localStorage.getItem(this.chave);
      if (txt) {
        const d = migrar(JSON.parse(txt), this.emp);
        completarUnidades(this.emp, d);
        return d;
      }
    } catch { /* dado corrompido: começa com exemplo, sem apagar o que estava lá */ }
    return gerarExemplo(this.emp, hojeISO());
  }

  private recarregarDeFora() {
    try {
      const txt = localStorage.getItem(this.chave);
      if (!txt) return;
      this.dados = migrar(JSON.parse(txt), this.emp);
      this.avisar('externo');
    } catch { /* ignora */ }
  }

  ouvir(f: Ouvinte) { this.ouvintes.push(f); }
  avisar(motivo: string) { for (const f of this.ouvintes) f(motivo); }

  /** Grava no navegador. Devolve false se não conseguiu (cota cheia, janela anônima...). */
  salvar(motivo = 'dados'): boolean {
    try {
      localStorage.setItem(this.chave, JSON.stringify(this.dados));
      this.salvouOk = true;
      this.canal?.postMessage({ t: Date.now() });
    } catch {
      this.salvouOk = false;
    }
    this.avisar(motivo);
    return this.salvouOk;
  }

  /** Executa uma regra de negócio e salva se deu certo. */
  aplicar<T>(f: (d: Dados) => Resultado<T>, motivo = 'dados'): Resultado<T> {
    const r = f(this.dados);
    if (r.ok) this.salvar(motivo);
    return r;
  }

  entrarGerente(pin: string): boolean {
    if (!conferirPin(this.dados, pin)) return false;
    this.modo = 'gerente';
    sessionStorage.setItem(`inc3d.${this.emp.id}.sessao`, 'gerente');
    this.avisar('modo');
    return true;
  }
  sairGerente() {
    this.modo = 'cliente';
    sessionStorage.removeItem(`inc3d.${this.emp.id}.sessao`);
    this.avisar('modo');
  }
  /** Primeiro acesso: ainda não existe PIN. */
  get semPin() { return !this.dados.config.pinHash; }

  importar(texto: string): Resultado {
    const r = validarImportacao(texto, this.emp);
    if (!r.ok) return r;
    const pinAtual = { h: this.dados.config.pinHash, s: this.dados.config.pinSal };
    this.dados = r.valor!;
    if (!this.dados.config.pinHash && pinAtual.h) { this.dados.config.pinHash = pinAtual.h; this.dados.config.pinSal = pinAtual.s; }
    this.salvar('importado');
    return { ok: true };
  }

  marcarBackup() { this.dados.config.ultimoBackup = hojeISO(); this.salvar('backup'); }

  recomecar(manterPin: boolean) {
    const pin = { h: this.dados.config.pinHash, s: this.dados.config.pinSal };
    const cfg = this.dados.config;
    const novo = gerarExemplo(this.emp, hojeISO());
    // "Começar do zero": sem exemplos, mantendo preços? Não: tabela limpa e configurações mantidas.
    for (const u of Object.values(novo.unidades)) { u.preco = null; u.condicoes = ''; u.status = 'disponivel'; u.leadId = null; u.reservaAte = null; u.vendaData = null; u.vendaValor = null; u.obs = ''; u.corretor = ''; }
    novo.leads = [];
    novo.exemplo = false;
    novo.config = { ...cfg, ultimoBackup: null, pinHash: manterPin ? pin.h : null, pinSal: manterPin ? pin.s : null };
    this.dados = novo;
    if (!manterPin) this.sairGerente();
    this.salvar('recomecar');
  }

  restaurarExemplo() {
    const cfg = this.dados.config;
    this.dados = gerarExemplo(this.emp, hojeISO());
    this.dados.config.pinHash = cfg.pinHash; this.dados.config.pinSal = cfg.pinSal;
    this.salvar('exemplo');
  }
}
