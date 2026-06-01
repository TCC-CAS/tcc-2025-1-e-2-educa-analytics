-- ============================================================
-- Migração: Matriz Curricular v2
-- Data: 2026-05-27
-- Descrição:
--   1. Cria tabela de histórico MatrizCurricularHistorico
--   2. Insere disciplinas faltantes (Música, Expressão Corporal,
--      Inglês - LEM, Informática)
--   3. Carrega dados reais da grade dos 3 primeiros anos do EF
--      para o ano letivo 2026 (conforme matriz institucional)
--
-- Notas:
--   - Usa INSERT ... ON DUPLICATE KEY UPDATE para idempotência
--   - CH (Carga Horária Anual) = QAS × 40  (40 semanas letivas)
--   - Os SELECTs buscam disciplinas pelo nome para suportar
--     diferentes conjuntos de códigos (seed vs. criação manual)
-- ============================================================

USE educa_analytics;

-- ══════════════════════════════════════════════════════════════
-- 1. TABELA DE HISTÓRICO
-- ══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS MatrizCurricularHistorico (
    idHistorico          INT           NOT NULL AUTO_INCREMENT,
    idMatriz             INT           NULL     COMMENT 'ID da entrada original (NULL se excluída)',
    serie                VARCHAR(20)   NOT NULL COMMENT 'Ex: 1º Ano',
    idDisciplina         INT           NOT NULL,
    nomeDisciplina       VARCHAR(150)  NULL     COMMENT 'Snapshot do nome no momento da alteração',
    cargaHorariaSemanal  INT           NOT NULL COMMENT 'QAS — Quantidade de Aulas Semanais',
    cargaHorariaAnual    INT           NOT NULL COMMENT 'CH = QAS × 40',
    anoLetivo            INT           NOT NULL,
    status               ENUM('ativa','inativa') NOT NULL DEFAULT 'ativa',
    observacoes          TEXT          NULL,
    acao                 ENUM('criado','atualizado','excluido') NOT NULL,
    motivoAlteracao      VARCHAR(500)  NULL     COMMENT 'Justificativa opcional da alteração',
    registradoEm         TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (idHistorico),
    KEY idx_hist_idMatriz   (idMatriz),
    KEY idx_hist_serie_ano  (serie, anoLetivo),
    KEY idx_hist_disciplina (idDisciplina),
    KEY idx_hist_data       (registradoEm)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COMMENT='Histórico de alterações da matriz curricular';


-- ══════════════════════════════════════════════════════════════
-- 2. NOVAS DISCIPLINAS
--    Insere apenas se não existir disciplina com o mesmo código.
-- ══════════════════════════════════════════════════════════════

INSERT IGNORE INTO Disciplinas (codDisciplina, nomeDisciplina, areaConhecimento, status)
VALUES
    ('MUS', 'Música',                              'Linguagens', 'ativa'),
    ('EC',  'Expressão Corporal',                  'Linguagens', 'ativa'),
    ('LEM', 'Inglês - Língua Estrangeira Moderna', 'Linguagens', 'ativa');

-- Informática: insere somente se não houver nenhuma disciplina
-- com nome contendo "Informática" na base
INSERT INTO Disciplinas (codDisciplina, nomeDisciplina, areaConhecimento, status)
SELECT 'INF', 'Informática', 'Complementar', 'ativa'
WHERE NOT EXISTS (
    SELECT 1 FROM Disciplinas
    WHERE nomeDisciplina LIKE '%nformática%'
    LIMIT 1
);

-- Garantir que disciplinas centrais existam (idempotente)
INSERT IGNORE INTO Disciplinas (codDisciplina, nomeDisciplina, areaConhecimento, status)
VALUES
    ('LP',   'Língua Portuguesa', 'Linguagens',          'ativa'),
    ('MAT',  'Matemática',        'Matemática',          'ativa'),
    ('ART',  'Arte',              'Linguagens',          'ativa'),
    ('EF',   'Educação Física',   'Linguagens',          'ativa'),
    ('CIE',  'Ciências',          'Ciências da Natureza','ativa'),
    ('HIS',  'História',          'Ciências Humanas',    'ativa'),
    ('GEO',  'Geografia',         'Ciências Humanas',    'ativa');


-- ══════════════════════════════════════════════════════════════
-- 3. SEED: MATRIZ CURRICULAR 2026
--    Referência: grade institucional (3 primeiros anos do EF)
--    QAS = Quantidade de Aulas Semanais
--    CH  = QAS × 40  (calculado no back-end; não armazenado aqui)
--
--    Usamos INSERT ... ON DUPLICATE KEY UPDATE para sobrescrever
--    cargas horárias legadas com os valores corretos.
--
--    Único key: (serie, idDisciplina, anoLetivo)
-- ══════════════════════════════════════════════════════════════

-- ── 1º Ano ──────────────────────────────────────────────────

-- Língua Portuguesa — QAS 7 / CH 280
INSERT INTO MatrizCurricular (serie, idDisciplina, cargaHorariaSemanal, anoLetivo, status)
SELECT '1º Ano', idDisciplina, 7, 2026, 'ativa'
FROM Disciplinas WHERE nomeDisciplina = 'Língua Portuguesa' LIMIT 1
ON DUPLICATE KEY UPDATE cargaHorariaSemanal = 7, status = 'ativa';

-- Matemática — QAS 7 / CH 280
INSERT INTO MatrizCurricular (serie, idDisciplina, cargaHorariaSemanal, anoLetivo, status)
SELECT '1º Ano', idDisciplina, 7, 2026, 'ativa'
FROM Disciplinas WHERE nomeDisciplina = 'Matemática' LIMIT 1
ON DUPLICATE KEY UPDATE cargaHorariaSemanal = 7, status = 'ativa';

-- Ciências — QAS 3 / CH 120
INSERT INTO MatrizCurricular (serie, idDisciplina, cargaHorariaSemanal, anoLetivo, status)
SELECT '1º Ano', idDisciplina, 3, 2026, 'ativa'
FROM Disciplinas WHERE nomeDisciplina IN ('Ciências','Ciências da Natureza') LIMIT 1
ON DUPLICATE KEY UPDATE cargaHorariaSemanal = 3, status = 'ativa';

-- Educação Física — QAS 3 / CH 120
INSERT INTO MatrizCurricular (serie, idDisciplina, cargaHorariaSemanal, anoLetivo, status)
SELECT '1º Ano', idDisciplina, 3, 2026, 'ativa'
FROM Disciplinas WHERE nomeDisciplina = 'Educação Física' LIMIT 1
ON DUPLICATE KEY UPDATE cargaHorariaSemanal = 3, status = 'ativa';

-- Arte — QAS 2 / CH 80
INSERT INTO MatrizCurricular (serie, idDisciplina, cargaHorariaSemanal, anoLetivo, status)
SELECT '1º Ano', idDisciplina, 2, 2026, 'ativa'
FROM Disciplinas WHERE nomeDisciplina = 'Arte' LIMIT 1
ON DUPLICATE KEY UPDATE cargaHorariaSemanal = 2, status = 'ativa';

-- História — QAS 2 / CH 80
INSERT INTO MatrizCurricular (serie, idDisciplina, cargaHorariaSemanal, anoLetivo, status)
SELECT '1º Ano', idDisciplina, 2, 2026, 'ativa'
FROM Disciplinas WHERE nomeDisciplina = 'História' LIMIT 1
ON DUPLICATE KEY UPDATE cargaHorariaSemanal = 2, status = 'ativa';

-- Geografia — QAS 2 / CH 80
INSERT INTO MatrizCurricular (serie, idDisciplina, cargaHorariaSemanal, anoLetivo, status)
SELECT '1º Ano', idDisciplina, 2, 2026, 'ativa'
FROM Disciplinas WHERE nomeDisciplina = 'Geografia' LIMIT 1
ON DUPLICATE KEY UPDATE cargaHorariaSemanal = 2, status = 'ativa';

-- Música — QAS 2 / CH 80
INSERT INTO MatrizCurricular (serie, idDisciplina, cargaHorariaSemanal, anoLetivo, status)
SELECT '1º Ano', idDisciplina, 2, 2026, 'ativa'
FROM Disciplinas WHERE nomeDisciplina = 'Música' LIMIT 1
ON DUPLICATE KEY UPDATE cargaHorariaSemanal = 2, status = 'ativa';

-- Expressão Corporal — QAS 1 / CH 40  (exclusiva do 1º Ano)
INSERT INTO MatrizCurricular (serie, idDisciplina, cargaHorariaSemanal, anoLetivo, status)
SELECT '1º Ano', idDisciplina, 1, 2026, 'ativa'
FROM Disciplinas WHERE nomeDisciplina = 'Expressão Corporal' LIMIT 1
ON DUPLICATE KEY UPDATE cargaHorariaSemanal = 1, status = 'ativa';

-- Inglês - LEM — QAS 1 / CH 40
INSERT INTO MatrizCurricular (serie, idDisciplina, cargaHorariaSemanal, anoLetivo, status)
SELECT '1º Ano', idDisciplina, 1, 2026, 'ativa'
FROM Disciplinas WHERE nomeDisciplina = 'Inglês - Língua Estrangeira Moderna' LIMIT 1
ON DUPLICATE KEY UPDATE cargaHorariaSemanal = 1, status = 'ativa';

-- ── 2º Ano ──────────────────────────────────────────────────

INSERT INTO MatrizCurricular (serie, idDisciplina, cargaHorariaSemanal, anoLetivo, status)
SELECT '2º Ano', idDisciplina, 7, 2026, 'ativa'
FROM Disciplinas WHERE nomeDisciplina = 'Língua Portuguesa' LIMIT 1
ON DUPLICATE KEY UPDATE cargaHorariaSemanal = 7, status = 'ativa';

INSERT INTO MatrizCurricular (serie, idDisciplina, cargaHorariaSemanal, anoLetivo, status)
SELECT '2º Ano', idDisciplina, 7, 2026, 'ativa'
FROM Disciplinas WHERE nomeDisciplina = 'Matemática' LIMIT 1
ON DUPLICATE KEY UPDATE cargaHorariaSemanal = 7, status = 'ativa';

INSERT INTO MatrizCurricular (serie, idDisciplina, cargaHorariaSemanal, anoLetivo, status)
SELECT '2º Ano', idDisciplina, 3, 2026, 'ativa'
FROM Disciplinas WHERE nomeDisciplina IN ('Ciências','Ciências da Natureza') LIMIT 1
ON DUPLICATE KEY UPDATE cargaHorariaSemanal = 3, status = 'ativa';

INSERT INTO MatrizCurricular (serie, idDisciplina, cargaHorariaSemanal, anoLetivo, status)
SELECT '2º Ano', idDisciplina, 3, 2026, 'ativa'
FROM Disciplinas WHERE nomeDisciplina = 'Educação Física' LIMIT 1
ON DUPLICATE KEY UPDATE cargaHorariaSemanal = 3, status = 'ativa';

INSERT INTO MatrizCurricular (serie, idDisciplina, cargaHorariaSemanal, anoLetivo, status)
SELECT '2º Ano', idDisciplina, 2, 2026, 'ativa'
FROM Disciplinas WHERE nomeDisciplina = 'Arte' LIMIT 1
ON DUPLICATE KEY UPDATE cargaHorariaSemanal = 2, status = 'ativa';

INSERT INTO MatrizCurricular (serie, idDisciplina, cargaHorariaSemanal, anoLetivo, status)
SELECT '2º Ano', idDisciplina, 2, 2026, 'ativa'
FROM Disciplinas WHERE nomeDisciplina = 'História' LIMIT 1
ON DUPLICATE KEY UPDATE cargaHorariaSemanal = 2, status = 'ativa';

INSERT INTO MatrizCurricular (serie, idDisciplina, cargaHorariaSemanal, anoLetivo, status)
SELECT '2º Ano', idDisciplina, 2, 2026, 'ativa'
FROM Disciplinas WHERE nomeDisciplina = 'Geografia' LIMIT 1
ON DUPLICATE KEY UPDATE cargaHorariaSemanal = 2, status = 'ativa';

INSERT INTO MatrizCurricular (serie, idDisciplina, cargaHorariaSemanal, anoLetivo, status)
SELECT '2º Ano', idDisciplina, 2, 2026, 'ativa'
FROM Disciplinas WHERE nomeDisciplina = 'Música' LIMIT 1
ON DUPLICATE KEY UPDATE cargaHorariaSemanal = 2, status = 'ativa';

-- Informática — QAS 1 / CH 40 (a partir do 2º Ano)
INSERT INTO MatrizCurricular (serie, idDisciplina, cargaHorariaSemanal, anoLetivo, status)
SELECT '2º Ano', idDisciplina, 1, 2026, 'ativa'
FROM Disciplinas WHERE nomeDisciplina LIKE '%nformática%' LIMIT 1
ON DUPLICATE KEY UPDATE cargaHorariaSemanal = 1, status = 'ativa';

INSERT INTO MatrizCurricular (serie, idDisciplina, cargaHorariaSemanal, anoLetivo, status)
SELECT '2º Ano', idDisciplina, 1, 2026, 'ativa'
FROM Disciplinas WHERE nomeDisciplina = 'Inglês - Língua Estrangeira Moderna' LIMIT 1
ON DUPLICATE KEY UPDATE cargaHorariaSemanal = 1, status = 'ativa';

-- ── 3º Ano ──────────────────────────────────────────────────

INSERT INTO MatrizCurricular (serie, idDisciplina, cargaHorariaSemanal, anoLetivo, status)
SELECT '3º Ano', idDisciplina, 7, 2026, 'ativa'
FROM Disciplinas WHERE nomeDisciplina = 'Língua Portuguesa' LIMIT 1
ON DUPLICATE KEY UPDATE cargaHorariaSemanal = 7, status = 'ativa';

INSERT INTO MatrizCurricular (serie, idDisciplina, cargaHorariaSemanal, anoLetivo, status)
SELECT '3º Ano', idDisciplina, 7, 2026, 'ativa'
FROM Disciplinas WHERE nomeDisciplina = 'Matemática' LIMIT 1
ON DUPLICATE KEY UPDATE cargaHorariaSemanal = 7, status = 'ativa';

INSERT INTO MatrizCurricular (serie, idDisciplina, cargaHorariaSemanal, anoLetivo, status)
SELECT '3º Ano', idDisciplina, 2, 2026, 'ativa'
FROM Disciplinas WHERE nomeDisciplina IN ('Ciências','Ciências da Natureza') LIMIT 1
ON DUPLICATE KEY UPDATE cargaHorariaSemanal = 2, status = 'ativa';

INSERT INTO MatrizCurricular (serie, idDisciplina, cargaHorariaSemanal, anoLetivo, status)
SELECT '3º Ano', idDisciplina, 2, 2026, 'ativa'
FROM Disciplinas WHERE nomeDisciplina = 'Educação Física' LIMIT 1
ON DUPLICATE KEY UPDATE cargaHorariaSemanal = 2, status = 'ativa';

INSERT INTO MatrizCurricular (serie, idDisciplina, cargaHorariaSemanal, anoLetivo, status)
SELECT '3º Ano', idDisciplina, 2, 2026, 'ativa'
FROM Disciplinas WHERE nomeDisciplina = 'Arte' LIMIT 1
ON DUPLICATE KEY UPDATE cargaHorariaSemanal = 2, status = 'ativa';

INSERT INTO MatrizCurricular (serie, idDisciplina, cargaHorariaSemanal, anoLetivo, status)
SELECT '3º Ano', idDisciplina, 2, 2026, 'ativa'
FROM Disciplinas WHERE nomeDisciplina = 'História' LIMIT 1
ON DUPLICATE KEY UPDATE cargaHorariaSemanal = 2, status = 'ativa';

INSERT INTO MatrizCurricular (serie, idDisciplina, cargaHorariaSemanal, anoLetivo, status)
SELECT '3º Ano', idDisciplina, 2, 2026, 'ativa'
FROM Disciplinas WHERE nomeDisciplina = 'Geografia' LIMIT 1
ON DUPLICATE KEY UPDATE cargaHorariaSemanal = 2, status = 'ativa';

INSERT INTO MatrizCurricular (serie, idDisciplina, cargaHorariaSemanal, anoLetivo, status)
SELECT '3º Ano', idDisciplina, 2, 2026, 'ativa'
FROM Disciplinas WHERE nomeDisciplina = 'Música' LIMIT 1
ON DUPLICATE KEY UPDATE cargaHorariaSemanal = 2, status = 'ativa';

INSERT INTO MatrizCurricular (serie, idDisciplina, cargaHorariaSemanal, anoLetivo, status)
SELECT '3º Ano', idDisciplina, 1, 2026, 'ativa'
FROM Disciplinas WHERE nomeDisciplina LIKE '%nformática%' LIMIT 1
ON DUPLICATE KEY UPDATE cargaHorariaSemanal = 1, status = 'ativa';

-- Inglês — QAS 2 no 3º Ano
INSERT INTO MatrizCurricular (serie, idDisciplina, cargaHorariaSemanal, anoLetivo, status)
SELECT '3º Ano', idDisciplina, 2, 2026, 'ativa'
FROM Disciplinas WHERE nomeDisciplina = 'Inglês - Língua Estrangeira Moderna' LIMIT 1
ON DUPLICATE KEY UPDATE cargaHorariaSemanal = 2, status = 'ativa';


-- ══════════════════════════════════════════════════════════════
-- 4. VERIFICAÇÃO
-- ══════════════════════════════════════════════════════════════

SELECT
    serie,
    COUNT(*)                               AS total_disciplinas,
    SUM(cargaHorariaSemanal)               AS total_qas,
    SUM(cargaHorariaSemanal * 40)          AS total_ch_anual
FROM MatrizCurricular
WHERE anoLetivo = 2026 AND status = 'ativa'
  AND serie IN ('1º Ano', '2º Ano', '3º Ano')
GROUP BY serie
ORDER BY serie;
