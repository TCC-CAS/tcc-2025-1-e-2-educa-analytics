-- ============================================================
-- educaAnalytics — Script de criação das tabelas (MySQL 8+)
-- Execute no RDS MySQL após criar o banco de dados:
--   CREATE DATABASE educa_analytics CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
--   USE educa_analytics;
-- ============================================================

CREATE DATABASE IF NOT EXISTS educa_analytics
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE educa_analytics;

-- ============================================================
-- TABELA: Educador
-- ============================================================
CREATE TABLE IF NOT EXISTS Educador (
    idMatricula     VARCHAR(20)  NOT NULL,
    nomeCompleto    VARCHAR(150) NOT NULL,
    nacionalidade   VARCHAR(50)  DEFAULT NULL,
    genero          VARCHAR(50)  DEFAULT NULL,
    cor             VARCHAR(30)  DEFAULT NULL,
    dataNascimento  DATE         DEFAULT NULL,
    idade           TINYINT UNSIGNED DEFAULT NULL COMMENT 'Calculado a partir de dataNascimento',
    telefone        VARCHAR(20)  DEFAULT NULL,
    email           VARCHAR(120) NOT NULL,
    cpf             VARCHAR(14)  NOT NULL,
    idStatus        TINYINT      NOT NULL DEFAULT 1 COMMENT '1=Ativo, 0=Inativo',
    tipoUsuario     VARCHAR(30)  NOT NULL DEFAULT 'educador',
    cargo           VARCHAR(100) DEFAULT NULL,
    departamento    VARCHAR(100) DEFAULT NULL,
    PRIMARY KEY (idMatricula),
    -- UNIQUE KEY uq_educador_email (email),  -- REMOVIDO: Permite e-mails duplicados
    UNIQUE KEY uq_educador_cpf   (cpf)
) ENGINE=InnoDB;

-- ============================================================
-- TABELA: Colaborador
-- ============================================================
CREATE TABLE IF NOT EXISTS Colaborador (
    idMatricula     VARCHAR(20)  NOT NULL,
    nomeCompleto    VARCHAR(150) NOT NULL,
    nacionalidade   VARCHAR(50)  DEFAULT NULL,
    genero          VARCHAR(50)  DEFAULT NULL,
    cor             VARCHAR(30)  DEFAULT NULL,
    dataNascimento  DATE         DEFAULT NULL,
    idade           TINYINT UNSIGNED DEFAULT NULL COMMENT 'Calculado a partir de dataNascimento',
    telefone        VARCHAR(20)  DEFAULT NULL,
    email           VARCHAR(120) NOT NULL,
    cpf             VARCHAR(14)  NOT NULL,
    idStatus        TINYINT      NOT NULL DEFAULT 1 COMMENT '1=Ativo, 0=Inativo',
    tipoUsuario     VARCHAR(30)  NOT NULL DEFAULT 'colaborador',
    cargo           VARCHAR(100) DEFAULT NULL,
    departamento    VARCHAR(100) DEFAULT NULL,
    PRIMARY KEY (idMatricula),
    UNIQUE KEY uq_colaborador_email (email),
    UNIQUE KEY uq_colaborador_cpf   (cpf)
) ENGINE=InnoDB;

-- ============================================================
-- TABELA: FormacaoAcademica
-- ============================================================
CREATE TABLE IF NOT EXISTS FormacaoAcademica (
    idFormacao       INT          NOT NULL AUTO_INCREMENT,
    idMatricula      VARCHAR(20)  NOT NULL,
    tipoUsuario      VARCHAR(30)  NOT NULL COMMENT 'educador ou colaborador',
    instituicao      VARCHAR(150) NOT NULL,
    areaConhecimento VARCHAR(100) DEFAULT NULL,
    dataInicio       DATE         NOT NULL,
    dataFim          DATE         DEFAULT NULL,
    status           ENUM('cursando','concluido','interrompido') NOT NULL DEFAULT 'concluido',
    PRIMARY KEY (idFormacao),
    KEY idx_formacao_matricula (idMatricula)
) ENGINE=InnoDB;

-- ============================================================
-- TABELA: EducandoResponsavel  (Educando e Responsável)
-- ============================================================
CREATE TABLE IF NOT EXISTS EducandoResponsavel (
    idMatricula     VARCHAR(20)  NOT NULL,
    nomeCompleto    VARCHAR(150) NOT NULL,
    nacionalidade   VARCHAR(50)  DEFAULT NULL,
    genero          VARCHAR(50)  DEFAULT NULL,
    cor             VARCHAR(30)  DEFAULT NULL,
    dataNascimento  DATE         DEFAULT NULL,
    idade           TINYINT UNSIGNED DEFAULT NULL COMMENT 'Calculado a partir de dataNascimento',
    telefone        VARCHAR(20)  DEFAULT NULL,
    email           VARCHAR(120) DEFAULT NULL,
    cpf             VARCHAR(14)  DEFAULT NULL,
    rg              VARCHAR(20)  DEFAULT NULL,
    orgaoEmissor    VARCHAR(20)  DEFAULT NULL,
    estadoEmissor   CHAR(2)      DEFAULT NULL,
    idStatus        ENUM('Ativa','Concluída','Abandonada') NOT NULL DEFAULT 'Ativa',
    tipoUsuario     ENUM('educando','responsavel') NOT NULL,
    createdAt       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (idMatricula),
    UNIQUE KEY uq_educando_cpf (cpf)
) ENGINE=InnoDB;

-- ============================================================
-- TABELA: Endereco
-- ============================================================
CREATE TABLE IF NOT EXISTS Endereco (
    idMatricula  VARCHAR(20)  NOT NULL,
    tipoUsuario  VARCHAR(30)  NOT NULL COMMENT 'educador, colaborador, educando, responsavel',
    cep          VARCHAR(9)   NOT NULL,
    logradouro   VARCHAR(200) DEFAULT NULL,
    numero       VARCHAR(10)  NOT NULL,
    complemento  VARCHAR(100) DEFAULT NULL,
    bairro       VARCHAR(100) DEFAULT NULL,
    uf           CHAR(2)      NOT NULL,
    cidade       VARCHAR(100) NOT NULL,
    PRIMARY KEY (idMatricula, tipoUsuario)
) ENGINE=InnoDB;

-- ============================================================
-- TABELA: Login
-- ============================================================
CREATE TABLE IF NOT EXISTS Login (
    idMatricula  VARCHAR(20)  NOT NULL,
    email        VARCHAR(120) NOT NULL,
    senha        VARCHAR(255) NOT NULL COMMENT 'Armazenar apenas hash (bcrypt/argon2)',
    PRIMARY KEY (idMatricula),
    UNIQUE KEY uq_login_email (email)
) ENGINE=InnoDB;

-- ============================================================
-- TABELA: Salas
-- ============================================================
CREATE TABLE IF NOT EXISTS Salas (
    idSala      INT          NOT NULL AUTO_INCREMENT,
    codSala     VARCHAR(20)  NOT NULL,
    nomeSala    VARCHAR(100) NOT NULL,
    tipoSala    VARCHAR(50)  DEFAULT NULL,
    status      ENUM('disponivel','ocupada','manutencao') NOT NULL DEFAULT 'disponivel',
    capacidade  SMALLINT UNSIGNED NOT NULL DEFAULT 0,
    bloco       VARCHAR(20)  DEFAULT NULL,
    andar       VARCHAR(20)  DEFAULT NULL,
    recursos    TEXT         DEFAULT NULL,
    obsSala     TEXT         DEFAULT NULL,
    PRIMARY KEY (idSala),
    UNIQUE KEY uq_sala_cod (codSala)
) ENGINE=InnoDB;

-- ============================================================
-- TABELA: Turmas
-- ============================================================
CREATE TABLE IF NOT EXISTS Turmas (
    idTurma     INT          NOT NULL AUTO_INCREMENT,
    codTurma    VARCHAR(20)  NOT NULL,
    nomeTurma   VARCHAR(100) NOT NULL,
    periodo     ENUM('matutino','vespertino','noturno','integral') NOT NULL,
    anoLetivo   YEAR         NOT NULL,
    serie       VARCHAR(20)  DEFAULT NULL,
    qldVagas    SMALLINT UNSIGNED NOT NULL DEFAULT 30,
    dataInicio  DATE         DEFAULT NULL,
    dataFim     DATE         DEFAULT NULL,
    status      ENUM('ativa','encerrada','suspensa') NOT NULL DEFAULT 'ativa',
    idSala      INT          DEFAULT NULL,
    PRIMARY KEY (idTurma),
    UNIQUE KEY uq_turma_cod_ano (codTurma, anoLetivo),
    CONSTRAINT fk_turma_sala FOREIGN KEY (idSala) REFERENCES Salas (idSala) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- TABELA: HistoricoEscolar
-- ============================================================
CREATE TABLE IF NOT EXISTS HistoricoEscolar (
    idHistorico  INT         NOT NULL AUTO_INCREMENT,
    idMatricula  VARCHAR(20) NOT NULL,
    serie        VARCHAR(20) DEFAULT NULL,
    anoLetivo    YEAR        NOT NULL,
    situacao     ENUM('aprovado','reprovado','transferido','cursando') NOT NULL DEFAULT 'cursando',
    idTurma      INT         DEFAULT NULL,
    idResponsavel VARCHAR(20) NOT NULL,
    PRIMARY KEY (idHistorico),
    KEY idx_historico_matricula (idMatricula),
    CONSTRAINT fk_historico_turma FOREIGN KEY (idTurma) REFERENCES Turmas (idTurma) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- TABELA: Disciplinas
-- ============================================================
CREATE TABLE IF NOT EXISTS Disciplinas (
    idDisciplina        INT          NOT NULL AUTO_INCREMENT,
    codDisciplina       VARCHAR(20)  NOT NULL,
    nomeDisciplina      VARCHAR(100) NOT NULL,
    areaConhecimento    VARCHAR(100) DEFAULT NULL,
    idMatriculaEducador VARCHAR(20)  DEFAULT NULL,
    PRIMARY KEY (idDisciplina),
    UNIQUE KEY uq_disciplina_cod (codDisciplina),
    CONSTRAINT fk_disciplina_educador
        FOREIGN KEY (idMatriculaEducador) REFERENCES Educador (idMatricula)
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- TABELA: Atividades
-- ============================================================
CREATE TABLE IF NOT EXISTS Atividades (
    idAtividade    INT          NOT NULL AUTO_INCREMENT,
    idDisciplina   INT          NOT NULL,
    atividade      VARCHAR(200) NOT NULL,
    tipoAtividade  VARCHAR(50)  DEFAULT NULL,
    dataAtividade  DATE         DEFAULT NULL,
    notaMax        DECIMAL(5,2) NOT NULL DEFAULT 10.00,
    PRIMARY KEY (idAtividade),
    CONSTRAINT fk_atividade_disciplina
        FOREIGN KEY (idDisciplina) REFERENCES Disciplinas (idDisciplina)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- TABELA: Notas
-- ============================================================
CREATE TABLE IF NOT EXISTS Notas (
    idMatricula   VARCHAR(20)  NOT NULL,
    idDisciplina  INT          NOT NULL,
    idAtividade   INT          NOT NULL,
    idTurma       INT          NOT NULL,
    notaEducando  DECIMAL(5,2) NOT NULL,
    PRIMARY KEY (idMatricula, idDisciplina, idAtividade, idTurma),
    CONSTRAINT fk_notas_educando
        FOREIGN KEY (idMatricula)  REFERENCES EducandoResponsavel (idMatricula)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_notas_disciplina
        FOREIGN KEY (idDisciplina) REFERENCES Disciplinas (idDisciplina)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_notas_atividade
        FOREIGN KEY (idAtividade)  REFERENCES Atividades (idAtividade)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_notas_turma
        FOREIGN KEY (idTurma)      REFERENCES Turmas (idTurma)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- TABELA: Frequencia
-- ============================================================
CREATE TABLE IF NOT EXISTS Frequencia (
    idMatricula   VARCHAR(20)  NOT NULL,
    idDisciplina  INT          NOT NULL,
    data          DATE         NOT NULL,
    presenca      BOOLEAN      NOT NULL DEFAULT TRUE,
    prcFreq       DECIMAL(5,2) DEFAULT NULL COMMENT 'Percentual acumulado de frequência',
    PRIMARY KEY (idMatricula, idDisciplina, data),
    CONSTRAINT fk_freq_educando
        FOREIGN KEY (idMatricula)  REFERENCES EducandoResponsavel (idMatricula)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_freq_disciplina
        FOREIGN KEY (idDisciplina) REFERENCES Disciplinas (idDisciplina)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- TABELA: FornecedoresPF (legado — mantida para compatibilidade)
-- ============================================================
CREATE TABLE IF NOT EXISTS FornecedoresPF (
    idFornecedor    INT          NOT NULL AUTO_INCREMENT,
    nomeFornecedor  VARCHAR(150) NOT NULL,
    cpf             VARCHAR(14)  NOT NULL,
    telefone        VARCHAR(20)  DEFAULT NULL,
    email           VARCHAR(120) DEFAULT NULL,
    tipoDespesa     VARCHAR(50)  DEFAULT NULL,
    tipoUsuario     VARCHAR(30)  NOT NULL DEFAULT 'fornecedor_pf',
    PRIMARY KEY (idFornecedor),
    UNIQUE KEY uq_fornecedorpf_cpf (cpf)
) ENGINE=InnoDB;

-- ============================================================
-- TABELA: FornecedoresPJ (legado — mantida para compatibilidade)
-- ============================================================
CREATE TABLE IF NOT EXISTS FornecedoresPJ (
    idFornecedor  INT          NOT NULL AUTO_INCREMENT,
    nomeFantasia  VARCHAR(150) DEFAULT NULL,
    razaoSocial   VARCHAR(150) NOT NULL,
    cnpj          VARCHAR(18)  NOT NULL,
    telefone      VARCHAR(20)  DEFAULT NULL,
    email         VARCHAR(120) DEFAULT NULL,
    tipoDespesa   VARCHAR(50)  DEFAULT NULL,
    tipoUsuario   VARCHAR(30)  NOT NULL DEFAULT 'fornecedor_pj',
    PRIMARY KEY (idFornecedor),
    UNIQUE KEY uq_fornecedorpj_cnpj (cnpj)
) ENGINE=InnoDB;

-- ============================================================
-- TABELA: Fornecedores (unificada PF e PJ)
-- ============================================================
CREATE TABLE IF NOT EXISTS Fornecedores (
    idFornecedor      INT             NOT NULL AUTO_INCREMENT,
    tipo              ENUM('PF','PJ') NOT NULL,
    nome              VARCHAR(150)    NOT NULL COMMENT 'Nome fantasia (PJ) ou nome completo (PF)',
    razaoSocial       VARCHAR(150)    DEFAULT NULL COMMENT 'Apenas PJ',
    cpfCnpj           VARCHAR(18)     NOT NULL COMMENT 'CPF (14 chars) ou CNPJ (18 chars)',
    email             VARCHAR(120)    DEFAULT NULL,
    telefone          VARCHAR(20)     DEFAULT NULL,
    cep               VARCHAR(9)      DEFAULT NULL,
    endereco          VARCHAR(200)    DEFAULT NULL,
    centroCusto       VARCHAR(100)    DEFAULT NULL,
    categoria         VARCHAR(100)    DEFAULT NULL COMMENT 'Categoria / tipo de despesa',
    ativo             TINYINT         NOT NULL DEFAULT 1 COMMENT '1=Ativo, 0=Inativo',
    ultimoPagamento   DATE            DEFAULT NULL,
    valorMensalMedio  DECIMAL(10,2)   NOT NULL DEFAULT 0.00,
    qtdContratos      INT             NOT NULL DEFAULT 0,
    scoreEntrega      DECIMAL(4,1)    DEFAULT NULL,
    scorePontualidade DECIMAL(4,1)    DEFAULT NULL,
    scoreQualidade    DECIMAL(4,1)    DEFAULT NULL,
    createdAt         TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (idFornecedor),
    UNIQUE KEY uq_fornecedor_cpfcnpj (cpfCnpj)
) ENGINE=InnoDB;

-- ============================================================
-- TABELA: Caixa
-- ============================================================
CREATE TABLE IF NOT EXISTS Caixa (
    idLancamento    INT           NOT NULL AUTO_INCREMENT,
    data            DATE          NOT NULL,
    tipoOperacao    VARCHAR(10)   NOT NULL DEFAULT 'saida' COMMENT 'entrada | saida',
    formaPagamento  VARCHAR(50)   DEFAULT NULL,
    tipoDespesa     VARCHAR(50)   DEFAULT NULL,
    centroCusto     VARCHAR(100)  DEFAULT NULL,
    descricao       VARCHAR(200)  DEFAULT NULL,
    fornecedor      VARCHAR(150)  DEFAULT NULL,
    usuario         VARCHAR(100)  DEFAULT NULL,
    valorDespesa    DECIMAL(10,2) NOT NULL,
    idMatricula     VARCHAR(20)   DEFAULT NULL COMMENT 'FK para EducandoResponsavel',
    PRIMARY KEY (idLancamento),
    CONSTRAINT fk_caixa_educando
        FOREIGN KEY (idMatricula) REFERENCES EducandoResponsavel (idMatricula)
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- TABELA: Eventos
-- ============================================================
CREATE TABLE IF NOT EXISTS Eventos (
    idEvento    INT          NOT NULL AUTO_INCREMENT,
    nomeEvento  VARCHAR(150) NOT NULL,
    dataEvento  DATE         NOT NULL,
    horaEvento  TIME         NOT NULL,
    serie       VARCHAR(20)  DEFAULT NULL,
    PRIMARY KEY (idEvento)
) ENGINE=InnoDB;
