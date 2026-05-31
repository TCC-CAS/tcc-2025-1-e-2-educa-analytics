-- ================================================================================
-- MIGRAÇÃO: SISTEMA DE DISCIPLINAS PROFISSIONAL
-- Data: 2026-05-24
-- Descrição: Reestruturação completa do módulo de disciplinas seguindo
--            padrões acadêmicos profissionais com separação de:
--            - Disciplina (entidade base reutilizável)
--            - Oferta de Disciplina (disciplina x turma x professor)
-- ================================================================================

USE educa_analytics;

-- ══════════════════════════════════════════════════════════════════════════════
-- ETAPA 1: CRIAR TABELAS DE APOIO (ENUMS NORMALIZADOS)
-- ══════════════════════════════════════════════════════════════════════════════

-- 1.1. Áreas do Conhecimento (BNCC)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS areas_conhecimento (
    idAreaConhecimento INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL UNIQUE,
    sigla VARCHAR(10) NOT NULL UNIQUE,
    cor VARCHAR(7) DEFAULT '#6366f1',  -- Cor para UI (hex)
    ordem INT NOT NULL DEFAULT 0,      -- Ordem de exibição
    descricao TEXT,
    ativa BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_ativa (ativa),
    INDEX idx_ordem (ordem)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 1.2. Tipos de Disciplina
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tipos_disciplina (
    idTipoDisciplina INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(50) NOT NULL UNIQUE,  -- Obrigatória, Optativa, Complementar, etc.
    codigo VARCHAR(20) NOT NULL UNIQUE,
    descricao TEXT,
    cor VARCHAR(7) DEFAULT '#6366f1',
    ordem INT NOT NULL DEFAULT 0,
    ativa BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_ativa (ativa)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 1.3. Etapas de Ensino
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS etapas_ensino (
    idEtapaEnsino INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL UNIQUE,  -- Ensino Fundamental I, II, Médio, etc.
    codigo VARCHAR(20) NOT NULL UNIQUE,
    descricao TEXT,
    ordem INT NOT NULL DEFAULT 0,
    ativa BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_ativa (ativa)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ══════════════════════════════════════════════════════════════════════════════
-- ETAPA 2: POPULAR TABELAS DE APOIO
-- ══════════════════════════════════════════════════════════════════════════════

-- 2.1. Inserir Áreas do Conhecimento (BNCC)
-- ----------------------------------------------------------------------------
INSERT INTO areas_conhecimento (nome, sigla, cor, ordem, descricao) VALUES
('Linguagens', 'LING', '#ec4899', 1, 'Língua Portuguesa, Arte, Educação Física e Língua Inglesa'),
('Matemática', 'MAT', '#3b82f6', 2, 'Matemática e suas Tecnologias'),
('Ciências da Natureza', 'CN', '#10b981', 3, 'Biologia, Física, Química'),
('Ciências Humanas', 'CH', '#f59e0b', 4, 'História, Geografia, Filosofia, Sociologia'),
('Ensino Religioso', 'ER', '#8b5cf6', 5, 'Ensino Religioso')
ON DUPLICATE KEY UPDATE nome = VALUES(nome);

-- 2.2. Inserir Tipos de Disciplina
-- ----------------------------------------------------------------------------
INSERT INTO tipos_disciplina (nome, codigo, descricao, cor, ordem) VALUES
('Obrigatória', 'OBR', 'Disciplina obrigatória da Base Nacional Comum Curricular', '#2563eb', 1),
('Optativa', 'OPT', 'Disciplina de escolha do aluno dentro do itinerário formativo', '#8b5cf6', 2),
('Complementar', 'COMP', 'Disciplina complementar ou de reforço', '#06b6d4', 3),
('Extracurricular', 'EXT', 'Atividade extracurricular (clube, projeto, oficina)', '#10b981', 4),
('Projeto', 'PROJ', 'Projeto interdisciplinar ou de pesquisa', '#f59e0b', 5),
('Eletiva', 'ELET', 'Disciplina eletiva - Novo Ensino Médio', '#6366f1', 6)
ON DUPLICATE KEY UPDATE nome = VALUES(nome);

-- 2.3. Inserir Etapas de Ensino
-- ----------------------------------------------------------------------------
INSERT INTO etapas_ensino (nome, codigo, descricao, ordem) VALUES
('Educação Infantil', 'EI', 'Creche e Pré-escola (0 a 5 anos)', 1),
('Ensino Fundamental - Anos Iniciais', 'EF1', '1º ao 5º ano', 2),
('Ensino Fundamental - Anos Finais', 'EF2', '6º ao 9º ano', 3),
('Ensino Médio', 'EM', '1ª à 3ª série', 4),
('Educação de Jovens e Adultos - EJA', 'EJA', 'EJA Fundamental e Médio', 5),
('Educação Profissional', 'EP', 'Cursos técnicos e profissionalizantes', 6)
ON DUPLICATE KEY UPDATE nome = VALUES(nome);

-- ══════════════════════════════════════════════════════════════════════════════
-- ETAPA 3: REESTRUTURAR TABELA DISCIPLINAS (ENTIDADE BASE)
-- ══════════════════════════════════════════════════════════════════════════════

-- 3.1. Adicionar novos campos à tabela Disciplinas
-- ----------------------------------------------------------------------------
ALTER TABLE Disciplinas 
    ADD COLUMN IF NOT EXISTS idAreaConhecimento INT NULL AFTER areaConhecimento,
    ADD COLUMN IF NOT EXISTS idTipoDisciplina INT NULL AFTER idAreaConhecimento,
    ADD COLUMN IF NOT EXISTS idEtapaEnsino INT NULL AFTER idTipoDisciplina,
    
    -- Configurações pedagógicas
    ADD COLUMN IF NOT EXISTS nota_minima DECIMAL(4,2) DEFAULT 7.00 COMMENT 'Nota mínima para aprovação',
    ADD COLUMN IF NOT EXISTS frequencia_minima INT DEFAULT 75 COMMENT 'Frequência mínima em %',
    ADD COLUMN IF NOT EXISTS permite_recuperacao BOOLEAN DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS peso_avaliacao DECIMAL(3,2) DEFAULT 1.00 COMMENT 'Peso da disciplina no cálculo geral',
    
    -- Carga horária detalhada
    ADD COLUMN IF NOT EXISTS carga_horaria_anual INT NULL COMMENT 'Carga horária total anual',
    ADD COLUMN IF NOT EXISTS carga_horaria_teorica INT NULL COMMENT 'Horas teóricas',
    ADD COLUMN IF NOT EXISTS carga_horaria_pratica INT NULL COMMENT 'Horas práticas/laboratório',
    
    -- Competências e habilidades (JSON ou TEXT)
    ADD COLUMN IF NOT EXISTS competencias_bncc JSON NULL COMMENT 'Competências da BNCC (array de códigos)',
    ADD COLUMN IF NOT EXISTS objetivos_aprendizagem TEXT NULL COMMENT 'Objetivos de aprendizagem',
    ADD COLUMN IF NOT EXISTS pre_requisitos TEXT NULL COMMENT 'Pré-requisitos para cursar',
    
    -- Metadados
    ADD COLUMN IF NOT EXISTS criado_em TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN IF NOT EXISTS atualizado_em TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    ADD COLUMN IF NOT EXISTS criado_por VARCHAR(20) NULL COMMENT 'Matrícula do usuário que criou',
    
    -- Foreign Keys
    ADD CONSTRAINT fk_disciplina_area FOREIGN KEY (idAreaConhecimento) 
        REFERENCES areas_conhecimento(idAreaConhecimento) ON DELETE SET NULL,
    ADD CONSTRAINT fk_disciplina_tipo FOREIGN KEY (idTipoDisciplina) 
        REFERENCES tipos_disciplina(idTipoDisciplina) ON DELETE SET NULL,
    ADD CONSTRAINT fk_disciplina_etapa FOREIGN KEY (idEtapaEnsino) 
        REFERENCES etapas_ensino(idEtapaEnsino) ON DELETE SET NULL,
        
    -- Índices
    ADD INDEX idx_area (idAreaConhecimento),
    ADD INDEX idx_tipo (idTipoDisciplina),
    ADD INDEX idx_etapa (idEtapaEnsino),
    ADD INDEX idx_status (status),
    ADD INDEX idx_codigo (codDisciplina);

-- 3.2. Remover coluna idMatriculaEducador (educador deve estar na oferta, não na base)
-- ----------------------------------------------------------------------------
-- NOTA: Comentado para não perder dados. Executar manualmente se necessário.
-- ALTER TABLE Disciplinas DROP COLUMN IF EXISTS idMatriculaEducador;

-- 3.3. Popular idAreaConhecimento baseado no nome da disciplina (heurística)
-- ----------------------------------------------------------------------------
UPDATE Disciplinas d
JOIN areas_conhecimento a ON (
    d.nomeDisciplina LIKE '%PORTUGU%' AND a.nome = 'Linguagens'
    OR d.nomeDisciplina LIKE '%ARTE%' AND a.nome = 'Linguagens'
    OR d.nomeDisciplina LIKE '%EDUCAÇÃO FÍSICA%' AND a.nome = 'Linguagens'
    OR d.nomeDisciplina LIKE '%INGLÊS%' AND a.nome = 'Linguagens'
    OR d.nomeDisciplina LIKE '%INGLESA%' AND a.nome = 'Linguagens'
    OR d.nomeDisciplina LIKE '%MATEMÁTICA%' AND a.nome = 'Matemática'
    OR d.nomeDisciplina LIKE '%CIÊNCIA%' AND a.nome = 'Ciências da Natureza'
    OR d.nomeDisciplina LIKE '%BIOLOGIA%' AND a.nome = 'Ciências da Natureza'
    OR d.nomeDisciplina LIKE '%FÍSICA%' AND a.nome = 'Ciências da Natureza'
    OR d.nomeDisciplina LIKE '%QUÍMICA%' AND a.nome = 'Ciências da Natureza'
    OR d.nomeDisciplina LIKE '%HISTÓRIA%' AND a.nome = 'Ciências Humanas'
    OR d.nomeDisciplina LIKE '%GEOGRAFIA%' AND a.nome = 'Ciências Humanas'
    OR d.nomeDisciplina LIKE '%FILOSOFIA%' AND a.nome = 'Ciências Humanas'
    OR d.nomeDisciplina LIKE '%SOCIOLOGIA%' AND a.nome = 'Ciências Humanas'
    OR d.nomeDisciplina LIKE '%RELIGIOS%' AND a.nome = 'Ensino Religioso'
)
SET d.idAreaConhecimento = a.idAreaConhecimento,
    d.areaConhecimento = a.nome
WHERE d.idAreaConhecimento IS NULL;

-- 3.4. Popular idTipoDisciplina (padrão: Obrigatória)
-- ----------------------------------------------------------------------------
UPDATE Disciplinas d
JOIN tipos_disciplina t ON t.codigo = 'OBR'
SET d.idTipoDisciplina = t.idTipoDisciplina
WHERE d.idTipoDisciplina IS NULL;

-- 3.5. Popular idEtapaEnsino (padrão: Ensino Fundamental - Anos Finais)
-- ----------------------------------------------------------------------------
UPDATE Disciplinas d
JOIN etapas_ensino e ON e.codigo = 'EF2'
SET d.idEtapaEnsino = e.idEtapaEnsino
WHERE d.idEtapaEnsino IS NULL;

-- ══════════════════════════════════════════════════════════════════════════════
-- ETAPA 4: MELHORAR TABELA turma_disciplinas (OFERTAS)
-- ══════════════════════════════════════════════════════════════════════════════

-- 4.1. Adicionar campos de carga horária completa
-- ----------------------------------------------------------------------------
ALTER TABLE turma_disciplinas
    ADD COLUMN IF NOT EXISTS carga_horaria_total INT NULL COMMENT 'Carga horária total da oferta (ex: 160h anuais)',
    ADD COLUMN IF NOT EXISTS semanas_letivas INT DEFAULT 40 COMMENT 'Número de semanas letivas',
    ADD COLUMN IF NOT EXISTS aulas_por_semana INT NULL COMMENT 'Número de aulas semanais',
    ADD COLUMN IF NOT EXISTS duracao_aula_minutos INT DEFAULT 50 COMMENT 'Duração de cada aula em minutos',
    
    -- Separação teórica/prática
    ADD COLUMN IF NOT EXISTS carga_horaria_teorica INT NULL,
    ADD COLUMN IF NOT EXISTS carga_horaria_pratica INT NULL,
    
    -- Status da oferta
    ADD COLUMN IF NOT EXISTS status ENUM('planejada', 'em_andamento', 'concluida', 'cancelada') DEFAULT 'planejada',
    
    -- Observações
    ADD COLUMN IF NOT EXISTS observacoes TEXT NULL,
    
    -- Índices
    ADD INDEX idx_turma (idTurma),
    ADD INDEX idx_disciplina (idDisciplina),
    ADD INDEX idx_educador (idEducador),
    ADD INDEX idx_status (status);

-- 4.2. Renomear coluna para padronização (se necessário)
-- ----------------------------------------------------------------------------
-- Já existe carga_horaria_semanal, vamos manter

-- ══════════════════════════════════════════════════════════════════════════════
-- ETAPA 5: CRIAR VIEWS PARA FACILITAR CONSULTAS
-- ══════════════════════════════════════════════════════════════════════════════

-- 5.1. View de disciplinas completas (com nomes dos relacionamentos)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW vw_disciplinas_completas AS
SELECT 
    d.idDisciplina,
    d.codDisciplina,
    d.nomeDisciplina,
    d.descricao,
    d.status,
    
    -- Área de conhecimento
    d.idAreaConhecimento,
    a.nome AS areaConhecimento,
    a.sigla AS areaConhecimentoSigla,
    a.cor AS areaConhecimentoCor,
    
    -- Tipo de disciplina
    d.idTipoDisciplina,
    t.nome AS tipoDisciplina,
    t.codigo AS tipoDisciplinaCodigo,
    t.cor AS tipoDisciplinaCor,
    
    -- Etapa de ensino
    d.idEtapaEnsino,
    e.nome AS etapaEnsino,
    e.codigo AS etapaEnsinoCodigo,
    
    -- Carga horária
    d.cargaHoraria,
    d.carga_horaria_anual,
    d.carga_horaria_teorica,
    d.carga_horaria_pratica,
    
    -- Configurações pedagógicas
    d.nota_minima,
    d.frequencia_minima,
    d.permite_recuperacao,
    d.peso_avaliacao,
    
    -- Competências
    d.competencias_bncc,
    d.objetivos_aprendizagem,
    d.pre_requisitos,
    
    -- Metadados
    d.criado_em,
    d.atualizado_em,
    d.criado_por
FROM Disciplinas d
LEFT JOIN areas_conhecimento a ON d.idAreaConhecimento = a.idAreaConhecimento
LEFT JOIN tipos_disciplina t ON d.idTipoDisciplina = t.idTipoDisciplina
LEFT JOIN etapas_ensino e ON d.idEtapaEnsino = e.idEtapaEnsino;

-- 5.2. View de ofertas completas (turma_disciplinas com todos os dados)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW vw_ofertas_disciplinas AS
SELECT 
    td.idTurmaDisciplina,
    
    -- Turma
    td.idTurma,
    t.codTurma,
    t.nomeTurma,
    t.serie,
    t.periodo,
    t.anoLetivo,
    t.status AS statusTurma,
    
    -- Disciplina
    td.idDisciplina,
    d.codDisciplina,
    d.nomeDisciplina,
    a.nome AS areaConhecimento,
    tip.nome AS tipoDisciplina,
    
    -- Educador
    td.idEducador,
    ed.nomeCompleto AS nomeEducador,
    ed.email AS emailEducador,
    
    -- Carga horária
    td.carga_horaria_semanal,
    td.carga_horaria_total,
    td.semanas_letivas,
    td.aulas_por_semana,
    td.duracao_aula_minutos,
    td.carga_horaria_teorica,
    td.carga_horaria_pratica,
    
    -- Horário
    td.dia_semana,
    td.horario,
    
    -- Status e observações
    td.status AS statusOferta,
    td.observacoes,
    
    -- Metadados
    td.criado_em,
    td.atualizado_em
    
FROM turma_disciplinas td
INNER JOIN Turmas t ON td.idTurma = t.idTurma
INNER JOIN Disciplinas d ON td.idDisciplina = d.idDisciplina
LEFT JOIN areas_conhecimento a ON d.idAreaConhecimento = a.idAreaConhecimento
LEFT JOIN tipos_disciplina tip ON d.idTipoDisciplina = tip.idTipoDisciplina
LEFT JOIN Educador ed ON td.idEducador = ed.idMatricula;

-- ══════════════════════════════════════════════════════════════════════════════
-- ETAPA 6: CRIAR PROCEDURES ÚTEIS
-- ══════════════════════════════════════════════════════════════════════════════

-- 6.1. Procedure para criar oferta de disciplina com cálculo automático
-- ----------------------------------------------------------------------------
DELIMITER $$

CREATE PROCEDURE IF NOT EXISTS sp_criar_oferta_disciplina(
    IN p_idTurma INT,
    IN p_idDisciplina INT,
    IN p_idEducador VARCHAR(20),
    IN p_aulas_por_semana INT,
    IN p_semanas_letivas INT,
    IN p_duracao_aula_minutos INT
)
BEGIN
    DECLARE v_carga_total INT;
    
    -- Calcular carga horária total
    SET v_carga_total = (p_aulas_por_semana * p_semanas_letivas * p_duracao_aula_minutos) / 60;
    
    -- Inserir oferta
    INSERT INTO turma_disciplinas (
        idTurma,
        idDisciplina,
        idEducador,
        aulas_por_semana,
        semanas_letivas,
        duracao_aula_minutos,
        carga_horaria_semanal,
        carga_horaria_total,
        status
    ) VALUES (
        p_idTurma,
        p_idDisciplina,
        p_idEducador,
        p_aulas_por_semana,
        p_semanas_letivas,
        p_duracao_aula_minutos,
        (p_aulas_por_semana * p_duracao_aula_minutos) / 60,
        v_carga_total,
        'planejada'
    );
    
    SELECT LAST_INSERT_ID() AS idTurmaDisciplina;
END$$

DELIMITER ;

-- ══════════════════════════════════════════════════════════════════════════════
-- ETAPA 7: RELATÓRIO DE MIGRAÇÃO
-- ══════════════════════════════════════════════════════════════════════════════

SELECT '=================================================================================' AS '';
SELECT 'MIGRAÇÃO CONCLUÍDA COM SUCESSO!' AS '';
SELECT '=================================================================================' AS '';
SELECT '' AS '';
SELECT 'RESUMO DAS ALTERAÇÕES:' AS '';
SELECT '- Tabelas criadas: areas_conhecimento, tipos_disciplina, etapas_ensino' AS '';
SELECT '- Disciplinas: novos campos adicionados (área, tipo, etapa, competências, etc.)' AS '';
SELECT '- turma_disciplinas: campos de carga horária e status adicionados' AS '';
SELECT '- Views criadas: vw_disciplinas_completas, vw_ofertas_disciplinas' AS '';
SELECT '- Procedures criadas: sp_criar_oferta_disciplina' AS '';
SELECT '' AS '';

-- Estatísticas
SELECT CONCAT('Total de disciplinas cadastradas: ', COUNT(*)) AS estatistica
FROM Disciplinas;

SELECT CONCAT('Disciplinas com área definida: ', COUNT(*)) AS estatistica
FROM Disciplinas WHERE idAreaConhecimento IS NOT NULL;

SELECT CONCAT('Áreas de conhecimento: ', COUNT(*)) AS estatistica
FROM areas_conhecimento WHERE ativa = TRUE;

SELECT CONCAT('Tipos de disciplina: ', COUNT(*)) AS estatistica
FROM tipos_disciplina WHERE ativa = TRUE;

SELECT CONCAT('Ofertas ativas: ', COUNT(*)) AS estatistica
FROM turma_disciplinas;

SELECT '=================================================================================' AS '';
