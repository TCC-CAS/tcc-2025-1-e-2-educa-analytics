"""
Serviço de Colaboradores — CRUD completo.

Tabelas envolvidas: Colaborador, Educador, Endereco,
FormacaoAcademica, Login.
"""
from __future__ import annotations

import hashlib
import json
import secrets
from datetime import date, datetime, timedelta

from app.src.adapters.db_adapter import execute_query, execute_write
from app.src.services import email_service
from app.src.models.models import (
    ColaboradorModel,
    EducadorModel,
    EnderecoModel,
    FormacaoAcademicaModel,
    LoginModel,
)


# ── Migração automática de colunas ausentes ───────────────────────────────────

def _add_col_if_missing(table: str, col: str, definition: str) -> None:
    rows = execute_query(
        "SELECT COUNT(*) AS cnt FROM INFORMATION_SCHEMA.COLUMNS "
        "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = %s AND COLUMN_NAME = %s",
        (table, col),
    )
    if rows[0]["cnt"] == 0:
        execute_write(f"ALTER TABLE `{table}` ADD COLUMN `{col}` {definition}")


# Tentar aplicar migrações, mas não travar o servidor se o banco estiver offline
try:
    _add_col_if_missing("Colaborador",       "rg",           "VARCHAR(20) DEFAULT NULL")
    _add_col_if_missing("Colaborador",       "orgaoEmissor", "VARCHAR(20) DEFAULT NULL")
    _add_col_if_missing("Colaborador",       "estadoEmissor","CHAR(2)     DEFAULT NULL")
    _add_col_if_missing("Educador",          "rg",           "VARCHAR(20) DEFAULT NULL")
    _add_col_if_missing("Educador",          "orgaoEmissor", "VARCHAR(20) DEFAULT NULL")
    _add_col_if_missing("Educador",          "estadoEmissor","CHAR(2)     DEFAULT NULL")
    _add_col_if_missing("FormacaoAcademica", "grau",         "VARCHAR(30) DEFAULT NULL")
    _add_col_if_missing("Educador",          "periodos",     "TEXT        DEFAULT NULL")
    print("[OK] [STARTUP] Migracoes de schema verificadas")
except Exception as e:
    print(f"[WARN] [STARTUP] Banco indisponivel - migracoes de schema ignoradas: {type(e).__name__}")

# Garante que idStatus da tabela Educador seja VARCHAR para suportar 'Ativo'/'Inativo'
try:
    rows = execute_query(
        "SELECT DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS "
        "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Educador' AND COLUMN_NAME = 'idStatus'"
    )
    if rows and rows[0].get("DATA_TYPE", "").upper() in ("TINYINT", "INT", "SMALLINT"):
        execute_write("ALTER TABLE `Educador` MODIFY COLUMN `idStatus` VARCHAR(20) NOT NULL DEFAULT 'Ativo'")
        execute_write("UPDATE `Educador` SET `idStatus` = CASE WHEN `idStatus` = '1' THEN 'Ativo' WHEN `idStatus` = '0' THEN 'Inativo' ELSE 'Ativo' END")
except Exception as _e:
    print(f"[colaborador_service] AVISO: migração idStatus Educador — {_e}")

# Tabela de vínculo educador ↔ disciplinas (M:N)
try:
    execute_write(
        """
        CREATE TABLE IF NOT EXISTS EducadorDisciplina (
            id          INT          NOT NULL AUTO_INCREMENT,
            idMatricula VARCHAR(30)  NOT NULL,
            idDisciplina INT         NOT NULL,
            PRIMARY KEY (id),
            UNIQUE KEY uq_edu_disc (idMatricula, idDisciplina)
        )
        """
    )
except Exception as _e:
    print(f"[colaborador_service] AVISO: não foi possível criar tabela EducadorDisciplina — {type(_e).__name__}")


# ── helpers ───────────────────────────────────────────────────────────────────

def _calcular_idade(data_nascimento: str | None) -> int | None:
    if not data_nascimento:
        return None
    try:
        parte = str(data_nascimento)[:10]
        ano, mes, dia = map(int, parte.split("-"))
        hoje = date.today()
        return hoje.year - ano - ((hoje.month, hoje.day) < (mes, dia))
    except Exception:
        return None


def _senha_placeholder(id_matricula: str) -> str:
    token = secrets.token_hex(32)
    return hashlib.sha256(f"{id_matricula}:{token}".encode()).hexdigest()


def _format_list_item(row: dict, idx: int) -> dict:
    """Formata item da lista considerando cargo para determinar tipo."""
    cargo = row.get("cargo") or ""
    # Se o cargo é "Gestor", o tipo é gestor, senão é colaborador
    tipo_usuario = "gestor" if cargo.lower() == "gestor" else "colaborador"
    
    return {
        "id": idx,
        "idMatricula": row["idMatricula"],
        "matriculaFuncional": row["idMatricula"],
        "nomeCompleto": row.get("nomeCompleto") or "",
        "cargo": cargo,
        "tipo": tipo_usuario,
        "status": "ativo" if str(row.get("idStatus", "")).lower() in ("1", "ativo") else "inativo",
        "email": row.get("email") or "",
    }


def _format_detail(row: dict, formacoes: list[dict], end: dict, tipo: str) -> dict:
    """Formata detalhes considerando cargo para determinar tipo."""
    cargo = row.get("cargo") or ""
    # Se o cargo é "Gestor", o tipo é gestor, senão é colaborador
    tipo_calculado = "gestor" if cargo.lower() == "gestor" else "colaborador"
    
    return {
        "idMatricula": row["idMatricula"],
        "matriculaFuncional": row["idMatricula"],
        "nomeCompleto": row.get("nomeCompleto"),
        "nacionalidade": row.get("nacionalidade"),
        "genero": row.get("genero"),
        "corRaca": row.get("cor"),
        "dataNascimento": str(row["dataNascimento"]) if row.get("dataNascimento") else None,
        "idade": row.get("idade"),
        "telefone": row.get("telefone"),
        "email": row.get("email"),
        "rg": row.get("rg"),
        "orgaoEmissor": row.get("orgaoEmissor"),
        "estadoEmissor": row.get("estadoEmissor"),
        "cpf": row.get("cpf"),
        # Colaborador usa cargo/departamento
        "cargo": cargo,
        "departamento": row.get("departamento"),
        "disciplinaLecionada": row.get("cargo") if tipo == "educador" else None,
        "turno": row.get("departamento") if tipo == "educador" else None,
        "tipo": tipo_calculado,
        "status": "ativo" if str(row.get("idStatus", "")).lower() in ("1", "ativo") else "inativo",
        "endereco": {
            "cep": end.get("cep", ""),
            "logradouro": end.get("logradouro", ""),
            "numero": end.get("numero", ""),
            "complemento": end.get("complemento", ""),
            "bairro": end.get("bairro", ""),
            "uf": end.get("uf", ""),
            "cidade": end.get("cidade", ""),
        },
        "formacoes": [
            {
                "id": f.get("idFormacao"),
                "grau": f.get("grau") or "",
                "instituicao": f.get("instituicao") or "",
                "areaEstudo": f.get("areaConhecimento") or "",
                "dataInicio": str(f["dataInicio"]) if f.get("dataInicio") else "",
                "dataTermino": str(f["dataFim"]) if f.get("dataFim") else "",
                "situacao": f.get("status") or "concluido",
            }
            for f in formacoes
        ],
    }


def _upsert_endereco(id_matricula: str, tipo_usuario: str, end: dict) -> None:
    execute_write(
        """
        INSERT INTO Endereco
            (idMatricula, tipoUsuario, cep, logradouro, numero,
             complemento, bairro, uf, cidade)
        VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s)
        ON DUPLICATE KEY UPDATE
            cep=%s, logradouro=%s, numero=%s, complemento=%s,
            bairro=%s, uf=%s, cidade=%s
        """,
        (
            id_matricula, tipo_usuario,
            end["cep"], end.get("logradouro"), end.get("numero", ""),
            end.get("complemento"), end.get("bairro"), end.get("uf", ""), end.get("cidade", ""),
            end["cep"], end.get("logradouro"), end.get("numero", ""),
            end.get("complemento"), end.get("bairro"), end.get("uf", ""), end.get("cidade", ""),
        ),
    )


# ── endpoints ─────────────────────────────────────────────────────────────────

def listar_colaboradores() -> list[dict]:
    """Retorna apenas colaboradores e gestores cadastrados (exclui educadores)."""
    cols = list(ColaboradorModel.find_all())
    cols.sort(key=lambda r: (r.get("nomeCompleto") or "").upper())
    return [_format_list_item(r, i + 1) for i, r in enumerate(cols)]


def buscar_colaborador(id_matricula: str) -> dict | None:
    row = ColaboradorModel.find_by_id(id_matricula)
    tipo = "colaborador"
    if not row:
        row = EducadorModel.find_by_id(id_matricula)
        tipo = "educador"
    if not row:
        return None
    ends = EnderecoModel.find_by_matricula(id_matricula)
    end = next((e for e in ends if e.get("tipoUsuario") == tipo), ends[0] if ends else {})
    formacoes = FormacaoAcademicaModel.find_by_matricula(id_matricula)
    return _format_detail(row, formacoes, end, tipo)


def gerar_proxima_matricula() -> dict:
    """
    Gera a próxima matrícula funcional sequencial no formato COLAAAA#### 
    onde AAAA = ano atual e #### = sequencial de 4 dígitos.
    """
    ano_atual = datetime.now().year
    prefixo = f"COL{ano_atual}"
    
    # Busca a última matrícula com o prefixo do ano atual
    query = """
        SELECT idMatricula FROM Colaborador 
        WHERE idMatricula LIKE %s 
        ORDER BY idMatricula DESC 
        LIMIT 1
    """
    resultado = execute_query(query, (f"{prefixo}%",))
    
    if resultado and len(resultado) > 0:
        ultima = resultado[0].get("idMatricula", "")
        # Extrai o número sequencial
        try:
            sequencial = int(ultima.replace(prefixo, ""))
            proximo = sequencial + 1
        except (ValueError, IndexError):
            proximo = 1
    else:
        proximo = 1
    
    # Formata com 4 dígitos
    proxima_matricula = f"{prefixo}{proximo:04d}"
    
    return {"proximaMatricula": proxima_matricula}


def criar_colaborador(body: str | dict) -> dict:
    data = json.loads(body) if isinstance(body, str) else body

    id_matricula = data.get("matriculaFuncional") or data.get("idMatricula")
    if not id_matricula:
        raise ValueError("matriculaFuncional é obrigatório")
    if not data.get("nomeCompleto"):
        raise ValueError("nomeCompleto é obrigatório")
    if not data.get("email"):
        raise ValueError("email é obrigatório")
    if not data.get("cpf"):
        raise ValueError("cpf é obrigatório")
    if not data.get("cargo"):
        raise ValueError("cargo é obrigatório")
    if not data.get("departamento"):
        raise ValueError("departamento é obrigatório")

    data["idMatricula"] = id_matricula
    data["cor"] = data.get("corRaca") or data.get("cor")
    data["idade"] = _calcular_idade(data.get("dataNascimento"))

    if ColaboradorModel.find_by_id(id_matricula):
        raise ValueError(f"Matrícula {id_matricula} já cadastrada")

    ColaboradorModel.create(data)

    end = data.get("endereco") or {}
    if end.get("cep"):
        _upsert_endereco(id_matricula, "colaborador", end)

    FormacaoAcademicaModel.replace_all(id_matricula, "colaborador", data.get("formacoes") or [])
    LoginModel.create(id_matricula, data["email"], _senha_placeholder(id_matricula))

    # Token + e-mail de boas-vindas
    try:
        token = secrets.token_urlsafe(32)
        expiracao = (datetime.utcnow() + timedelta(hours=48)).strftime("%Y-%m-%d %H:%M:%S")
        LoginModel.save_token(id_matricula, token, expiracao)
        email_service.enviar_boas_vindas(
            destinatario=data["email"],
            nome=data["nomeCompleto"],
            token=token,
            id_matricula=id_matricula,
            tipo="colaborador",
            matricula_funcional=id_matricula,
        )
    except Exception as exc:
        print(f"[colaborador_service] AVISO: e-mail não enviado — {exc}")

    return buscar_colaborador(id_matricula)


def atualizar_colaborador(id_matricula: str, body: str | dict) -> dict:
    data = json.loads(body) if isinstance(body, str) else body

    if not ColaboradorModel.find_by_id(id_matricula):
        raise ValueError(f"Colaborador {id_matricula} não encontrado")

    data["cor"] = data.get("corRaca") or data.get("cor")
    data["idade"] = _calcular_idade(data.get("dataNascimento"))

    ColaboradorModel.update(id_matricula, data)

    end = data.get("endereco") or {}
    if end.get("cep"):
        _upsert_endereco(id_matricula, "colaborador", end)

    FormacaoAcademicaModel.replace_all(id_matricula, "colaborador", data.get("formacoes") or [])
    return buscar_colaborador(id_matricula)


def atualizar_status_colaborador(id_matricula: str, status: str) -> dict:
    if status not in ("ativo", "inativo"):
        raise ValueError("status deve ser 'ativo' ou 'inativo'")
    ativo = 1 if status == "ativo" else 0

    if ColaboradorModel.find_by_id(id_matricula):
        ColaboradorModel.set_status(id_matricula, ativo)
    elif EducadorModel.find_by_id(id_matricula):
        EducadorModel.set_status(id_matricula, ativo)
    else:
        raise ValueError(f"Registro {id_matricula} não encontrado")

    return {"idMatricula": id_matricula, "status": status}


def excluir_colaborador(id_matricula: str) -> dict:
    if ColaboradorModel.find_by_id(id_matricula):
        ColaboradorModel.delete_by_matricula(id_matricula)
    elif EducadorModel.find_by_id(id_matricula):
        EducadorModel.delete_by_matricula(id_matricula)
    else:
        raise ValueError(f"Registro {id_matricula} não encontrado")
    return {"deleted": id_matricula}
