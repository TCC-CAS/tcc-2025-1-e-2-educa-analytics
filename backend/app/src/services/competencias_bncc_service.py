"""
Serviço de Avaliações por Competências BNCC.

Persiste e recupera avaliações qualitativas dos educandos baseadas nas
competências da Base Nacional Comum Curricular (BNCC).

Tabela:
  - competencias_bncc_avaliacoes (
        id, id_turma, id_disciplina, id_matricula, id_educador,
        bimestre, avaliacao_json, criado_em, atualizado_em
    )
"""
from __future__ import annotations

import json
from app.src.adapters.db_adapter import execute_query, execute_write

# ── Auto-migração ─────────────────────────────────────────────────────────────

try:
    execute_write("""
        CREATE TABLE IF NOT EXISTS competencias_bncc_avaliacoes (
            id              INT          NOT NULL AUTO_INCREMENT,
            id_turma        INT          NOT NULL,
            id_disciplina   INT          NOT NULL,
            id_matricula    VARCHAR(50)  NOT NULL,
            id_educador     VARCHAR(50)  NOT NULL,
            bimestre        VARCHAR(10)  NOT NULL,
            avaliacao_json  LONGTEXT     NOT NULL,
            criado_em       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
            atualizado_em   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY uq_avaliacao (id_turma, id_disciplina, id_matricula, bimestre),
            INDEX idx_turma_disc (id_turma, id_disciplina),
            INDEX idx_matricula  (id_matricula)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    """)
    print("[OK] [STARTUP] Tabela competencias_bncc_avaliacoes verificada")
except Exception as e:
    print(f"[WARN] [STARTUP] Tabela competencias_bncc_avaliacoes: {type(e).__name__}: {e}")


# ── Funções públicas ──────────────────────────────────────────────────────────

def salvar_avaliacao(data: dict) -> dict:
    """
    Cria ou atualiza (upsert) uma avaliação BNCC para um educando.

    Campos esperados em *data*:
        idTurma, idDisciplina, idMatricula, bimestre, idEducador, avaliacao
    """
    id_turma      = data.get("idTurma")
    id_disciplina = data.get("idDisciplina")
    id_matricula  = str(data.get("idMatricula", "")).strip()
    bimestre      = str(data.get("bimestre", "")).strip()
    id_educador   = str(data.get("idEducador", "")).strip()
    avaliacao     = data.get("avaliacao")

    if not all([id_turma, id_disciplina, id_matricula, bimestre, id_educador, avaliacao]):
        raise ValueError("Campos obrigatórios: idTurma, idDisciplina, idMatricula, bimestre, idEducador, avaliacao")

    avaliacao_json = json.dumps(avaliacao, ensure_ascii=False)

    # Tenta atualizar; se não existir, insere
    linhas_afetadas = execute_write(
        """
        INSERT INTO competencias_bncc_avaliacoes
            (id_turma, id_disciplina, id_matricula, id_educador, bimestre, avaliacao_json)
        VALUES (%s, %s, %s, %s, %s, %s)
        ON DUPLICATE KEY UPDATE
            id_educador    = VALUES(id_educador),
            avaliacao_json = VALUES(avaliacao_json),
            atualizado_em  = CURRENT_TIMESTAMP
        """,
        (id_turma, id_disciplina, id_matricula, id_educador, bimestre, avaliacao_json),
    )

    return {
        "message": "Avaliação salva com sucesso",
        "idTurma":      id_turma,
        "idDisciplina": id_disciplina,
        "idMatricula":  id_matricula,
        "bimestre":     bimestre,
    }


def buscar_avaliacao(id_turma: int, id_disciplina: int, id_matricula: str, bimestre: str) -> dict | None:
    """
    Retorna a avaliação BNCC persistida para os parâmetros fornecidos,
    ou None se ainda não existir.
    """
    rows = execute_query(
        """
        SELECT avaliacao_json, atualizado_em
          FROM competencias_bncc_avaliacoes
         WHERE id_turma      = %s
           AND id_disciplina = %s
           AND id_matricula  = %s
           AND bimestre      = %s
         LIMIT 1
        """,
        (id_turma, id_disciplina, id_matricula, bimestre),
    )

    if not rows:
        return None

    row = rows[0]
    return {
        "avaliacao":    json.loads(row["avaliacao_json"]),
        "atualizadoEm": str(row.get("atualizado_em", "")),
    }


def listar_avaliacoes_turma(id_turma: int, id_disciplina: int, bimestre: str) -> list:
    """
    Retorna todas as avaliacoes salvas para uma turma+disciplina+bimestre.
    Usado para gerar estatisticas da turma.
    """
    rows = execute_query(
        """
        SELECT id_matricula, avaliacao_json
          FROM competencias_bncc_avaliacoes
         WHERE id_turma      = %s
           AND id_disciplina = %s
           AND bimestre      = %s
        """,
        (id_turma, id_disciplina, bimestre),
    )
    return [
        {"idMatricula": row["id_matricula"], "avaliacao": json.loads(row["avaliacao_json"])}
        for row in rows
    ]


def listar_avaliacoes_turma(id_turma: int, id_disciplina: int, bimestre: str) -> list:
    """
    Retorna todas as avaliacoes salvas para uma turma+disciplina+bimestre.
    Usado para gerar estatisticas da turma.
    """
    rows = execute_query(
        """
        SELECT id_matricula, avaliacao_json
          FROM competencias_bncc_avaliacoes
         WHERE id_turma      = %s
           AND id_disciplina = %s
           AND bimestre      = %s
        """,
        (id_turma, id_disciplina, bimestre),
    )
    return [
        {"idMatricula": row["id_matricula"], "avaliacao": json.loads(row["avaliacao_json"])}
        for row in rows
    ]
