"""
Serviço de Formulários Customizados
====================================
Permite que gestores e colaboradores criem formulários personalizados
que aparecem na tela de avaliações para os tipos de usuário escolhidos.

Tabela: formularios_customizados
  id         – slug único gerado a partir do título + timestamp
  titulo     – nome do formulário
  descricao  – descrição opcional
  icone      – emoji/ícone
  cor        – classe de cor (azul, verde, roxo, laranja, rosa, cinza, amarelo)
  publico    – JSON array com tipos de usuário que veem o formulário
  perguntas  – JSON array com as perguntas
  criado_por – id/matrícula de quem criou
  criado_em  – data/hora de criação
"""
from __future__ import annotations

import json
import re
from datetime import datetime
from app.src.adapters.db_adapter import execute_query, execute_write

# ── Auto-migração ─────────────────────────────────────────────────────────────

try:
    execute_write("""
        CREATE TABLE IF NOT EXISTS formularios_customizados (
            id          VARCHAR(120) NOT NULL PRIMARY KEY,
            titulo      VARCHAR(200) NOT NULL,
            descricao   TEXT,
            icone       VARCHAR(50)  NOT NULL DEFAULT '📋',
            cor         VARCHAR(30)  NOT NULL DEFAULT 'azul',
            publico     JSON         NOT NULL,
            perguntas   JSON         NOT NULL,
            criado_por  VARCHAR(50),
            criado_em   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    """)
    print("[OK] [STARTUP] Tabela formularios_customizados verificada")
except Exception as e:
    print(f"[WARN] [STARTUP] Tabela formularios_customizados: {type(e).__name__}: {e}")


# ── Helpers ───────────────────────────────────────────────────────────────────

def _slugify(texto: str) -> str:
    """Converte título em slug seguro para usar como ID."""
    replacements = {
        'à': 'a', 'á': 'a', 'â': 'a', 'ã': 'a', 'ä': 'a', 'å': 'a',
        'è': 'e', 'é': 'e', 'ê': 'e', 'ë': 'e',
        'ì': 'i', 'í': 'i', 'î': 'i', 'ï': 'i',
        'ò': 'o', 'ó': 'o', 'ô': 'o', 'õ': 'o', 'ö': 'o',
        'ù': 'u', 'ú': 'u', 'û': 'u', 'ü': 'u',
        'ç': 'c', 'ñ': 'n',
    }
    t = texto.lower()
    for orig, rep in replacements.items():
        t = t.replace(orig, rep)
    t = re.sub(r'[^a-z0-9\s-]', '', t)
    t = re.sub(r'[\s]+', '-', t.strip())
    t = re.sub(r'-+', '-', t)
    return t[:60].rstrip('-')


def _deserializar_json(valor, fallback):
    """Desserializa campo JSON que pode vir como str ou já como objeto."""
    if isinstance(valor, str):
        try:
            return json.loads(valor)
        except Exception:
            return fallback
    return valor if valor is not None else fallback


# ── Funções públicas ──────────────────────────────────────────────────────────

def criar_formulario(dados: dict, criado_por: str = None) -> dict:
    """
    Cria um novo formulário customizado.
    Retorna {"id": ..., "titulo": ...} em caso de sucesso.
    Lança ValueError para dados inválidos.
    """
    titulo    = str(dados.get("titulo", "")).strip()
    descricao = str(dados.get("descricao", "")).strip()
    icone     = str(dados.get("icone", "📋")).strip() or "📋"
    cor       = str(dados.get("cor", "azul")).strip() or "azul"
    publico   = dados.get("publico", [])
    perguntas = dados.get("perguntas", [])

    if not titulo:
        raise ValueError("Título é obrigatório")
    if not isinstance(publico, list) or not publico:
        raise ValueError("Selecione ao menos um tipo de usuário destinatário")
    if not isinstance(perguntas, list) or not perguntas:
        raise ValueError("Adicione ao menos uma pergunta ao formulário")

    # Normaliza e valida perguntas
    perguntas_norm = []
    tipos_validos = {"escala", "aberta", "sim_nao", "multipla"}
    for i, p in enumerate(perguntas):
        texto = str(p.get("texto", "")).strip()
        if not texto:
            continue
        tipo_p = str(p.get("tipo", "escala"))
        if tipo_p not in tipos_validos:
            tipo_p = "escala"
        perguntas_norm.append({
            "id": f"q{i + 1}",
            "texto": texto,
            "tipo": tipo_p,
            "obrigatoria": bool(p.get("obrigatoria", True)),
        })

    if not perguntas_norm:
        raise ValueError("Adicione ao menos uma pergunta com texto preenchido")

    # Gera ID único: custom-<slug>-<timestamp>
    slug = _slugify(titulo)
    ts = datetime.now().strftime("%Y%m%d%H%M%S")
    form_id = f"custom-{slug}-{ts}"

    execute_write(
        """INSERT INTO formularios_customizados
           (id, titulo, descricao, icone, cor, publico, perguntas, criado_por)
           VALUES (%s, %s, %s, %s, %s, %s, %s, %s)""",
        (
            form_id, titulo, descricao, icone, cor,
            json.dumps(publico, ensure_ascii=False),
            json.dumps(perguntas_norm, ensure_ascii=False),
            criado_por,
        ),
    )

    print(f"[formulario_service] Formulário criado: {form_id} por {criado_por}")
    return {"id": form_id, "titulo": titulo}


def listar_formularios(tipo_usuario: str) -> list[dict]:
    """
    Retorna formulários customizados cujo campo 'publico' contém o tipo_usuario.
    Utiliza JSON_CONTAINS do MySQL para filtrar no banco.
    """
    rows = execute_query(
        """SELECT id, titulo, descricao, icone, cor, publico, criado_em
           FROM formularios_customizados
           WHERE JSON_CONTAINS(publico, %s)
           ORDER BY criado_em DESC""",
        (json.dumps(tipo_usuario),),
    )
    result = []
    for r in rows:
        try:
            result.append({
                "id": r["id"],
                "titulo": r["titulo"],
                "descricao": r.get("descricao") or "",
                "icone": r.get("icone") or "📋",
                "cor": r.get("cor") or "azul",
                "publico": _deserializar_json(r.get("publico"), []),
                "criado_em": str(r.get("criado_em", "")),
            })
        except Exception as e:
            print(f"[formulario_service] Erro ao deserializar formulário {r.get('id')}: {e}")
    return result


def buscar_por_id(form_id: str) -> dict | None:
    """Retorna um formulário completo (com perguntas) pelo ID."""
    rows = execute_query(
        "SELECT * FROM formularios_customizados WHERE id = %s LIMIT 1",
        (form_id,),
    )
    if not rows:
        return None
    r = rows[0]
    return {
        "id": r["id"],
        "titulo": r["titulo"],
        "descricao": r.get("descricao") or "",
        "icone": r.get("icone") or "📋",
        "cor": r.get("cor") or "azul",
        "publico": _deserializar_json(r.get("publico"), []),
        "perguntas": _deserializar_json(r.get("perguntas"), []),
    }
