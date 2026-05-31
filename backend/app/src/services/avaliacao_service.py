"""
Serviço de Avaliações — registra envios de formulários e recupera os já respondidos.

Tabelas:
  - avaliacoes_envios    (id, tipo_formulario, id_usuario, tipo_usuario, data_envio)
      id_usuario  → apenas para controle de "quem já respondeu" (nunca exposto em relatórios)
      tipo_usuario → papel do respondente (educando | educador | responsavel)
  - avaliacoes_respostas (id, id_envio, pergunta_id, valor)
      vinculadas ao envio, sem referência direta ao usuário → anonimato nas respostas
"""
from __future__ import annotations

from app.src.adapters.db_adapter import execute_query, execute_write

# ── Auto-migração ─────────────────────────────────────────────────────────────

try:
    execute_write("""
        CREATE TABLE IF NOT EXISTS avaliacoes_envios (
            id              INT          NOT NULL AUTO_INCREMENT,
            tipo_formulario VARCHAR(100) NOT NULL,
            id_usuario      VARCHAR(50)  NOT NULL,
            tipo_usuario    VARCHAR(20)  NOT NULL DEFAULT '',
            data_envio      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            INDEX idx_usuario      (id_usuario),
            INDEX idx_tipo_usuario (tipo_formulario, id_usuario),
            INDEX idx_tipo_form    (tipo_formulario, tipo_usuario)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    """)
    print("[OK] [STARTUP] Tabela avaliacoes_envios verificada")
except Exception as e:
    print(f"[WARN] [STARTUP] Tabela avaliacoes_envios: {type(e).__name__}: {e}")

try:
    execute_write("""
        CREATE TABLE IF NOT EXISTS avaliacoes_respostas (
            id          INT          NOT NULL AUTO_INCREMENT,
            id_envio    INT          NOT NULL,
            pergunta_id VARCHAR(100) NOT NULL,
            valor       TEXT,
            PRIMARY KEY (id),
            INDEX idx_envio (id_envio)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    """)
    print("[OK] [STARTUP] Tabela avaliacoes_respostas verificada")
except Exception as e:
    print(f"[WARN] [STARTUP] Tabela avaliacoes_respostas: {type(e).__name__}: {e}")

# Migração: adiciona tipo_usuario se a tabela já existia sem a coluna
try:
    execute_write("""
        ALTER TABLE avaliacoes_envios
        ADD COLUMN tipo_usuario VARCHAR(20) NOT NULL DEFAULT '' AFTER id_usuario
    """)
    print("[OK] [STARTUP] Coluna tipo_usuario adicionada a avaliacoes_envios")
except Exception:
    pass  # coluna já existe — ignorar


# ── Funções públicas ──────────────────────────────────────────────────────────

def listar_respondidas(id_usuario: str) -> list[dict]:
    """
    Retorna os tipos de formulários já respondidos pelo usuário (identificado
    internamente), com a data da última resposta.
    As respostas em si NÃO são retornadas — apenas o controle de participação.
    """
    rows = execute_query(
        """
        SELECT tipo_formulario, MAX(data_envio) AS ultima_resposta
        FROM avaliacoes_envios
        WHERE id_usuario = %s
        GROUP BY tipo_formulario
        """,
        (id_usuario,),
    )
    result = []
    for r in rows:
        data_str = None
        ultima = r.get("ultima_resposta")
        if ultima:
            try:
                data_str = ultima.strftime("%d/%m/%Y")
            except AttributeError:
                data_str = str(ultima)[:10]
        result.append({"tipo": r["tipo_formulario"], "dataResposta": data_str})
    return result


def listar_participacao(tipo_formulario: str) -> dict:
    """
    Retorna estatísticas ANÔNIMAS de participação por tipo de usuário.
    Nunca expõe id_usuario — apenas contagens agregadas por papel.

    Exemplo de retorno:
      {
        "educando":   {"responderam": 12},
        "educador":   {"responderam": 5},
        "responsavel":{"responderam": 8}
      }
    """
    rows = execute_query(
        """
        SELECT tipo_usuario, COUNT(DISTINCT id_usuario) AS responderam
        FROM avaliacoes_envios
        WHERE tipo_formulario = %s
          AND tipo_usuario != ''
        GROUP BY tipo_usuario
        """,
        (tipo_formulario,),
    )
    return {r["tipo_usuario"]: {"responderam": r["responderam"]} for r in rows}


def enviar(tipo_formulario: str, id_usuario: str, tipo_usuario: str, respostas: dict) -> dict:
    """
    Registra um envio de formulário com todas as respostas.

    Privacidade:
      - id_usuario é salvo para controle interno de "quem respondeu"
        (não exposto em relatórios — use listar_participacao para dados agrupados)
      - tipo_usuario indica o papel (educando/educador/responsavel) para análises
      - as respostas ficam em avaliacoes_respostas vinculadas ao id_envio (sem id do usuário)

    Sempre cria um novo envio (histórico completo preservado).
    """
    if not tipo_formulario or not id_usuario:
        raise ValueError("tipo_formulario e id_usuario sao obrigatorios")
    if not respostas:
        raise ValueError("Nenhuma resposta informada")

    tipo_usuario = (tipo_usuario or "").strip()[:20]

    # Cabeçalho do envio
    id_envio = execute_write(
        """
        INSERT INTO avaliacoes_envios (tipo_formulario, id_usuario, tipo_usuario)
        VALUES (%s, %s, %s)
        """,
        (tipo_formulario, id_usuario, tipo_usuario),
    )

    # Respostas individuais — sem referência ao usuário
    count = 0
    for pergunta_id, valor in respostas.items():
        valor_str = str(valor) if valor is not None else ""
        execute_write(
            "INSERT INTO avaliacoes_respostas (id_envio, pergunta_id, valor) VALUES (%s, %s, %s)",
            (id_envio, str(pergunta_id), valor_str),
        )
        count += 1

    return {"id_envio": id_envio, "respostas_salvas": count, "tipo": tipo_formulario}

    return {
        "mensagem": "Avaliacao enviada com sucesso",
        "id_envio": id_envio,
        "tipo": tipo_formulario,
        "total_respostas": len(respostas),
    }


def listar_dashboard() -> dict:
    """
    Retorna estatísticas ANÔNIMAS e AGREGADAS para o Dashboard Escolar.

    Inclui para cada formulário compartilhado (infraestrutura, clima-socioemocional,
    gestao-escolar, qualidade-ensino):
      - media_geral: média geral de satisfação (0-100)
      - total_respondentes: total de pessoas que responderam
      - por_papel: contagem e média por tipo de usuário
      - por_pergunta: média por pergunta (apenas escala 1-5)
    """
    FORMULARIOS = [
        ("infraestrutura",       "Infraestrutura",        "🏫"),
        ("clima-socioemocional", "Clima Socioemocional",  "🤝"),
        ("gestao-escolar",       "Gestão Escolar",        "⚙️"),
        ("qualidade-ensino",     "Qualidade de Ensino",   "📚"),
    ]
    TIPOS_ACEITOS = ("infraestrutura", "clima-socioemocional", "gestao-escolar", "qualidade-ensino")
    PAPEIS_ACEITOS = ("educador", "educando", "responsavel")

    # Participação + média por formulário e papel
    rows_forma = execute_query(
        """
        SELECT
            e.tipo_formulario,
            e.tipo_usuario,
            COUNT(DISTINCT e.id_usuario) AS responderam,
            ROUND(AVG(CAST(r.valor AS DECIMAL(10,2))) / 5.0 * 100, 1) AS media_pct
        FROM avaliacoes_envios e
        JOIN avaliacoes_respostas r ON r.id_envio = e.id
        WHERE r.valor REGEXP '^[12345]$'
          AND e.tipo_formulario IN ('infraestrutura','clima-socioemocional','gestao-escolar','qualidade-ensino')
          AND e.tipo_usuario IN ('educador','educando','responsavel')
        GROUP BY e.tipo_formulario, e.tipo_usuario
        """,
    )

    # Média por pergunta por formulário
    rows_perguntas = execute_query(
        """
        SELECT
            e.tipo_formulario,
            r.pergunta_id,
            ROUND(AVG(CAST(r.valor AS DECIMAL(10,2))) / 5.0 * 100, 1) AS media_pct,
            COUNT(*) AS total
        FROM avaliacoes_envios e
        JOIN avaliacoes_respostas r ON r.id_envio = e.id
        WHERE r.valor REGEXP '^[12345]$'
          AND e.tipo_formulario IN ('infraestrutura','clima-socioemocional','gestao-escolar','qualidade-ensino')
        GROUP BY e.tipo_formulario, r.pergunta_id
        """,
    )

    # Total único de respondentes por papel (qualquer formulário compartilhado)
    rows_totais = execute_query(
        """
        SELECT tipo_usuario, COUNT(DISTINCT id_usuario) AS total
        FROM avaliacoes_envios
        WHERE tipo_formulario IN ('infraestrutura','clima-socioemocional','gestao-escolar','qualidade-ensino')
          AND tipo_usuario IN ('educador','educando','responsavel')
        GROUP BY tipo_usuario
        """,
    )

    # Construir mapas
    forma_map: dict = {}
    for r in rows_forma:
        tf = r["tipo_formulario"]
        tu = r["tipo_usuario"]
        if tf not in forma_map:
            forma_map[tf] = {}
        forma_map[tf][tu] = {
            "responderam": int(r["responderam"]),
            "media": float(r["media_pct"] or 0),
        }

    perguntas_map: dict = {}
    for r in rows_perguntas:
        tf = r["tipo_formulario"]
        if tf not in perguntas_map:
            perguntas_map[tf] = {}
        perguntas_map[tf][r["pergunta_id"]] = float(r["media_pct"] or 0)

    formularios = []
    for tipo, titulo, icone in FORMULARIOS:
        papeis = forma_map.get(tipo, {})
        total_resp = sum(p.get("responderam", 0) for p in papeis.values())
        if total_resp > 0:
            soma_pond = sum(
                p.get("media", 0) * p.get("responderam", 0) for p in papeis.values()
            )
            media_geral = round(soma_pond / total_resp, 1)
        else:
            media_geral = 0.0

        formularios.append(
            {
                "tipo": tipo,
                "titulo": titulo,
                "icone": icone,
                "media_geral": media_geral,
                "total_respondentes": total_resp,
                "por_papel": papeis,
                "por_pergunta": perguntas_map.get(tipo, {}),
            }
        )

    totais_por_papel = {r["tipo_usuario"]: int(r["total"]) for r in rows_totais}
    total_geral = sum(totais_por_papel.values())

    # Total de usuários cadastrados na instituição por papel
    rows_inst = execute_query(
        """
        SELECT 'educador' AS papel, COUNT(*) AS total FROM Educador
        UNION ALL
        SELECT 'colaborador' AS papel, COUNT(*) AS total FROM Colaborador
        UNION ALL
        SELECT tipoUsuario AS papel, COUNT(*) AS total
        FROM EducandoResponsavel
        WHERE tipoUsuario IN ('educando', 'responsavel')
        GROUP BY tipoUsuario
        """,
    )
    totais_instituicao = {r["papel"]: int(r["total"]) for r in rows_inst}

    # Participação por turma (educandos com matrícula ativa)
    try:
        rows_turma = execute_query(
            """
            SELECT
                t.idTurma,
                t.nomeTurma,
                COUNT(DISTINCT h.idMatricula)          AS total_educandos,
                COUNT(DISTINCT e.id_usuario)           AS responderam,
                ROUND(
                  AVG(CAST(r.valor AS DECIMAL(10,2))) / 5.0 * 100, 1
                ) AS media_pct
            FROM Turmas t
            JOIN HistoricoEscolar h
                  ON h.idTurma   = t.idTurma
                 AND h.situacao  = 'cursando'
            LEFT JOIN avaliacoes_envios e
                   ON e.id_usuario   = h.idMatricula
                  AND e.tipo_formulario IN ('infraestrutura','clima-socioemocional','gestao-escolar','qualidade-ensino')
                  AND e.tipo_usuario = 'educando'
            LEFT JOIN avaliacoes_respostas r
                   ON r.id_envio = e.id
                  AND r.valor REGEXP '^[12345]$'
            GROUP BY t.idTurma, t.nomeTurma
            HAVING total_educandos > 0
            ORDER BY responderam DESC, t.nomeTurma ASC
            """,
        )
        por_turma = [
            {
                "id": int(r["idTurma"]),
                "nome": r["nomeTurma"] or f"Turma {r['idTurma']}",
                "total_educandos": int(r["total_educandos"]),
                "responderam": int(r["responderam"]),
                "media": float(r["media_pct"] or 0),
                "pct": round(int(r["responderam"]) / int(r["total_educandos"]) * 100)
                       if int(r["total_educandos"]) > 0 else 0,
            }
            for r in rows_turma
        ]
    except Exception:
        por_turma = []

    return {
        "formularios": formularios,
        "totais": {
            "total_respondentes": total_geral,
            "por_papel": totais_por_papel,
        },
        "totais_instituicao": totais_instituicao,
        "por_turma": por_turma,
    }


def listar_respostas_envio(id_envio: int) -> dict:
    """
    Retorna o cabeçalho e as respostas de um envio específico.
    Útil para exibir histórico ou auditoria.
    """
    envios = execute_query(
        "SELECT * FROM avaliacoes_envios WHERE id = %s",
        (id_envio,),
    )
    if not envios:
        return {}

    respostas = execute_query(
        "SELECT pergunta_id, valor FROM avaliacoes_respostas WHERE id_envio = %s",
        (id_envio,),
    )
    return {
        "envio": envios[0],
        "respostas": {r["pergunta_id"]: r["valor"] for r in respostas},
    }
