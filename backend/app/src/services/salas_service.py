"""
Serviço de Salas — CRUD completo.
"""
from __future__ import annotations

import json
from app.src.models.models import SalaModel


def listar_salas() -> list[dict]:
    """Retorna todas as salas com recursos parseados do JSON."""
    salas = SalaModel.find_all()
    for sala in salas:
        # Parse do campo recursos (JSON) para dicionário
        if sala.get("recursos"):
            try:
                sala["recursos"] = json.loads(sala["recursos"])
            except (json.JSONDecodeError, TypeError):
                sala["recursos"] = {}
        else:
            sala["recursos"] = {}
        
        # Renomear campos para o padrão do frontend
        sala["id"] = sala.pop("idSala", None)
        sala["codigo"] = sala.pop("codSala", "")
        sala["nome"] = sala.pop("nomeSala", "")
        sala["tipo"] = sala.pop("tipoSala", "")
        sala["observacoes"] = sala.pop("obsSala", "")
        
        # Normalizar status (disponivel/ocupada/manutencao -> ativa/inativa)
        status_original = sala.get("status", "")
        if status_original in ["disponivel", "ocupada"]:
            sala["status"] = "ativa"
        elif status_original == "manutencao":
            sala["status"] = "inativa"
        elif status_original not in ["ativa", "inativa"]:
            sala["status"] = "ativa"  # Default para ativa
        
        # Normalizar tipo (converter espaços para hífen e lowercase)
        tipo = sala.get("tipo", "")
        if tipo:
            # Mapeamento de tipos conhecidos
            tipo_map = {
                "Sala de Aula": "sala-de-aula",
                "sala de aula": "sala-de-aula",
                "Laboratório": "laboratorio",
                "Laboratorio": "laboratorio",
                "laboratório": "laboratorio",
                "laboratorio": "laboratorio",
                "Auditório": "auditorio",
                "Auditorio": "auditorio",
                "auditório": "auditorio",
                "auditorio": "auditorio",
                "Biblioteca": "biblioteca",
                "biblioteca": "biblioteca",
                "Quadra": "quadra",
                "quadra": "quadra",
                "Outro": "outro",
                "outro": "outro"
            }
            sala["tipo"] = tipo_map.get(tipo, tipo.lower().replace(" ", "-"))
        else:
            sala["tipo"] = "outro"
        
        # Extrair recursos do JSON
        recursos = sala.get("recursos", {})
        sala["projetor"] = recursos.get("projetor", False)
        sala["arCondicionado"] = recursos.get("arCondicionado", False)
        sala["ventilador"] = recursos.get("ventilador", False)
        sala["computadores"] = recursos.get("computadores", False)
        sala["acessibilidade"] = recursos.get("acessibilidade", False)
        
    return salas


def buscar_sala(id_sala: int) -> dict | None:
    """Retorna uma sala específica por ID."""
    sala = SalaModel.find_by_id(id_sala)
    if not sala:
        return None
    
    # Parse do campo recursos (JSON) para dicionário
    if sala.get("recursos"):
        try:
            sala["recursos"] = json.loads(sala["recursos"])
        except (json.JSONDecodeError, TypeError):
            sala["recursos"] = {}
    else:
        sala["recursos"] = {}
    
    # Renomear campos para o padrão do frontend
    sala["id"] = sala.pop("idSala", None)
    sala["codigo"] = sala.pop("codSala", "")
    sala["nome"] = sala.pop("nomeSala", "")
    sala["tipo"] = sala.pop("tipoSala", "")
    sala["observacoes"] = sala.pop("obsSala", "")
    
    # Normalizar status
    status_original = sala.get("status", "")
    if status_original in ["disponivel", "ocupada"]:
        sala["status"] = "ativa"
    elif status_original == "manutencao":
        sala["status"] = "inativa"
    elif status_original not in ["ativa", "inativa"]:
        sala["status"] = "ativa"
    
    # Normalizar tipo
    tipo = sala.get("tipo", "")
    if tipo:
        tipo_map = {
            "Sala de Aula": "sala-de-aula",
            "sala de aula": "sala-de-aula",
            "Laboratório": "laboratorio",
            "Laboratorio": "laboratorio",
            "laboratório": "laboratorio",
            "laboratorio": "laboratorio",
            "Auditório": "auditorio",
            "Auditorio": "auditorio",
            "auditório": "auditorio",
            "auditorio": "auditorio",
            "Biblioteca": "biblioteca",
            "biblioteca": "biblioteca",
            "Quadra": "quadra",
            "quadra": "quadra",
            "Outro": "outro",
            "outro": "outro"
        }
        sala["tipo"] = tipo_map.get(tipo, tipo.lower().replace(" ", "-"))
    else:
        sala["tipo"] = "outro"
    
    # Extrair recursos do JSON
    recursos = sala.get("recursos", {})
    sala["projetor"] = recursos.get("projetor", False)
    sala["arCondicionado"] = recursos.get("arCondicionado", False)
    sala["ventilador"] = recursos.get("ventilador", False)
    sala["computadores"] = recursos.get("computadores", False)
    sala["acessibilidade"] = recursos.get("acessibilidade", False)
    
    return sala


def criar_sala(body: str | dict) -> dict:
    """Cria uma nova sala."""
    data = json.loads(body) if isinstance(body, str) else body
    
    # Validar campos obrigatórios
    campos_obrigatorios = ["codigo", "nome", "tipo", "capacidade", "status"]
    for campo in campos_obrigatorios:
        if campo not in data or (not data[campo] and data[campo] != 0):
            raise ValueError(f"Campo obrigatório ausente ou vazio: {campo}")
    
    # Verificar se já existe sala com o mesmo código
    sala_existente = SalaModel.find_by_codigo(data["codigo"])
    if sala_existente:
        raise ValueError(f"Já existe uma sala com o código {data['codigo']}")
    
    # Montar objeto de recursos
    recursos = {
        "projetor": data.get("projetor", False),
        "arCondicionado": data.get("arCondicionado", False),
        "ventilador": data.get("ventilador", False),
        "computadores": data.get("computadores", False),
        "acessibilidade": data.get("acessibilidade", False),
    }
    
    # Montar dados para o banco
    sala_data = {
        "codSala": data["codigo"],
        "nomeSala": data["nome"],
        "tipoSala": data["tipo"],
        "status": data["status"],
        "capacidade": int(data["capacidade"]) if data.get("capacidade") else 0,
        "bloco": data.get("bloco", ""),
        "andar": data.get("andar", ""),
        "recursos": recursos,
        "obsSala": data.get("observacoes", ""),
    }
    
    id_sala = SalaModel.create(sala_data)
    
    return {
        "id": id_sala,
        "codigo": data["codigo"],
        "nome": data["nome"],
        "tipo": data["tipo"],
        "status": data["status"],
        "capacidade": int(data["capacidade"]) if data.get("capacidade") else 0,
        "bloco": data.get("bloco", ""),
        "andar": data.get("andar", ""),
        "projetor": recursos["projetor"],
        "arCondicionado": recursos["arCondicionado"],
        "ventilador": recursos["ventilador"],
        "computadores": recursos["computadores"],
        "acessibilidade": recursos["acessibilidade"],
        "observacoes": data.get("observacoes", ""),
    }


def atualizar_sala(id_sala: int, body: str | dict) -> dict:
    """Atualiza uma sala existente."""
    data = json.loads(body) if isinstance(body, str) else body
    
    # Verificar se a sala existe
    sala_existente = SalaModel.find_by_id(id_sala)
    if not sala_existente:
        raise ValueError(f"Sala com ID {id_sala} não encontrada")
    
    # Validar campos obrigatórios
    campos_obrigatorios = ["codigo", "nome", "tipo", "capacidade", "status"]
    for campo in campos_obrigatorios:
        if campo not in data or (not data[campo] and data[campo] != 0):
            raise ValueError(f"Campo obrigatório ausente ou vazio: {campo}")
    
    # Verificar se o código está sendo alterado para um código já existente
    if data["codigo"] != sala_existente.get("codSala"):
        sala_com_codigo = SalaModel.find_by_codigo(data["codigo"])
        if sala_com_codigo and sala_com_codigo.get("idSala") != id_sala:
            raise ValueError(f"Já existe outra sala com o código {data['codigo']}")
    
    # Montar objeto de recursos
    recursos = {
        "projetor": data.get("projetor", False),
        "arCondicionado": data.get("arCondicionado", False),
        "ventilador": data.get("ventilador", False),
        "computadores": data.get("computadores", False),
        "acessibilidade": data.get("acessibilidade", False),
    }
    
    # Montar dados para o banco
    sala_data = {
        "codSala": data["codigo"],
        "nomeSala": data["nome"],
        "tipoSala": data["tipo"],
        "status": data["status"],
        "capacidade": int(data["capacidade"]) if data.get("capacidade") else 0,
        "bloco": data.get("bloco", ""),
        "andar": data.get("andar", ""),
        "recursos": recursos,
        "obsSala": data.get("observacoes", ""),
    }
    
    SalaModel.update(id_sala, sala_data)
    
    return {
        "id": id_sala,
        "codigo": data["codigo"],
        "nome": data["nome"],
        "tipo": data["tipo"],
        "status": data["status"],
        "capacidade": int(data["capacidade"]) if data.get("capacidade") else 0,
        "bloco": data.get("bloco", ""),
        "andar": data.get("andar", ""),
        "projetor": recursos["projetor"],
        "arCondicionado": recursos["arCondicionado"],
        "ventilador": recursos["ventilador"],
        "computadores": recursos["computadores"],
        "acessibilidade": recursos["acessibilidade"],
        "observacoes": data.get("observacoes", ""),
    }


def atualizar_status_sala(id_sala: int, novo_status: str) -> dict:
    """Atualiza apenas o status de uma sala."""
    print(f"[DEBUG atualizar_status_sala] ID: {id_sala}, Novo status: '{novo_status}'")
    
    if novo_status not in ["ativa", "inativa"]:
        raise ValueError("Status deve ser 'ativa' ou 'inativa'")
    
    sala = SalaModel.find_by_id(id_sala)
    if not sala:
        raise ValueError(f"Sala com ID {id_sala} não encontrada")
    
    print(f"[DEBUG atualizar_status_sala] Sala encontrada: {sala.get('codSala')} - status atual: '{sala.get('status')}'")
    
    SalaModel.set_status(id_sala, novo_status)
    
    return {"id": id_sala, "status": novo_status}


def atualizar_status_lote(ids: list[int], novo_status: str) -> int:
    """Atualiza o status de múltiplas salas."""
    if novo_status not in ["ativa", "inativa"]:
        raise ValueError("Status deve ser 'ativa' ou 'inativa'")
    
    total = 0
    for id_sala in ids:
        try:
            SalaModel.set_status(id_sala, novo_status)
            total += 1
        except Exception:
            continue
    
    return total


def excluir_sala(id_sala: int) -> dict:
    """Exclui uma sala."""
    sala = SalaModel.find_by_id(id_sala)
    if not sala:
        raise ValueError(f"Sala com ID {id_sala} não encontrada")
    
    SalaModel.delete(id_sala)
    
    return {"deleted": id_sala}
