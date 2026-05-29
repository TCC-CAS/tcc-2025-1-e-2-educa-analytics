// Arquivo de exemplo para configuração de ambiente
// Copie este arquivo para environment.ts e environment.prod.ts

export const environment = {
  production: false,
  
  // URL da API REST
  apiUrl: 'http://localhost:3000/api',
  
  // URL do WebSocket para notificações em tempo real
  wsUrl: 'ws://localhost:8765',
  
  // Configurações da aplicação
  appName: 'Educa Analytics',
  version: '2.0.0',
  
  // Google reCAPTCHA (para login)
  recaptchaSiteKey: 'YOUR_RECAPTCHA_SITE_KEY_HERE',
  
  // Configurações de paginação
  defaultPageSize: 20,
  pageSizeOptions: [10, 20, 50, 100],
  
  // Configurações de cache (em segundos)
  cacheTimeout: 3600, // 1 hora
  
  // Timeout de requisições HTTP (em milissegundos)
  httpTimeout: 30000, // 30 segundos
  
  // Configurações de notificações
  notificationDuration: 5000, // 5 segundos
  enableSystemNotifications: true,
  
  // Configurações de logs
  enableDebugLogs: true,
  logLevel: 'debug' as 'debug' | 'info' | 'warn' | 'error',
  
  // Feature flags
  features: {
    cronogramaAutomatico: true,
    eventosEscolares: true,
    reposicoesAulas: true,
    notificacoesRealTime: true,
    auditoria: true,
    exportacaoPDF: true,
    exportacaoExcel: true,
    dragAndDrop: true,
    multiTenant: false, // Ainda não implementado
    integracaoGoogleCalendar: false // Ainda não implementado
  }
};

/*
 * Para ambiente de produção, use:
 * ng build --configuration production
 * 
 * O arquivo environment.prod.ts deve ter:
 * - production: true
 * - URLs de produção (AWS)
 * - enableDebugLogs: false
 * - logLevel: 'error'
 */
