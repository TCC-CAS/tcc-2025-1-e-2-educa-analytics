# EducaAnalytics Frontend

Frontend da aplicação EducaAnalytics desenvolvido com Angular, TypeScript e Node.

## Estrutura do Projeto

```
src/
├── app/
│   ├── core/              # Módulo principal com serviços essenciais
│   │   ├── services/      # Serviços: auth, api, notification
│   │   ├── guards/        # Guards de autenticação
│   │   └── interceptors/  # Interceptadores HTTP
│   ├── shared/            # Módulo compartilhado
│   │   ├── components/    # Componentes reutilizáveis
│   │   ├── directives/    # Diretivas customizadas
│   │   └── pipes/         # Pipes customizados
│   ├── features/          # Módulos de funcionalidades
│   │   └── dashboard/     # Dashboard da aplicação
│   ├── models/            # Interfaces e tipos TypeScript
│   ├── app.module.ts      # Módulo raiz
│   ├── app.component.*    # Componente raiz
│   └── app-routing.module.ts # Roteamento principal
├── assets/                # Recursos estáticos
│   ├── images/
│   └── styles/
├── environments/          # Configurações por ambiente
├── index.html
├── main.ts
├── polyfills.ts
└── styles.scss
```

## Instalação

```bash
# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm start

# Build para produção
npm run build:prod

# Testes
npm test

# Lint
npm lint
```

## Configuração

- **TypeScript**: Configurado com strict mode
- **Path aliases**: `@app`, `@core`, `@shared`, `@features`, `@models`, `@environments`
- **Estilos**: SCSS
- **Testing**: Jasmine + Karma
- **Linting**: ESLint com TypeScript

## Componentes Principais

### Serviços
- `AuthService`: Gerenciamento de autenticação
- `ApiService`: Chamadas HTTP genéricas
- `NotificationService`: Sistema de notificações

### Componentes Compartilhados
- `NotificationComponent`: Exibição de notificações
- `LoadingComponent`: Loading spinner
- `ButtonComponent`: Botão customizado

### Pipes
- `SafePipe`: Sanitização de HTML

### Diretivas
- `HighlightDirective`: Destaque visual

## Desenvolvimento

Para adicionar um novo módulo de funcionalidade:

1. Criar pasta em `features/`
2. Criar módulo, componente e routing
3. Importar em `AppRoutingModule`
4. Usar `SharedModule` para componentes comuns

## API

A aplicação se conecta a uma API em `http://localhost:3000/api` (desenvolvimento).

Endpoints esperados:
- `POST /api/auth/login` - Autenticação
- `GET /api/dashboard` - Dados do dashboard
- `GET /api/students` - Lista de estudantes
- `GET /api/courses` - Lista de cursos
- `GET /api/analytics` - Dados analíticos
