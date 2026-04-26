"""
Serviço de Educadores — CRUD completo.

Educadores são armazenados na tabela Educador.
Reutiliza helpers de colaborador_service.
"""
from __future__ import annotations

import json
import secrets
from datetime import datetime, timedelta

from app.src.adapters.db_adapter import execute_query, execute_write
from app.src.models.models import (
    EducadorModel,
    EducadorDisciplinaModel,
    EnderecoModel,
    FormacaoAcademicaModel,
    LoginModel,
)
from app.src.services import email_service
from app.src.services.colaborador_service import (
    _calcular_idade,
    _format_detail,
    _senha_placeholder,
    _upsert_endereco,
)


def criar_educador(body: str | dict) -> dict:
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

    data["idMatricula"] = id_matricula
    data["cor"] = data.get("corRaca") or data.get("cor")
    data["idade"] = _calcular_idade(data.get("dataNascimento"))

    if EducadorModel.find_by_id(id_matricula):
        raise ValueError(f"Matrícula {id_matricula} já cadastrada")

    EducadorModel.create(data)

    end = data.get("endereco") or {}
    if end.get("cep"):
        _upsert_endereco(id_matricula, "educador", end)

    FormacaoAcademicaModel.replace_all(id_matricula, "educador", data.get("formacoes") or [])
    LoginModel.create(id_matricula, data["email"], _senha_placeholder(id_matricula))

    # Vínculos de disciplinas
    ids_disc = [int(x) for x in (data.get("disciplinas") or []) if str(x).isdigit()]
    print(f"[educador_service] disciplinas recebidas: {data.get('disciplinas')} → ids_disc: {ids_disc}")
    EducadorDisciplinaModel.replace_all(id_matricula, ids_disc)
    print(f"[educador_service] EducadorDisciplina salvo para {id_matricula}: {ids_disc}")

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
            tipo="educador",
        )
    except Exception as exc:
        print(f"[educador_service] AVISO: e-mail não enviado — {exc}")

    return buscar_educador(id_matricula)


def buscar_educador(id_matricula: str) -> dict | None:
    row = EducadorModel.find_by_id(id_matricula)
    if not row:
        return None
    ends = EnderecoModel.find_by_matricula(id_matricula)
    end = next((e for e in ends if e.get("tipoUsuario") == "educador"), ends[0] if ends else {})
    formacoes = FormacaoAcademicaModel.find_by_matricula(id_matricula)

    detail = _format_detail(row, formacoes, end, "educador")

    # Enriquece com periodos e disciplinas
    try:
        detail["periodos"] = json.loads(row["periodos"]) if row.get("periodos") else []
    except Exception:
        detail["periodos"] = []

    ids_disc = EducadorDisciplinaModel.find_by_matricula(id_matricula)
    detail["disciplinas"] = ids_disc

    return detail


def atualizar_educador(id_matricula: str, body: str | dict) -> dict:
    data = json.loads(body) if isinstance(body, str) else body

    if not EducadorModel.find_by_id(id_matricula):
        raise ValueError(f"Educador {id_matricula} não encontrado")

    data["cor"] = data.get("corRaca") or data.get("cor")
    data["idade"] = _calcular_idade(data.get("dataNascimento"))

    EducadorModel.update(id_matricula, data)

    end = data.get("endereco") or {}
    if end.get("cep"):
        _upsert_endereco(id_matricula, "educador", end)

    FormacaoAcademicaModel.replace_all(id_matricula, "educador", data.get("formacoes") or [])

    ids_disc = [int(x) for x in (data.get("disciplinas") or []) if str(x).isdigit()]
    EducadorDisciplinaModel.replace_all(id_matricula, ids_disc)

    return buscar_educador(id_matricula)
