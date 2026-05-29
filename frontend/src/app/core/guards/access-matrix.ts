/**
 * MATRIZ DE CONTROLE DE ACESSO POR TIPO DE USUÁRIO
 * 
 * Define quais funcionalidades cada perfil de usuário pode acessar
 */

import { UserType } from '../services/auth.service';

export interface AccessControl {
  module: string;
  allowedRoles: UserType[];
  description: string;
}

export const ACCESS_MATRIX: AccessControl[] = [
  // ==================== ÁREAS COMUNS ====================
  {
    module: 'home',
    allowedRoles: ['educador', 'educando', 'responsavel', 'colaborador', 'gestor', 'administrativo'],
    description: 'Página inicial - todos podem acessar'
  },

  // ==================== EDUCADOR ====================
  {
    module: 'educadores/minhas-turmas',
    allowedRoles: ['educador'],
    description: 'Gerenciamento de turmas (frequência, atividades, notas)'
  },
  {
    module: 'educadores/cronograma',
    allowedRoles: ['educador', 'gestor', 'administrativo'],
    description: 'Visualização do cronograma de aulas'
  },

  // ==================== EDUCANDO ====================
  {
    module: 'educandos',
    allowedRoles: ['educando', 'responsavel', 'gestor', 'administrativo'],
    description: 'Área do educando - notas, frequência, atividades'
  },
  {
    module: 'avaliacoes',
    allowedRoles: ['educando', 'educador', 'responsavel', 'gestor'],
    description: 'Visualização de avaliações e notas'
  },

  // ==================== RESPONSÁVEL ====================
  {
    module: 'responsaveis',
    allowedRoles: ['responsavel', 'gestor', 'administrativo'],
    description: 'Área do responsável - acompanhamento do educando'
  },

  // ==================== ADMINISTRATIVO/GESTOR ====================
  {
    module: 'matricula',
    allowedRoles: ['gestor', 'administrativo'],
    description: 'Gestão de matrículas'
  },
  {
    module: 'turmas',
    allowedRoles: ['gestor', 'administrativo'],
    description: 'Gestão de turmas'
  },
  {
    module: 'salas',
    allowedRoles: ['gestor', 'administrativo'],
    description: 'Gestão de salas'
  },
  {
    module: 'disciplinas',
    allowedRoles: ['gestor', 'administrativo', 'educador'],
    description: 'Gestão de disciplinas'
  },
  {
    module: 'educadores',
    allowedRoles: ['gestor', 'administrativo'],
    description: 'Gestão de educadores'
  },
  {
    module: 'colaboradores',
    allowedRoles: ['gestor', 'administrativo'],
    description: 'Gestão de colaboradores'
  },
  {
    module: 'cronograma',
    allowedRoles: ['gestor', 'administrativo', 'educador'],
    description: 'Gestão de cronogramas'
  },
  {
    module: 'reposicoes',
    allowedRoles: ['gestor', 'administrativo', 'educador'],
    description: 'Gestão de reposições de aula'
  },

  // ==================== FINANCEIRO ====================
  {
    module: 'caixa',
    allowedRoles: ['gestor', 'administrativo', 'colaborador'],
    description: 'Gestão financeira - caixa'
  },
  {
    module: 'fornecedores',
    allowedRoles: ['gestor', 'administrativo', 'colaborador'],
    description: 'Gestão de fornecedores'
  },
  {
    module: 'dashboard-financeiro',
    allowedRoles: ['gestor', 'administrativo'],
    description: 'Dashboard financeiro'
  },

  // ==================== DASHBOARDS ====================
  {
    module: 'dashboard-escolar',
    allowedRoles: ['gestor', 'administrativo', 'educador'],
    description: 'Dashboard escolar'
  },

  // ==================== EVENTOS ====================
  {
    module: 'eventos',
    allowedRoles: ['educador', 'educando', 'responsavel', 'colaborador', 'gestor', 'administrativo'],
    description: 'Eventos escolares - todos podem visualizar'
  }
];

/**
 * Verifica se um usuário tem permissão para acessar um módulo
 */
export function hasAccess(userType: UserType, module: string): boolean {
  const access = ACCESS_MATRIX.find(a => a.module === module);
  if (!access) {
    return false; // Módulo não encontrado, nega acesso
  }
  return access.allowedRoles.includes(userType);
}

/**
 * Retorna todos os módulos acessíveis por um tipo de usuário
 */
export function getAccessibleModules(userType: UserType): string[] {
  return ACCESS_MATRIX
    .filter(a => a.allowedRoles.includes(userType))
    .map(a => a.module);
}

/**
 * Retorna descrição de um módulo
 */
export function getModuleDescription(module: string): string {
  const access = ACCESS_MATRIX.find(a => a.module === module);
  return access?.description || 'Módulo sem descrição';
}
