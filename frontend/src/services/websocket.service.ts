import { Injectable, OnDestroy } from '@angular/core';
import { Observable, Subject, BehaviorSubject } from 'rxjs';
import { environment } from '../environments/environment';

export interface Notificacao {
  id?: number;
  tipo: 'nova_aula' | 'aula_alterada' | 'aula_cancelada' | 'conflito_detectado' | 
        'evento_criado' | 'evento_proximo' | 'reposicao_agendada' | 'reposicao_pendente' | 
        'sistema' | 'outro';
  titulo: string;
  mensagem: string;
  lida: boolean;
  createdAt?: string;
  dados?: any;
}

export interface WebSocketMessage {
  tipo: string;
  mensagem: string;
  data?: any;
}

@Injectable({
  providedIn: 'root'
})
export class WebSocketService implements OnDestroy {
  private socket: WebSocket | null = null;
  private reconnectInterval: any = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000; // 3 segundos

  // Subject para notificações recebidas
  private notificacoesSubject = new Subject<Notificacao>();
  public notificacoes$ = this.notificacoesSubject.asObservable();

  // Subject para status da conexão
  private connectionStatusSubject = new BehaviorSubject<'connected' | 'connecting' | 'disconnected' | 'error'>('disconnected');
  public connectionStatus$ = this.connectionStatusSubject.asObservable();

  // Buffer de notificações não lidas
  private notificacoesNaoLidas: Notificacao[] = [];
  private notificacoesNaoLidasSubject = new BehaviorSubject<number>(0);
  public notificacoesNaoLidas$ = this.notificacoesNaoLidasSubject.asObservable();

  constructor() {}

  /**
   * Conecta ao servidor WebSocket
   */
  connect(userId: number): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      console.log('WebSocket já está conectado');
      return;
    }

    this.connectionStatusSubject.next('connecting');
    
    const wsUrl = `${environment.wsUrl}?user=${userId}`;
    
    try {
      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = () => {
        console.log('WebSocket conectado com sucesso');
        this.connectionStatusSubject.next('connected');
        this.reconnectAttempts = 0;
        
        // Limpar intervalo de reconexão se existir
        if (this.reconnectInterval) {
          clearInterval(this.reconnectInterval);
          this.reconnectInterval = null;
        }
      };

      this.socket.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (error) {
          console.error('Erro ao processar mensagem WebSocket:', error);
        }
      };

      this.socket.onerror = (error) => {
        console.error('Erro no WebSocket:', error);
        this.connectionStatusSubject.next('error');
      };

      this.socket.onclose = () => {
        console.log('WebSocket desconectado');
        this.connectionStatusSubject.next('disconnected');
        this.attemptReconnect(userId);
      };

    } catch (error) {
      console.error('Erro ao criar conexão WebSocket:', error);
      this.connectionStatusSubject.next('error');
      this.attemptReconnect(userId);
    }
  }

  /**
   * Tenta reconectar automaticamente
   */
  private attemptReconnect(userId: number): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Número máximo de tentativas de reconexão atingido');
      this.connectionStatusSubject.next('error');
      return;
    }

    this.reconnectAttempts++;
    console.log(`Tentando reconectar (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);

    this.reconnectInterval = setTimeout(() => {
      this.connect(userId);
    }, this.reconnectDelay);
  }

  /**
   * Desconecta do servidor WebSocket
   */
  disconnect(): void {
    if (this.reconnectInterval) {
      clearInterval(this.reconnectInterval);
      this.reconnectInterval = null;
    }

    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }

    this.connectionStatusSubject.next('disconnected');
  }

  /**
   * Envia mensagem via WebSocket
   */
  send(message: any): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket não está conectado. Mensagem não enviada.');
    }
  }

  /**
   * Processa mensagem recebida
   */
  private handleMessage(message: WebSocketMessage): void {
    const notificacao: Notificacao = {
      tipo: message.tipo as any,
      titulo: this.getTituloNotificacao(message.tipo),
      mensagem: message.mensagem,
      lida: false,
      createdAt: new Date().toISOString(),
      dados: message.data
    };

    // Adicionar à lista de não lidas
    this.notificacoesNaoLidas.push(notificacao);
    this.notificacoesNaoLidasSubject.next(this.notificacoesNaoLidas.length);

    // Emitir notificação
    this.notificacoesSubject.next(notificacao);

    // Exibir notificação do sistema (se suportado)
    this.mostrarNotificacaoSistema(notificacao);
  }

  /**
   * Retorna título baseado no tipo
   */
  private getTituloNotificacao(tipo: string): string {
    const titulos: { [key: string]: string } = {
      'nova_aula': 'Nova Aula',
      'aula_alterada': 'Aula Alterada',
      'aula_cancelada': 'Aula Cancelada',
      'conflito_detectado': 'Conflito Detectado',
      'evento_criado': 'Novo Evento',
      'evento_proximo': 'Evento Próximo',
      'reposicao_agendada': 'Reposição Agendada',
      'reposicao_pendente': 'Reposição Pendente',
      'sistema': 'Notificação do Sistema',
      'outro': 'Notificação'
    };
    return titulos[tipo] || 'Notificação';
  }

  /**
   * Mostra notificação do navegador
   */
  private mostrarNotificacaoSistema(notificacao: Notificacao): void {
    if (!('Notification' in window)) {
      return;
    }

    if (Notification.permission === 'granted') {
      new Notification(notificacao.titulo, {
        body: notificacao.mensagem,
        icon: '/assets/images/logo.png',
        badge: '/assets/images/badge.png'
      });
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          new Notification(notificacao.titulo, {
            body: notificacao.mensagem,
            icon: '/assets/images/logo.png'
          });
        }
      });
    }
  }

  /**
   * Marca notificação como lida
   */
  marcarComoLida(index: number): void {
    if (index >= 0 && index < this.notificacoesNaoLidas.length) {
      this.notificacoesNaoLidas.splice(index, 1);
      this.notificacoesNaoLidasSubject.next(this.notificacoesNaoLidas.length);
    }
  }

  /**
   * Marca todas como lidas
   */
  marcarTodasComoLidas(): void {
    this.notificacoesNaoLidas = [];
    this.notificacoesNaoLidasSubject.next(0);
  }

  /**
   * Retorna lista de notificações não lidas
   */
  getNotificacoesNaoLidas(): Notificacao[] {
    return [...this.notificacoesNaoLidas];
  }

  /**
   * Solicita permissão para notificações do navegador
   */
  solicitarPermissaoNotificacoes(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      return Promise.reject('Notificações não suportadas neste navegador');
    }

    return Notification.requestPermission();
  }

  /**
   * Verifica se está conectado
   */
  isConnected(): boolean {
    return this.socket !== null && this.socket.readyState === WebSocket.OPEN;
  }

  /**
   * Cleanup ao destruir serviço
   */
  ngOnDestroy(): void {
    this.disconnect();
  }
}
