-- ============================================================
-- educaAnalytics — Script de criação das tabelas (MySQL 8+)
-- Execute no RDS MySQL após criar o banco de dados:
--   CREATE DATABASE educa_analytics CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
--   USE educa_analytics;
-- ============================================================

CREATE TABLE IF NOT EXISTS usuarios (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    nome        VARCHAR(120)  NOT NULL,
    email       VARCHAR(120)  NOT NULL UNIQUE,
    senha_hash  VARCHAR(64)   NOT NULL,
    perfil      ENUM('admin', 'professor', 'coordenador') NOT NULL DEFAULT 'professor',
    criado_em   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS turmas (
    id       INT AUTO_INCREMENT PRIMARY KEY,
    nome     VARCHAR(60)  NOT NULL,
    ano      YEAR         NOT NULL,
    periodo  ENUM('matutino', 'vespertino', 'noturno') NOT NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS disciplinas (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    nome          VARCHAR(100) NOT NULL,
    carga_horaria INT          NOT NULL DEFAULT 0
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS alunos (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    nome       VARCHAR(120) NOT NULL,
    email      VARCHAR(120),
    matricula  VARCHAR(30)  NOT NULL UNIQUE,
    turma_id   INT          NOT NULL,
    criado_em  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_aluno_turma FOREIGN KEY (turma_id) REFERENCES turmas(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS notas (
    id             INT AUTO_INCREMENT PRIMARY KEY,
    aluno_id       INT   NOT NULL,
    disciplina_id  INT   NOT NULL,
    bimestre       TINYINT NOT NULL CHECK (bimestre BETWEEN 1 AND 4),
    valor          DECIMAL(4,2) NOT NULL,
    registrado_em  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_nota_aluno      FOREIGN KEY (aluno_id)      REFERENCES alunos(id),
    CONSTRAINT fk_nota_disciplina FOREIGN KEY (disciplina_id) REFERENCES disciplinas(id),
    UNIQUE KEY uq_nota (aluno_id, disciplina_id, bimestre)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS frequencias (
    id             INT AUTO_INCREMENT PRIMARY KEY,
    aluno_id       INT     NOT NULL,
    disciplina_id  INT     NOT NULL,
    data_aula      DATE    NOT NULL,
    presente       BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT fk_freq_aluno      FOREIGN KEY (aluno_id)      REFERENCES alunos(id),
    CONSTRAINT fk_freq_disciplina FOREIGN KEY (disciplina_id) REFERENCES disciplinas(id),
    UNIQUE KEY uq_frequencia (aluno_id, disciplina_id, data_aula)
) ENGINE=InnoDB;

-- ── Usuário admin padrão (senha: Admin@123) ──────────────────
-- SHA-256 de "Admin@123":
INSERT IGNORE INTO usuarios (nome, email, senha_hash, perfil)
VALUES (
    'Administrador',
    'admin@educaanalytics.com',
    'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3',
    'admin'
);
