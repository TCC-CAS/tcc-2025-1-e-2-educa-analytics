[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-22041afd0340ce965d47ae6ef1cefeee28c7c493a6346c4f15d667ab976d596c.svg)](https://classroom.github.com/a/M8vuB3Dm)
[![Open in Visual Studio Code](https://classroom.github.com/assets/open-in-vscode-2e0aaae1b6195c2367325f4f02e2d04e9abb55f0b24a779b69b11b9e10269abc.svg)](https://classroom.github.com/online_ide?assignment_repo_id=20139270&assignment_repo_type=AssignmentRepo)

<h1 align="center">
  <br>
  EducaAnalytics
  <br>
</h1>

<p align="center">
  Sistema web de gestão escolar desenvolvido como Trabalho de Conclusão de Curso (TCC 2025).
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Angular-17-DD0031?style=for-the-badge&logo=angular&logoColor=white"/>
  <img src="https://img.shields.io/badge/Python-3.12-3776AB?style=for-the-badge&logo=python&logoColor=white"/>
  <img src="https://img.shields.io/badge/MySQL-8.0-4479A1?style=for-the-badge&logo=mysql&logoColor=white"/>
  <img src="https://img.shields.io/badge/AWS_Lambda-FF9900?style=for-the-badge&logo=awslambda&logoColor=white"/>
  <img src="https://img.shields.io/badge/GitHub_Actions-2088FF?style=for-the-badge&logo=githubactions&logoColor=white"/>
  <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge"/>
</p>

---

## Sobre o projeto

O **EducaAnalytics** é uma plataforma completa de gestão escolar que centraliza o controle acadêmico e financeiro de uma instituição de ensino. O sistema atende seis perfis de usuário distintos — gestor, administrativo, colaborador, educador, educando e responsável — cada um com dashboards e funcionalidades adaptadas ao seu papel.

**Acesso em produção:** https://d1y1j6pap0p13l.cloudfront.net

### Principais funcionalidades

| Área | Funcionalidades |
|---|---|
| **Acadêmico** | Turmas, disciplinas, matriz curricular, cronograma de aulas, frequência, notas, avaliações |
| **Matrículas** | Cadastro de educandos, responsáveis, vincular turmas |
| **Financeiro** | Mensalidades, caixa, contas a pagar, contratos, fornecedores |
| **Gestão** | Educadores, colaboradores, salas, eventos |
| **Segurança** | Login com email/senha, Google OAuth 2.0, recuperação de senha por e-mail, reCAPTCHA |

---

## Tecnologias

| Camada | Tecnologia |
|---|---|
| Frontend | Angular 17, TypeScript, SCSS |
| Backend | Python 3.12 (AWS Lambda serverless) |
| Banco de dados | MySQL 8 (AWS RDS) |
| ORM / driver | PyMySQL, argon2-cffi (hash de senhas) |
| Hospedagem frontend | AWS S3 + CloudFront |
| API | AWS API Gateway (HTTP API v2) |
| CI/CD | GitHub Actions |
| Autenticação | JWT HMAC HS256 + Google OAuth 2.0 |

---

## Pré-requisitos

Antes de rodar o projeto localmente, você precisa ter instalado:

- [Node.js 18+](https://nodejs.org/) e npm
- [Angular CLI 17](https://angular.io/cli): `npm install -g @angular/cli`
- [Python 3.12+](https://www.python.org/)
- Acesso a um banco de dados MySQL (local ou remoto)
- (Opcional) Credenciais AWS para deploy

---

## Instalação e execução local

### 1. Clone o repositório

```bash
git clone https://github.com/seu-usuario/tcc-2025-1-e-2-educa-analytics.git
cd tcc-2025-1-e-2-educa-analytics
```

### 2. Backend (Python)

```bash
cd backend

# Criar e ativar o ambiente virtual
python -m venv .venv
.venv\Scripts\activate        # Windows
# source .venv/bin/activate   # Linux / macOS

# Instalar dependências
pip install -r requirements.txt

# Configurar variáveis de ambiente
# Crie um arquivo .env na pasta backend com o conteúdo abaixo:
```

Arquivo `backend/.env`:
```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=educa_analytics
DB_USER=root
DB_PASSWORD=sua_senha

JWT_SECRET=sua-chave-secreta-forte

APP_URL=http://localhost:4200

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu@email.com
SMTP_PASSWORD=sua_senha_smtp

RECAPTCHA_SECRET_KEY=6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe
RECAPTCHA_ENABLED=false

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

ENV=development
```

```bash
# Executar o servidor local
python lambda_function.py
```

A API ficará disponível em `http://localhost:8000`.

### 3. Frontend (Angular)

```bash
cd frontend

# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
ng serve
```

Acesse em `http://localhost:4200`.

> **Nota:** Por padrão, o frontend aponta para a API de produção (`environment.ts`). Para usar a API local, ajuste `environment.development.ts` com `apiUrl: 'http://localhost:8000/api'`.

---

## Deploy

O deploy é totalmente automatizado via **GitHub Actions** ao fazer push na branch `main`:

| Workflow | Arquivo | O que faz |
|---|---|---|
| Deploy Backend | `.github/workflows/deploy-lambda.yml` | Empacota o Python, publica na AWS Lambda |
| Deploy Frontend | `.github/workflows/deploy-frontend.yml` | Build Angular → S3 → invalida cache CloudFront |

### Variáveis de ambiente — AWS Lambda

Configure em **Lambda › Configuration › Environment variables**:

| Variável | Descrição |
|---|---|
| `DB_HOST` | Host do RDS MySQL |
| `DB_NAME` | Nome do banco de dados |
| `DB_USER` | Usuário do banco |
| `DB_PASSWORD` | Senha do banco |
| `JWT_SECRET` | Chave para assinar tokens JWT |
| `APP_URL` | URL do frontend (CloudFront) |
| `SMTP_HOST` | Servidor SMTP para envio de e-mails |
| `SMTP_USER` | Usuário SMTP |
| `SMTP_PASSWORD` | Senha SMTP |
| `GOOGLE_CLIENT_ID` | Client ID do Google OAuth 2.0 |
| `GOOGLE_CLIENT_SECRET` | Client Secret do Google OAuth 2.0 |
| `RECAPTCHA_SECRET_KEY` | Chave secreta do reCAPTCHA v2 |

---

## Exemplos de uso

### Perfis de acesso

Ao fazer login, o sistema detecta o perfil automaticamente pelo prefixo da matrícula e redireciona para o dashboard correspondente:

| Perfil | Prefixo | Exemplo de matrícula | Acesso principal |
|---|---|---|---|
| **Gestor** | `GES` | `GES20260001` | Acesso completo a todas as áreas |
| **Administrativo** | `ADM` | `ADM20260001` | Matrículas, finanças, educadores, turmas |
| **Colaborador** | `COL` | `COL20260001` | Caixa, fornecedores, contratos |
| **Educador** | `EDU` | `EDU001` | Cronograma, turmas, notas, frequência |
| **Educando** | `EDN` | `EDN001` | Notas, frequência, avaliações, eventos |
| **Responsável** | `RES` | `RES001` | Acompanhamento do educando vinculado |

### Login

1. Acesse https://d1y1j6pap0p13l.cloudfront.net
2. Informe **e-mail** e **senha**, ou clique em **Entrar com Google**
3. O sistema redireciona automaticamente para o dashboard do seu perfil

### Recuperação de senha

1. Na tela de login, clique em **Esqueci minha senha**
2. Informe o e-mail cadastrado
3. Clique no link enviado para o e-mail e crie uma nova senha

---

## Estrutura do projeto

```
tcc-2025-1-e-2-educa-analytics/
├── .github/workflows/        # CI/CD (GitHub Actions)
├── documentos/               # Diagramas C4, DER, documentação do TCC
├── frontend/                 # Aplicação Angular 17
│   └── src/app/
│       ├── core/             # Guards, interceptors, serviços globais
│       ├── features/         # Módulos por funcionalidade (login, home, turmas…)
│       └── shared/           # Componentes reutilizáveis
├── backend/                  # Lambda Python
│   ├── lambda_function.py    # Entry point da Lambda
│   └── app/src/
│       ├── services/         # Lógica de negócio
│       ├── models/           # Modelos de dados
│       ├── adapters/         # Conexão com banco (PyMySQL)
│       └── core/             # Configurações (variáveis de ambiente)
└── infrastructure/           # Configuração de infraestrutura AWS
```

---

## Contribuindo

Contribuições são bem-vindas! Para contribuir:

1. Faça um **fork** do repositório
2. Crie uma branch para sua feature:
   ```bash
   git checkout -b feature/minha-feature
   ```
3. Faça os commits com mensagens claras:
   ```bash
   git commit -m "feat: adicionar relatório de frequência mensal"
   ```
4. Envie para o seu fork:
   ```bash
   git push origin feature/minha-feature
   ```
5. Abra um **Pull Request** descrevendo a mudança proposta

> Siga o padrão de commits [Conventional Commits](https://www.conventionalcommits.org/pt-br/).

---

## Licença

Este projeto está licenciado sob a **Licença MIT** — consulte o arquivo [LICENSE](LICENSE) para mais detalhes.

---

## Autores

Desenvolvido por estudantes do curso de **Análise e Desenvolvimento de Sistemas** — TCC 2025/1.

> Projeto acadêmico desenvolvido para a disciplina de TCC com orientação docente.
