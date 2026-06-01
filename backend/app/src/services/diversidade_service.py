"""
Serviço de Diversidade — dados demográficos agregados e anônimos
para exibição no Dashboard Escolar.

Fontes (tentadas em ordem de prioridade):
  1. EducandoResponsavel  — educandos (tipoUsuario='educando') e responsaveis (tipoUsuario='responsavel')
  2. educadores           — tabela principal de educadores (com campos opcionais de demografia)
  3. educandos            — tabela UUID nova (fallback)

Campos usados: cor, genero, dataNascimento, nacionalidade
Nenhum dado individual é exposto — apenas agregados.
"""

from app.src.adapters.db_adapter import execute_query


# ── Mapeamentos canônicos ─────────────────────────────────────────────────────

_CORES = {
    "amarelo":        "Amarelo",
    "branco":         "Branco",
    "indigena":       "Indígena",
    "indígena":       "Indígena",
    "pardo":          "Pardo",
    "parda":          "Pardo",
    "preto":          "Preto",
    "preta":          "Preto",
    "negro":          "Preto",
    "negra":          "Preto",
    "nao declarado":  "Não Declarado",
    "não declarado":  "Não Declarado",
    "nao_declarado":  "Não Declarado",
    "":               "Não Declarado",
}

_GENEROS = {
    "masculino":      "Masculino",
    "m":              "Masculino",
    "feminino":       "Feminino",
    "f":              "Feminino",
    "outro":          "Outro",
    "outros":         "Outro",
    "prefiro nao informar": "Outro",
    "prefiro não informar": "Outro",
    "nao declarado":  "Não Declarado",
    "não declarado":  "Não Declarado",
    "":               "Não Declarado",
}

_FAIXAS = [
    ("até 20",  0,  20),
    ("21 a 30", 21, 30),
    ("31 a 40", 31, 40),
    ("41 a 50", 41, 50),
    ("51 a 60", 51, 60),
    ("> 60",    61, 200),
]


def _norm(valor, mapa):
    key = (valor or "").strip().lower()
    return mapa.get(key, mapa.get("", "Não Declarado"))


def _norm_nacionalidade(valor):
    v = (valor or "").strip()
    if not v:
        return "Não Declarado"
    # Normaliza capitalização
    return v.title()


def _unificar_rows(rows, campo_nasc="dataNascimento"):
    """Normaliza rows para sempre ter chaves: cor, genero, dataNascimento, nacionalidade."""
    out = []
    for r in rows:
        out.append({
            "cor":           r.get("cor") or r.get("corRaca") or "",
            "genero":        r.get("genero") or "",
            "dataNascimento": r.get(campo_nasc) or r.get("dataNascimento") or r.get("data_nascimento"),
            "nacionalidade": r.get("nacionalidade") or "",
        })
    return out


def listar_diversidade() -> dict:
    """
    Retorna dados demográficos anônimos e agregados de TODOS os usuários
    cadastrados na plataforma, separados por tipo:
      - educando     → EducandoResponsavel WHERE tipoUsuario='educando'
      - responsavel  → EducandoResponsavel WHERE tipoUsuario='responsavel'
      - educador     → Educador (tabela da tela de educadores)
      - colaborador  → Colaborador (tabela da tela de colaboradores)
    Campos usados: cor, genero, dataNascimento, nacionalidade
    Retorna: { total, por_tipo, cor_raca, genero, faixas, nacionalidade }
    """
    # Cada entrada: dict com chaves cor, genero, dataNascimento, nacionalidade, tipo_usuario
    todas = []

    # ── 1. Educandos ──────────────────────────────────────────────────────────
    try:
        rows = execute_query("""
            SELECT DISTINCT idMatricula, genero, cor, dataNascimento, nacionalidade
            FROM EducandoResponsavel
            WHERE tipoUsuario = 'educando'
        """)
        for r in _unificar_rows(rows):
            r["tipo_usuario"] = "educando"
            todas.append(r)
        print(f"[diversidade] educandos: {len(rows)}")
    except Exception as e:
        print(f"[diversidade] educandos falhou: {e}")

    # ── 2. Responsáveis ───────────────────────────────────────────────────────
    try:
        rows = execute_query("""
            SELECT DISTINCT idMatricula, genero, cor, dataNascimento, nacionalidade
            FROM EducandoResponsavel
            WHERE tipoUsuario = 'responsavel'
        """)
        for r in _unificar_rows(rows):
            r["tipo_usuario"] = "responsavel"
            todas.append(r)
        print(f"[diversidade] responsaveis: {len(rows)}")
    except Exception as e:
        print(f"[diversidade] responsaveis falhou: {e}")

    # ── 3. Educadores ─────────────────────────────────────────────────────────
    try:
        rows = execute_query("""
            SELECT genero, cor, dataNascimento, nacionalidade
            FROM Educador
        """)
        for r in _unificar_rows(rows):
            r["tipo_usuario"] = "educador"
            todas.append(r)
        print(f"[diversidade] educadores: {len(rows)}")
    except Exception as e:
        print(f"[diversidade] educadores falhou: {e}")

    # ── 4. Colaboradores (inclui gestores cadastrados como colaborador) ───────
    try:
        rows = execute_query("""
            SELECT genero, cor, dataNascimento, nacionalidade, tipoUsuario
            FROM Colaborador
        """)
        for r in _unificar_rows(rows):
            r["tipo_usuario"] = "colaborador"
            todas.append(r)
        print(f"[diversidade] colaboradores: {len(rows)}")
    except Exception as e:
        print(f"[diversidade] colaboradores falhou: {e}")

    print(f"[diversidade] total combinado: {len(todas)}")

    # ── Contagem por tipo de usuário ──────────────────────────────────────────
    tipo_map: dict = {}
    for r in todas:
        t = r.get("tipo_usuario", "outro")
        tipo_map[t] = tipo_map.get(t, 0) + 1
    por_tipo = [{"label": k, "total": v} for k, v in sorted(tipo_map.items(), key=lambda x: -x[1])]
    total = max(len(todas), 1)

    # ── Raça / cor ────────────────────────────────────────────────────────────
    cor_map: dict = {}
    for r in todas:
        label = _norm(r["cor"], _CORES)
        cor_map[label] = cor_map.get(label, 0) + 1

    cor_raca = sorted(
        [{"label": k, "total": v, "pct": round(v / total * 100)} for k, v in cor_map.items()],
        key=lambda x: -x["total"],
    )

    # ── Gênero ────────────────────────────────────────────────────────────────
    gen_map: dict = {}
    for r in todas:
        label = _norm(r["genero"], _GENEROS)
        gen_map[label] = gen_map.get(label, 0) + 1

    genero = sorted(
        [{"label": k, "total": v, "pct": round(v / total * 100)} for k, v in gen_map.items()],
        key=lambda x: -x["total"],
    )

    # ── Nacionalidade ─────────────────────────────────────────────────────────
    nac_map: dict = {}
    for r in todas:
        label = _norm_nacionalidade(r["nacionalidade"])
        nac_map[label] = nac_map.get(label, 0) + 1

    nacionalidade = sorted(
        [{"label": k, "total": v, "pct": round(v / total * 100)} for k, v in nac_map.items()],
        key=lambda x: -x["total"],
    )

    # ── Pirâmide etária ───────────────────────────────────────────────────────
    from datetime import date as _date
    pyramid: dict = {nome: {"Masculino": 0, "Feminino": 0, "Outro": 0} for nome, _, _ in _FAIXAS}

    for r in todas:
        dob = r["dataNascimento"]
        if not dob:
            continue
        try:
            hoje  = _date.today()
            nasc  = dob if isinstance(dob, _date) else _date.fromisoformat(str(dob)[:10])
            idade = (hoje - nasc).days // 365
        except Exception:
            continue

        gen_label = _norm(r["genero"], _GENEROS)
        if gen_label == "Não Declarado":
            gen_label = "Outro"

        for nome, mini, maxi in _FAIXAS:
            if mini <= idade <= maxi:
                pyramid[nome][gen_label] = pyramid[nome].get(gen_label, 0) + 1
                break

    faixas = [
        {
            "faixa":     nome,
            "masculino": pyramid[nome]["Masculino"],
            "feminino":  pyramid[nome]["Feminino"],
            "outro":     pyramid[nome]["Outro"],
        }
        for nome, _, _ in _FAIXAS
    ]

    return {
        "total":         len(todas),
        "por_tipo":      por_tipo,
        "cor_raca":      cor_raca,
        "genero":        genero,
        "faixas":        faixas,
        "nacionalidade": nacionalidade,
    }
