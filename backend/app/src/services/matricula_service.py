"""
Serviço de matrícula — operações completas.

Fluxo de criação (POST /matricula):
  1. Valida campos obrigatórios
  2. Verifica se idMatricula do educando já existe
  3. Em transação atômica:
       a. Insere educando em EducandoResponsavel
       b. Insere endereço do educando em Endereco
       c. Insere Login (placeholder de senha) para o educando
       d. Insere ou reutiliza responsável (busca por CPF)
       e. Insere endereço do responsável em Endereco
       f. Insere Login (placeholder) para o responsável
       g. Registra vínculo em HistoricoEscolar
"""
from __future__ import annotations

import hashlib
import json
import os
import secrets
from datetime import datetime, timedelta

from app.src.adapters.db_adapter import execute_query, execute_transaction
from app.src.models.models import (
    EducandoResponsavelModel,
    EnderecoModel,
    HistoricoEscolarModel,
    LoginModel,
    TurmaModel,
)


# ── helpers ───────────────────────────────────────────────────────────────────

def _calcular_idade(data_nascimento: str | None) -> int | None:
    """Retorna idade em anos a partir de uma string 'YYYY-MM-DD'."""
    if not data_nascimento:
        return None
    from datetime import date
    try:
        ano, mes, dia = map(int, data_nascimento.split("-"))
        hoje = date.today()
        return hoje.year - ano - ((hoje.month, hoje.day) < (mes, dia))
    except Exception:
        return None


def _senha_placeholder(id_matricula: str) -> str:
    """
    Hash SHA-256 de um token aleatório para senha inicial.
    O usuário nunca usará esta senha diretamente — ela será substituída
    quando o educando/responsável criar a senha via link enviado por e-mail.
    """
    token = secrets.token_hex(32)
    return hashlib.sha256(f"{id_matricula}:{token}".encode()).hexdigest()


def _validar_campos(body: dict) -> list[str]:
    erros: list[str] = []

    educando = body.get("educando") or {}
    responsavel = body.get("responsavel") or {}
    escolar = body.get("dadosEscolares") or {}

    # Educando
    for campo in ("idMatricula", "nomeCompleto", "email", "cpf", "tipoUsuario"):
        if not educando.get(campo):
            erros.append(f"educando.{campo} é obrigatório")

    end_aluno = educando.get("endereco") or {}
    for campo in ("cep", "numero", "uf", "cidade"):
        if not end_aluno.get(campo):
            erros.append(f"educando.endereco.{campo} é obrigatório")

    # Responsável
    for campo in ("nomeCompleto", "email", "cpf", "tipoUsuario"):
        if not responsavel.get(campo):
            erros.append(f"responsavel.{campo} é obrigatório")

    # Dados Escolares
    for campo in ("anoLetivo", "serie", "periodo", "codTurma"):
        if not escolar.get(campo):
            erros.append(f"dadosEscolares.{campo} é obrigatório")

    return erros


# ── endpoints ─────────────────────────────────────────────────────────────────

def criar_matricula(body: str | dict) -> dict:
    data = json.loads(body) if isinstance(body, str) else body

    erros = _validar_campos(data)
    if erros:
        raise ValueError("; ".join(erros))

    educando  = data["educando"]
    resp      = data["responsavel"]
    escolar   = data["dadosEscolares"]

    id_educando  = educando["idMatricula"]
    id_resp      = resp.get("idMatricula") or ""

    # Verifica duplicidade do educando
    if EducandoResponsavelModel.find_by_id(id_educando):
        raise ValueError(f"Matrícula {id_educando} já cadastrada")

    # Resolve turma
    turma = TurmaModel.find_by_cod_ano(escolar["codTurma"], str(escolar["anoLetivo"]))
    if not turma:
        raise ValueError(
            f"Turma {escolar['codTurma']} não encontrada para o ano {escolar['anoLetivo']}"
        )
    id_turma = turma["idTurma"]

    # Verifica capacidade
    ocupadas = HistoricoEscolarModel.count_by_turma(id_turma)
    if ocupadas >= turma["qldVagas"]:
        raise ValueError(f"Turma {escolar['codTurma']} não possui vagas disponíveis")

    # Resolve responsável (pode já existir pelo CPF)
    resp_existente = EducandoResponsavelModel.find_by_cpf(resp["cpf"])

    # Monta educando
    educando_data = {
        "idMatricula":    id_educando,
        "nomeCompleto":   educando["nomeCompleto"],
        "nacionalidade":  educando.get("nacionalidade"),
        "genero":         educando.get("genero"),
        "cor":            educando.get("cor"),
        "dataNascimento": educando.get("dataNascimento"),
        "idade":          _calcular_idade(educando.get("dataNascimento")),
        "telefone":       educando.get("telefone"),
        "email":          educando["email"],
        "cpf":            educando.get("cpf"),
        "rg":             educando.get("rg"),
        "orgaoEmissor":   educando.get("orgaoEmissor"),
        "estadoEmissor":  educando.get("estadoEmissor"),
        "idStatus":       "Ativa",
        "tipoUsuario":    "educando",
    }

    end_educando_data = {
        **( educando.get("endereco") or {} ),
        "idMatricula": id_educando,
        "tipoUsuario": "educando",
    }

    # Monta responsável
    resp_data = {
        "idMatricula":    id_resp,
        "nomeCompleto":   resp["nomeCompleto"],
        "nacionalidade":  resp.get("nacionalidade"),
        "genero":         resp.get("genero"),
        "cor":            resp.get("cor"),
        "dataNascimento": resp.get("dataNascimento"),
        "idade":          _calcular_idade(resp.get("dataNascimento")),
        "telefone":       resp.get("telefone"),
        "email":          resp["email"],
        "cpf":            resp.get("cpf"),
        "rg":             resp.get("rg"),
        "orgaoEmissor":   resp.get("orgaoEmissor"),
        "estadoEmissor":  resp.get("estadoEmissor"),
        "idStatus":       "Ativa",
        "tipoUsuario":    "responsavel",
    }

    end_resp_data = {
        **( resp.get("endereco") or educando.get("endereco") or {} ),
        "idMatricula": id_resp,
        "tipoUsuario": "responsavel",
    }

    # Monta steps da transação atômica
    steps: list[tuple[str, tuple]] = []

    # 1. Educando
    steps.append((
        """INSERT INTO EducandoResponsavel
               (idMatricula, nomeCompleto, nacionalidade, genero, cor,
                dataNascimento, idade, telefone, email, cpf,
                rg, orgaoEmissor, estadoEmissor, idStatus, tipoUsuario)
           VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)""",
        (
            educando_data["idMatricula"], educando_data["nomeCompleto"],
            educando_data["nacionalidade"], educando_data["genero"],
            educando_data["cor"], educando_data["dataNascimento"],
            educando_data["idade"], educando_data["telefone"],
            educando_data["email"], educando_data["cpf"],
            educando_data["rg"], educando_data["orgaoEmissor"],
            educando_data["estadoEmissor"], educando_data["idStatus"],
            educando_data["tipoUsuario"],
        ),
    ))

    # 2. Endereço do educando
    steps.append((
        """INSERT INTO Endereco
               (idMatricula, tipoUsuario, cep, logradouro, numero,
                complemento, bairro, uf, cidade)
           VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s)
           ON DUPLICATE KEY UPDATE
               cep=VALUES(cep), logradouro=VALUES(logradouro),
               numero=VALUES(numero), complemento=VALUES(complemento),
               bairro=VALUES(bairro), uf=VALUES(uf), cidade=VALUES(cidade)""",
        (
            end_educando_data["idMatricula"], end_educando_data["tipoUsuario"],
            end_educando_data.get("cep"), end_educando_data.get("logradouro"),
            end_educando_data.get("numero"), end_educando_data.get("complemento"),
            end_educando_data.get("bairro"), end_educando_data.get("uf"),
            end_educando_data.get("cidade"),
        ),
    ))

    # 3. Login do educando (senha temporária — será redefinida via link)
    steps.append((
        "INSERT IGNORE INTO Login (idMatricula, email, senha) VALUES (%s, %s, %s)",
        (id_educando, educando["email"], _senha_placeholder(id_educando)),
    ))

    # 4. Responsável (apenas se não existir)
    if not resp_existente:
        if not id_resp:
            raise ValueError("responsavel.idMatricula é obrigatório para novo responsável")
        steps.append((
            """INSERT INTO EducandoResponsavel
                   (idMatricula, nomeCompleto, nacionalidade, genero, cor,
                    dataNascimento, idade, telefone, email, cpf,
                    rg, orgaoEmissor, estadoEmissor, idStatus, tipoUsuario)
               VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)""",
            (
                resp_data["idMatricula"], resp_data["nomeCompleto"],
                resp_data["nacionalidade"], resp_data["genero"],
                resp_data["cor"], resp_data["dataNascimento"],
                resp_data["idade"], resp_data["telefone"],
                resp_data["email"], resp_data["cpf"],
                resp_data["rg"], resp_data["orgaoEmissor"],
                resp_data["estadoEmissor"], resp_data["idStatus"],
                resp_data["tipoUsuario"],
            ),
        ))
        # 5. Endereço do responsável
        steps.append((
            """INSERT INTO Endereco
                   (idMatricula, tipoUsuario, cep, logradouro, numero,
                    complemento, bairro, uf, cidade)
               VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s)
               ON DUPLICATE KEY UPDATE
                   cep=VALUES(cep), logradouro=VALUES(logradouro),
                   numero=VALUES(numero), complemento=VALUES(complemento),
                   bairro=VALUES(bairro), uf=VALUES(uf), cidade=VALUES(cidade)""",
            (
                end_resp_data["idMatricula"], end_resp_data["tipoUsuario"],
                end_resp_data.get("cep"), end_resp_data.get("logradouro"),
                end_resp_data.get("numero"), end_resp_data.get("complemento"),
                end_resp_data.get("bairro"), end_resp_data.get("uf"),
                end_resp_data.get("cidade"),
            ),
        ))
        # 6. Login do responsável
        steps.append((
            "INSERT IGNORE INTO Login (idMatricula, email, senha) VALUES (%s, %s, %s)",
            (id_resp, resp["email"], _senha_placeholder(id_resp)),
        ))

    # 7. HistoricoEscolar — vínculo educando ↔ turma ↔ responsável
    id_resp_final = id_resp if not resp_existente else resp_existente["idMatricula"]
    steps.append((
        """INSERT INTO HistoricoEscolar
               (idMatricula, idTurma, serie, anoLetivo, situacao, idResponsavel)
           VALUES (%s, %s, %s, %s, 'cursando', %s)""",
        (id_educando, id_turma, escolar["serie"], str(escolar["anoLetivo"]), id_resp_final),
    ))

    try:
        execute_transaction(steps)
    except Exception as exc:
        # Extrai a mensagem legível de erros do PyMySQL (args = (code, message))
        args = getattr(exc, 'args', ())
        msg = args[1] if len(args) >= 2 else str(exc)
        raise ValueError(msg) from exc

    # ── Tokens de criação de senha e envio de e-mail ─────────────────────────
    expiracao = (datetime.utcnow() + timedelta(hours=48)).strftime("%Y-%m-%d %H:%M:%S")

    from app.src.services import email_service  # import tardio evita ciclo

    token_educando = secrets.token_urlsafe(32)
    LoginModel.save_token(id_educando, token_educando, expiracao)
    email_service.enviar_boas_vindas(
        destinatario=educando["email"],
        nome=educando["nomeCompleto"],
        token=token_educando,
        id_matricula=id_educando,
        tipo="educando",
    )

    id_resp_final = id_resp if not resp_existente else resp_existente["idMatricula"]
    token_resp = secrets.token_urlsafe(32)
    LoginModel.save_token(id_resp_final, token_resp, expiracao)
    email_service.enviar_boas_vindas(
        destinatario=resp["email"],
        nome=resp["nomeCompleto"],
        token=token_resp,
        id_matricula=id_resp_final,
        tipo="responsavel",
    )
    # ─────────────────────────────────────────────────────────────────────────

    return {
        "idMatricula":    id_educando,
        "idMatriculaResp": id_resp_final,
        "idTurma":        id_turma,
        "nomeEducando":   educando["nomeCompleto"],
        "emailEducando":  educando["email"],
        "emailResponsavel": resp["email"],
        "responsavelExistente": bool(resp_existente),
    }


def listar_turmas(
    ano_letivo: str | None = None,
    serie: str | None = None,
    periodo: str | None = None,
) -> list[dict]:
    """Retorna turmas com contagem de vagas ocupadas."""
    turmas = TurmaModel.find_filtered(ano_letivo, serie, periodo)
    result = []
    for t in turmas:
        ocupadas = HistoricoEscolarModel.count_by_turma(t["idTurma"])
        t["vagasOcupadas"]  = list(range(1, ocupadas + 1))
        t["vagasDisponiveis"] = max(0, t["qldVagas"] - ocupadas)
        result.append(t)
    return result


def listar_series(ano_letivo: str) -> list[str]:
    return TurmaModel.find_series_by_ano(ano_letivo)


def listar_periodos(ano_letivo: str, serie: str) -> list[str]:
    return TurmaModel.find_periodos_by_ano_serie(ano_letivo, serie)


# ── helpers de formatação ──────────────────────────────────────────────────────

def _endereco_dict(enderecos: list[dict], tipo: str) -> dict:
    for e in enderecos:
        if e.get("tipoUsuario") == tipo:
            return {
                "cep":         e.get("cep", ""),
                "logradouro":  e.get("logradouro", ""),
                "numero":      e.get("numero", ""),
                "complemento": e.get("complemento", ""),
                "bairro":      e.get("bairro", ""),
                "cidade":      e.get("cidade", ""),
                "uf":          e.get("uf", ""),
            }
    return {"cep":"","logradouro":"","numero":"","complemento":"","bairro":"","cidade":"","uf":""}


def _format_record(row: dict, end_edu: dict, resp: dict | None, end_resp: dict, historico: list[dict]) -> dict:
    """Monta o dicionário no formato MatriculaRegistro esperado pelo frontend."""
    return {
        "id":             int(row.get("id") or 0),
        "idMatricula":    row["idMatricula"],
        "status":         _map_status(row.get("status")),
        "dataMatricula":  str(row.get("dataMatricula") or ""),
        # Educando
        "alunoNome":        row.get("alunoNome") or "",
        "alunoNascimento":  str(row.get("alunoNascimento") or ""),
        "alunoIdade":       int(row.get("alunoIdade") or 0),
        "alunoGenero":      row.get("alunoGenero") or "",
        "alunoCorRaca":     row.get("alunoCorRaca") or "",
        "alunoCpf":         row.get("alunoCpf") or "",
        "alunoRg":          row.get("alunoRg") or "",
        "alunoEmail":       row.get("alunoEmail") or "",
        "alunoCelular":     "",
        "alunoTelefone":    row.get("alunoTelefone") or "",
        "alunoEndereco":    end_edu,
        # Responsável
        "respNome":       resp.get("nomeCompleto", "") if resp else "",
        "respNascimento": str(resp.get("dataNascimento", "") or "") if resp else "",
        "respIdade":      int(resp.get("idade") or 0) if resp else 0,
        "respGenero":     resp.get("genero", "") if resp else "",
        "respCorRaca":    resp.get("cor", "") if resp else "",
        "respCpf":        resp.get("cpf", "") if resp else "",
        "respRg":         resp.get("rg", "") if resp else "",
        "respEmail":      resp.get("email", "") if resp else "",
        "respCelular":    "",
        "respTelefone":   resp.get("telefone", "") if resp else "",
        "respParentesco": "",
        "respEndereco":   end_resp,
        # Escolar
        "serie":         row.get("serie") or "",
        "turma":         row.get("turma") or "",
        "codigoTurma":   row.get("codigoTurma") or "",
        "anoLetivo":     str(row.get("anoLetivo") or ""),
        "dataInicio":    str(row.get("dataInicio") or ""),
        "dataTermino":   str(row.get("dataTermino") or ""),
        "periodo":       row.get("periodo") or "",
        "sala":          row.get("sala") or "",
        # Histórico
        "historico": [
            {
                "anoLetivo":  str(h.get("anoLetivo") or ""),
                "serie":      h.get("serie") or "",
                "turma":      h.get("codTurma") or "",
                "sala":       h.get("sala") or "",
                "periodo":    h.get("periodo") or "",
                "situacao":   _map_situacao(h.get("situacao")),
                "mediaGeral": None,
                "frequencia": None,
                "disciplinas": [],
            }
            for h in historico
        ],
    }


def _map_situacao(s: str | None) -> str:
    mapa = {
        "aprovado":    "Aprovado",
        "reprovado":   "Reprovado",
        "transferido": "Transferido",
        "cursando":    "Em andamento",
    }
    return mapa.get(s or "", "Em andamento")


def _map_status(val) -> str:
    """Converte idStatus (TINYINT 0/1 ou ENUM string) para o label do frontend."""
    if val is None:
        return "Ativa"
    if isinstance(val, int):
        return "Ativa" if val == 1 else "Abandonada"
    return str(val)  # já é 'Ativa', 'Concluída', 'Abandonada'


# ── endpoints ──────────────────────────────────────────────────────────────────

def listar_matriculas() -> list[dict]:
    rows = EducandoResponsavelModel.find_lista()
    if not rows:
        return []

    # Coleta IDs em bulk para minimizar queries
    edu_ids  = [r["idMatricula"] for r in rows]
    resp_ids = list({r["idResponsavel"] for r in rows if r.get("idResponsavel")})

    # Endereços dos educandos e responsáveis em dois SELECTs
    from app.src.adapters.db_adapter import execute_query as _q
    def _bulk_enderecos(ids: list) -> list[dict]:
        if not ids:
            return []
        ph = ",".join(["%s"] * len(ids))
        return _q(f"SELECT * FROM Endereco WHERE idMatricula IN ({ph})", tuple(ids))

    def _bulk_responsaveis(ids: list) -> list[dict]:
        if not ids:
            return []
        ph = ",".join(["%s"] * len(ids))
        return _q(
            f"SELECT idMatricula, nomeCompleto, dataNascimento, idade, genero, cor, "
            f"cpf, rg, email, telefone FROM EducandoResponsavel WHERE idMatricula IN ({ph})",
            tuple(ids),
        )

    def _bulk_historico(ids: list) -> list[dict]:
        if not ids:
            return []
        ph = ",".join(["%s"] * len(ids))
        return _q(
            f"""SELECT h.*, t.codTurma, t.nomeTurma, t.periodo,
                       DATE_FORMAT(t.dataInicio,'%%Y-%%m-%%d') AS dataInicio,
                       DATE_FORMAT(t.dataFim,'%%Y-%%m-%%d') AS dataTermino,
                       s.nomeSala AS sala
                FROM HistoricoEscolar h
                LEFT JOIN Turmas t ON t.idTurma = h.idTurma
                LEFT JOIN Salas  s ON s.idSala  = t.idSala
                WHERE h.idMatricula IN ({ph})
                ORDER BY h.anoLetivo DESC""",
            tuple(ids),
        )

    end_list  = _bulk_enderecos(edu_ids + resp_ids)
    resp_list = _bulk_responsaveis(resp_ids)
    hist_list = _bulk_historico(edu_ids)

    # Mapas de lookup
    end_map   = {}
    for e in end_list:
        end_map.setdefault(e["idMatricula"], []).append(e)

    resp_map = {r["idMatricula"]: r for r in resp_list}

    hist_map: dict[str, list[dict]] = {}
    for h in hist_list:
        hist_map.setdefault(h["idMatricula"], []).append(h)

    result = []
    for row in rows:
        edu_id    = row["idMatricula"]
        resp_id   = row.get("idResponsavel")
        resp_rec  = resp_map.get(resp_id) if resp_id else None
        edu_ends  = end_map.get(edu_id, [])
        resp_ends = end_map.get(resp_id, []) if resp_id else []
        historico = hist_map.get(edu_id, [])
        result.append(_format_record(
            row,
            _endereco_dict(edu_ends, "educando"),
            resp_rec,
            _endereco_dict(resp_ends, "responsavel"),
            historico,
        ))
    return result


def buscar_matricula(id_matricula: str) -> dict | None:
    rows = EducandoResponsavelModel.find_lista()
    row  = next((r for r in rows if r["idMatricula"] == id_matricula), None)
    if not row:
        return None

    edu_ends  = EnderecoModel.find_by_matricula(id_matricula)
    historico = HistoricoEscolarModel.find_by_matricula(id_matricula)

    resp_id  = row.get("idResponsavel")
    resp_rec = EducandoResponsavelModel.find_by_id(resp_id) if resp_id else None
    resp_ends = EnderecoModel.find_by_matricula(resp_id) if resp_id else []

    return _format_record(
        row,
        _endereco_dict(edu_ends, "educando"),
        resp_rec,
        _endereco_dict(resp_ends, "responsavel"),
        historico,
    )


def atualizar_status(id_matricula: str, novo_status: str) -> None:
    statuses_validos = {"Ativa", "Concluída", "Abandonada"}
    if novo_status not in statuses_validos:
        raise ValueError(f"Status inválido: {novo_status}")
    EducandoResponsavelModel.update_status(id_matricula, novo_status)


def atualizar_status_lote(ids: list[str], novo_status: str) -> int:
    statuses_validos = {"Ativa", "Concluída", "Abandonada"}
    if novo_status not in statuses_validos:
        raise ValueError(f"Status inválido: {novo_status}")
    if not ids:
        return 0
    from app.src.adapters.db_adapter import execute_write as _w
    ph = ",".join(["%s"] * len(ids))
    _w(
        f"UPDATE EducandoResponsavel SET idStatus = %s WHERE idMatricula IN ({ph})",
        (novo_status, *ids),
    )
    return len(ids)


def atualizar_matricula(id_matricula: str, body: str | dict) -> dict:
    data = json.loads(body) if isinstance(body, str) else body
    educando = data.get("educando") or {}
    responsavel = data.get("responsavel") or {}

    if educando:
        EducandoResponsavelModel.update_data(id_matricula, educando)
        if educando.get("endereco"):
            EnderecoModel.create({**educando["endereco"], "idMatricula": id_matricula, "tipoUsuario": "educando"})

    if responsavel and responsavel.get("idMatricula"):
        resp_id = responsavel["idMatricula"]
        EducandoResponsavelModel.update_data(resp_id, responsavel)
        if responsavel.get("endereco"):
            EnderecoModel.create({**responsavel["endereco"], "idMatricula": resp_id, "tipoUsuario": "responsavel"})

    result = buscar_matricula(id_matricula)
    return result or {"idMatricula": id_matricula}
