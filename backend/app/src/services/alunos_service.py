"""
Serviço de alunos — CRUD completo.
"""

import json
from app.src.models.models import AlunoModel, NotaModel, FrequenciaModel


def listar_alunos(turma_id: int | None = None) -> list[dict]:
    if turma_id:
        return AlunoModel.find_by_turma(turma_id)
    return AlunoModel.find_all()


def buscar_aluno(aluno_id: int) -> dict | None:
    return AlunoModel.find_by_id(aluno_id)


def criar_aluno(body: str | dict) -> dict:
    data = json.loads(body) if isinstance(body, str) else body
    campos = ["nome", "email", "matricula", "turma_id"]
    for c in campos:
        if c not in data:
            raise ValueError(f"Campo obrigatório ausente: {c}")
    aluno_id = AlunoModel.create(
        data["nome"], data["email"], data["matricula"], data["turma_id"]
    )
    return {"id": aluno_id, **data}


def atualizar_aluno(aluno_id: int, body: str | dict) -> dict:
    data = json.loads(body) if isinstance(body, str) else body
    AlunoModel.update(aluno_id, data["nome"], data["email"], data["turma_id"])
    return {"id": aluno_id, **data}


def remover_aluno(aluno_id: int) -> dict:
    AlunoModel.delete(aluno_id)
    return {"deleted": aluno_id}


def notas_do_aluno(aluno_id: int) -> list[dict]:
    return NotaModel.find_by_aluno(aluno_id)


def frequencia_do_aluno(aluno_id: int) -> list[dict]:
    return FrequenciaModel.find_by_aluno(aluno_id)
