// Tipos do sistema. Dados TÉCNICOS vêm de empreendimentos/<id>/empreendimento.json;
// dados COMERCIAIS (status, preço, clientes) ficam no navegador e no backup .json.

export type Ret = [number, number, number, number]; // [x0, x1, z0, z1] em metros, referencial da planta

export interface Ambiente {
  id: string;
  nome: string;
  tipo: 'sala' | 'cozinha' | 'varanda' | 'quarto' | 'suite' | 'banho' | 'lavabo' | 'gourmet' | 'salaTv' | 'terraco';
  ret: Ret;
}

export interface Tipologia {
  nome: string;
  base?: string;
  quartos: number;
  suites: number;
  banheiros: number;
  varanda: string;
  descricao: string;
  imagens: string[];
  ambientes?: Ambiente[];
  ambientesSuperiores?: Ambiente[];
}

export interface UnidadeTecnica {
  id: string;
  nome?: string;
  pavimento: number;
  pavimentosOcupados?: number[];
  tipologia: string;
  areaPrivativa: number;
  areaDescoberta: number;
  vagas: number;
  volumes: Ret[];
  volumesSuperiores?: Ret[];
}

export interface AreaNomeada { nome: string; ret: Ret; unidade?: string }

export interface Pavimento {
  numero: number;
  nome: string;
  tipo?: 'embasamento';
  planta?: string;
  nucleo?: Ret[];
  vazios?: Ret[];
  areasComuns?: AreaNomeada[];
  areasDescobertas?: AreaNomeada[];
}

export interface Empreendimento {
  id: string;
  nome: string;
  subtitulo: string;
  incorporadora: { nome: string; telefone: string; logo: string };
  identidade: { corPrimaria: string; corSecundaria: string; corFundo: string; fonteTitulo: string; fonteAssinatura: string };
  endereco: { logradouro: string; bairro: string; cidade: string; uf: string; cep: string; esquina?: string; mapsUrl?: string };
  geo: { lat: number; lon: number; fusoHoras: number; azimuteTopoPlanta: number };
  memorial?: string;
  diferenciais: string[];
  predio: {
    peDireito: number;
    pavimentos: number;
    torre: { x0: number; x1: number; z0: number; z1: number };
    embasamento: { x0: number; x1: number; z0: number; z1: number; pavimentos: number[] };
    entrada: { lado: string; z0: number; z1: number };
    garagem: { lado: string; x0: number; x1: number };
    materiais: Record<string, string>;
  };
  pavimentos: Pavimento[];
  tipologias: Record<string, Tipologia>;
  unidades: UnidadeTecnica[];
  imagensGerais: { arquivo: string; titulo: string }[];
  avisoLegal: string;
}

export type StatusUnidade = 'disponivel' | 'negociacao' | 'reservado' | 'vendido' | 'bloqueado';

export const STATUS_INFO: Record<StatusUnidade, { rotulo: string; cor: string; corTexto: string; icone: string }> = {
  disponivel: { rotulo: 'Disponível', cor: '#1a7f45', corTexto: '#ffffff', icone: '●' },
  negociacao: { rotulo: 'Em negociação', cor: '#2a5fd6', corTexto: '#ffffff', icone: '▲' },
  reservado: { rotulo: 'Reservado', cor: '#9a5b00', corTexto: '#ffffff', icone: '◆' },
  vendido: { rotulo: 'Vendido', cor: '#b3261e', corTexto: '#ffffff', icone: '■' },
  bloqueado: { rotulo: 'Indisponível', cor: '#5f6368', corTexto: '#ffffff', icone: '✕' },
};

export interface UnidadeComercial {
  id: string;
  status: StatusUnidade;
  preco: number | null;
  condicoes: string;
  vagas: number | null;
  leadId: string | null;
  corretor: string;
  reservaAte: string | null; // ISO YYYY-MM-DD
  vendaData: string | null;
  vendaValor: number | null;
  obs: string;
  atualizadoEm: string;
}

export type EtapaLead = 'novo' | 'contato' | 'visita' | 'proposta' | 'reserva' | 'contrato' | 'vendido' | 'perdido';

export const ETAPAS: { id: EtapaLead; rotulo: string; limiteDias: number }[] = [
  { id: 'novo', rotulo: 'Novo contato', limiteDias: 1 },
  { id: 'contato', rotulo: 'Em contato', limiteDias: 3 },
  { id: 'visita', rotulo: 'Visita / apresentação', limiteDias: 3 },
  { id: 'proposta', rotulo: 'Proposta', limiteDias: 2 },
  { id: 'reserva', rotulo: 'Reserva', limiteDias: 2 },
  { id: 'contrato', rotulo: 'Contrato', limiteDias: 5 },
  { id: 'vendido', rotulo: 'Vendido', limiteDias: 0 },
  { id: 'perdido', rotulo: 'Perdido', limiteDias: 0 },
];

export interface Interacao { data: string; tipo: 'nota' | 'ligacao' | 'whatsapp' | 'visita' | 'email' | 'sistema'; texto: string }

export interface Lead {
  id: string;
  nome: string;
  telefone: string;
  email: string;
  origem: string;
  corretor: string;
  etapa: EtapaLead;
  unidadesInteresse: string[];
  unidadeId: string | null;
  valorProposta: number | null;
  proximaAcao: string | null;
  ultimoContato: string | null;
  motivoPerda: string;
  obs: string;
  historico: Interacao[];
  criadoEm: string;
  atualizadoEm: string;
}

export interface ConfigComercial {
  pinHash: string | null;
  pinSal: string | null;
  mostrarPrecoCliente: boolean;
  prazoReservaDias: number;
  corretores: string[];
  origens: string[];
  ultimoBackup: string | null;
  diasAvisoBackup: number;
}

export interface Dados {
  app: 'incorporadora-3d';
  versao: number;
  empreendimentoId: string;
  exemplo: boolean;
  criadoEm: string;
  atualizadoEm: string;
  unidades: Record<string, UnidadeComercial>;
  leads: Lead[];
  config: ConfigComercial;
}

export type Resultado<T = undefined> = { ok: true; valor?: T } | { ok: false; erro: string };
