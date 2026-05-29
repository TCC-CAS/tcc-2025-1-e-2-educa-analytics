"""
Serviço de Disciplinas — CRUD completo + áreas de conhecimento, tipos e etapas de ensino.
"""
from __future__ import annotations

from app.src.models.models import DisciplinaModel
from app.src.models.disciplinas_models import (
    AreaConhecimentoModel,
    TipoDisciplinaModel,
    EtapaEnsinoModel,
    TurmaDisciplinaModel
)


# ══════════════════════════════════════════════════════════════════════════════
# DISCIPLINAS (Base Reutilizável)
# ══════════════════════════════════════════════════════════════════════════════

def listar_disciplinas(status=None) -> dict:
    """
    Lista todas as disciplinas com informações completas.
    
    Args:
        status: Filtro opcional por status ('ativa', 'inativa')
    
    Returns:
        dict com success, data/message
    """
    try:
        disciplinas = DisciplinaModel.find_all(status=status)
        
        # Normalizar campos para o padrão do frontend
        for disciplina in disciplinas:
            disciplina["id"] = disciplina.pop("idDisciplina", None)
            disciplina["codigo"] = disciplina.pop("codDisciplina", "")
            disciplina["nome"] = disciplina.pop("nomeDisciplina", "")
            disciplina["cargaHoraria"] = disciplina.pop("cargaHoraria", 0)
            
            # Adicionar campos opcionais se existirem
            disciplina["descricao"] = disciplina.get("descricao")
            disciplina["status"] = disciplina.get("status", "ativa")
            
            # Relacionamentos (se existirem na query)
            if "idAreaConhecimento" in disciplina:
                area = AreaConhecimentoModel.find_by_id(disciplina["idAreaConhecimento"])
                if area:
                    disciplina["areaConhecimento"] = {
                        "id": area["idAreaConhecimento"],
                        "nome": area["nome"],
                        "sigla": area.get("sigla", ""),
                        "cor": area.get("cor")
                    }
            
            if "idTipoDisciplina" in disciplina:
                tipo = TipoDisciplinaModel.find_by_id(disciplina["idTipoDisciplina"])
                if tipo:
                    disciplina["tipoDisciplina"] = {
                        "id": tipo["idTipoDisciplina"],
                        "nome": tipo["nome"],
                        "codigo": tipo.get("codigo", ""),
                        "cor": tipo.get("cor")
                    }
            
            if "idEtapaEnsino" in disciplina:
                etapa = EtapaEnsinoModel.find_by_id(disciplina["idEtapaEnsino"])
                if etapa:
                    disciplina["etapaEnsino"] = {
                        "id": etapa["idEtapaEnsino"],
                        "nome": etapa["nome"],
                        "codigo": etapa.get("codigo", "")
                    }
        
        return {
            "success": True,
            "data": disciplinas
        }
    except Exception as e:
        print(f"[ERROR listar_disciplinas] {e}")
        import traceback
        traceback.print_exc()
        return {
            "success": False,
            "message": f"Erro ao listar disciplinas: {str(e)}"
        }


def buscar_disciplina(id_disciplina: int) -> dict:
    """
    Busca uma disciplina específica por ID.
    
    Args:
        id_disciplina: ID da disciplina
    
    Returns:
        dict com success, data/message
    """
    try:
        disciplina = DisciplinaModel.find_by_id(id_disciplina)
        
        if not disciplina:
            return {
                "success": False,
                "message": "Disciplina não encontrada"
            }
        
        # Normalizar campos para o padrão do frontend
        disciplina["id"] = disciplina.pop("idDisciplina", None)
        disciplina["codigo"] = disciplina.pop("codDisciplina", "")
        disciplina["nome"] = disciplina.pop("nomeDisciplina", "")
        disciplina["cargaHoraria"] = disciplina.pop("cargaHoraria", 0)
        disciplina["descricao"] = disciplina.get("descricao")
        disciplina["status"] = disciplina.get("status", "ativa")
        
        # Relacionamentos
        if "idAreaConhecimento" in disciplina and disciplina["idAreaConhecimento"]:
            area = AreaConhecimentoModel.find_by_id(disciplina["idAreaConhecimento"])
            if area:
                disciplina["areaConhecimento"] = {
                    "id": area["idAreaConhecimento"],
                    "nome": area["nome"],
                    "sigla": area.get("sigla", ""),
                    "cor": area.get("cor")
                }
        
        if "idTipoDisciplina" in disciplina and disciplina["idTipoDisciplina"]:
            tipo = TipoDisciplinaModel.find_by_id(disciplina["idTipoDisciplina"])
            if tipo:
                disciplina["tipoDisciplina"] = {
                    "id": tipo["idTipoDisciplina"],
                    "nome": tipo["nome"],
                    "codigo": tipo.get("codigo", ""),
                    "cor": tipo.get("cor")
                }
        
        if "idEtapaEnsino" in disciplina and disciplina["idEtapaEnsino"]:
            etapa = EtapaEnsinoModel.find_by_id(disciplina["idEtapaEnsino"])
            if etapa:
                disciplina["etapaEnsino"] = {
                    "id": etapa["idEtapaEnsino"],
                    "nome": etapa["nome"],
                    "codigo": etapa.get("codigo", "")
                }
        
        return {
            "success": True,
            "data": disciplina
        }
    except Exception as e:
        print(f"[ERROR buscar_disciplina] {e}")
        import traceback
        traceback.print_exc()
        return {
            "success": False,
            "message": f"Erro ao buscar disciplina: {str(e)}"
        }


def criar_disciplina(dados: dict) -> dict:
    """
    Cria uma nova disciplina.
    
    Args:
        dados: Dados da disciplina (codigo, nome, cargaHoraria, etc.)
    
    Returns:
        dict com success, data/message
    """
    try:
        # Validação básica
        if not dados.get("codigo") or not dados.get("nome"):
            return {
                "success": False,
                "message": "Código e nome são obrigatórios"
            }
        
        # Verificar se já existe disciplina com o mesmo código
        disciplina_existente = DisciplinaModel.find_by_codigo(dados["codigo"])
        if disciplina_existente:
            return {
                "success": False,
                "message": f"Já existe uma disciplina com o código '{dados['codigo']}'"
            }
        
        # Criar disciplina
        id_disciplina = DisciplinaModel.create(
            cod_disciplina=dados["codigo"],
            nome_disciplina=dados["nome"],
            descricao=dados.get("descricao"),
            status=dados.get("status", "ativa")
        )
        
        return {
            "success": True,
            "data": {
                "id": id_disciplina,
                "message": "Disciplina criada com sucesso"
            }
        }
    except Exception as e:
        print(f"[ERROR criar_disciplina] {e}")
        import traceback
        traceback.print_exc()
        return {
            "success": False,
            "message": f"Erro ao criar disciplina: {str(e)}"
        }


def atualizar_disciplina(id_disciplina: int, dados: dict) -> dict:
    """
    Atualiza uma disciplina existente.
    
    Args:
        id_disciplina: ID da disciplina
        dados: Dados atualizados
    
    Returns:
        dict com success, data/message
    """
    try:
        # Verificar se a disciplina existe
        disciplina_existente = DisciplinaModel.find_by_id(id_disciplina)
        if not disciplina_existente:
            return {
                "success": False,
                "message": "Disciplina não encontrada"
            }
        
        # Se está alterando o código, verificar se não existe outro com o mesmo código
        if dados.get("codigo") and dados["codigo"] != disciplina_existente.get("codDisciplina"):
            outra_disciplina = DisciplinaModel.find_by_codigo(dados["codigo"])
            if outra_disciplina and outra_disciplina["idDisciplina"] != id_disciplina:
                return {
                    "success": False,
                    "message": f"Já existe outra disciplina com o código '{dados['codigo']}'"
                }
        
        # Atualizar disciplina
        DisciplinaModel.update(
            id_disciplina=id_disciplina,
            cod_disciplina=dados.get("codigo", disciplina_existente.get("codDisciplina")),
            nome_disciplina=dados.get("nome", disciplina_existente.get("nomeDisciplina")),
            descricao=dados.get("descricao", disciplina_existente.get("descricao")),
            status=dados.get("status", disciplina_existente.get("status", "ativa"))
        )
        
        return {
            "success": True,
            "data": {
                "id": id_disciplina,
                "message": "Disciplina atualizada com sucesso"
            }
        }
    except Exception as e:
        print(f"[ERROR atualizar_disciplina] {e}")
        import traceback
        traceback.print_exc()
        return {
            "success": False,
            "message": f"Erro ao atualizar disciplina: {str(e)}"
        }


def deletar_disciplina(id_disciplina: int) -> dict:
    """
    Deleta (inativa) uma disciplina.
    
    Args:
        id_disciplina: ID da disciplina
    
    Returns:
        dict com success, message
    """
    try:
        # Verificar se a disciplina existe
        disciplina_existente = DisciplinaModel.find_by_id(id_disciplina)
        if not disciplina_existente:
            return {
                "success": False,
                "message": "Disciplina não encontrada"
            }
        
        # Soft delete (mudar status para inativa)
        DisciplinaModel.delete(id_disciplina)
        
        return {
            "success": True,
            "message": "Disciplina deletada com sucesso"
        }
    except Exception as e:
        print(f"[ERROR deletar_disciplina] {e}")
        import traceback
        traceback.print_exc()
        return {
            "success": False,
            "message": f"Erro ao deletar disciplina: {str(e)}"
        }


# ══════════════════════════════════════════════════════════════════════════════
# ÁREAS DE CONHECIMENTO (BNCC)
# ══════════════════════════════════════════════════════════════════════════════

def listar_areas_conhecimento() -> dict:
    """
    Lista todas as áreas de conhecimento.
    
    Returns:
        dict com success, data/message
    """
    try:
        areas = AreaConhecimentoModel.find_all(ativa=True)
        
        # Normalizar campos para o padrão do frontend
        for area in areas:
            area["id"] = area.pop("idAreaConhecimento", None)
            area["nome"] = area.get("nome", "")
            area["sigla"] = area.get("sigla", "")
            area["descricao"] = area.get("descricao")
            area["cor"] = area.get("cor")
            area["ordem"] = area.get("ordem", 0)
        
        return {
            "success": True,
            "data": areas
        }
    except Exception as e:
        print(f"[ERROR listar_areas_conhecimento] {e}")
        import traceback
        traceback.print_exc()
        return {
            "success": False,
            "message": f"Erro ao listar áreas de conhecimento: {str(e)}"
        }


# ══════════════════════════════════════════════════════════════════════════════
# TIPOS DE DISCIPLINA
# ══════════════════════════════════════════════════════════════════════════════

def listar_tipos_disciplina() -> dict:
    """
    Lista todos os tipos de disciplina.
    
    Returns:
        dict com success, data/message
    """
    try:
        tipos = TipoDisciplinaModel.find_all(ativa=True)
        
        # Normalizar campos para o padrão do frontend
        for tipo in tipos:
            tipo["id"] = tipo.pop("idTipoDisciplina", None)
            tipo["nome"] = tipo.get("nome", "")
            tipo["codigo"] = tipo.get("codigo", "")
            tipo["descricao"] = tipo.get("descricao")
            tipo["cor"] = tipo.get("cor")
            tipo["ordem"] = tipo.get("ordem", 0)
        
        return {
            "success": True,
            "data": tipos
        }
    except Exception as e:
        print(f"[ERROR listar_tipos_disciplina] {e}")
        import traceback
        traceback.print_exc()
        return {
            "success": False,
            "message": f"Erro ao listar tipos de disciplina: {str(e)}"
        }


# ══════════════════════════════════════════════════════════════════════════════
# ETAPAS DE ENSINO
# ══════════════════════════════════════════════════════════════════════════════

def listar_etapas_ensino() -> dict:
    """
    Lista todas as etapas de ensino.
    
    Returns:
        dict com success, data/message
    """
    try:
        etapas = EtapaEnsinoModel.find_all(ativa=True)
        
        # Normalizar campos para o padrão do frontend
        for etapa in etapas:
            etapa["id"] = etapa.pop("idEtapaEnsino", None)
            etapa["nome"] = etapa.get("nome", "")
            etapa["codigo"] = etapa.get("codigo", "")
            etapa["descricao"] = etapa.get("descricao")
            etapa["ordem"] = etapa.get("ordem", 0)
        
        return {
            "success": True,
            "data": etapas
        }
    except Exception as e:
        print(f"[ERROR listar_etapas_ensino] {e}")
        import traceback
        traceback.print_exc()
        return {
            "success": False,
            "message": f"Erro ao listar etapas de ensino: {str(e)}"
        }


# ══════════════════════════════════════════════════════════════════════════════
# OFERTAS DE DISCIPLINAS (turma_disciplinas)
# ══════════════════════════════════════════════════════════════════════════════

def listar_ofertas_disciplinas(id_turma=None) -> dict:
    """
    Lista ofertas de disciplinas (opcionalmente por turma).
    
    Args:
        id_turma: ID da turma para filtrar (opcional)
    
    Returns:
        dict com success, data/message
    """
    try:
        if id_turma:
            ofertas = TurmaDisciplinaModel.find_by_turma(id_turma)
        else:
            ofertas = TurmaDisciplinaModel.find_all()
        
        # Normalizar campos para o padrão do frontend
        for oferta in ofertas:
            oferta["id"] = oferta.pop("idTurmaDisciplina", None)
            oferta["idTurma"] = oferta.get("idTurma")
            oferta["idDisciplina"] = oferta.get("idDisciplina")
            oferta["idEducador"] = oferta.get("idEducador")
        
        return {
            "success": True,
            "data": ofertas
        }
    except Exception as e:
        print(f"[ERROR listar_ofertas_disciplinas] {e}")
        import traceback
        traceback.print_exc()
        return {
            "success": False,
            "message": f"Erro ao listar ofertas de disciplinas: {str(e)}"
        }


def listar_ofertas(id_turma=None) -> dict:
    """Alias para listar_ofertas_disciplinas"""
    return listar_ofertas_disciplinas(id_turma)


def criar_oferta(dados: dict) -> dict:
    """
    Cria uma nova oferta de disciplina.
    
    Args:
        dados: Dados da oferta
    
    Returns:
        dict com success, data/message
    """
    try:
        # Criar oferta (implementação básica)
        return {
            "success": True,
            "data": {"message": "Função criar_oferta ainda não implementada"}
        }
    except Exception as e:
        print(f"[ERROR criar_oferta] {e}")
        return {
            "success": False,
            "message": f"Erro ao criar oferta: {str(e)}"
        }


def atualizar_oferta(id_oferta: int, dados: dict) -> dict:
    """
    Atualiza uma oferta existente.
    
    Args:
        id_oferta: ID da oferta
        dados: Dados atualizados
    
    Returns:
        dict com success, data/message
    """
    try:
        return {
            "success": True,
            "data": {"message": "Função atualizar_oferta ainda não implementada"}
        }
    except Exception as e:
        print(f"[ERROR atualizar_oferta] {e}")
        return {
            "success": False,
            "message": f"Erro ao atualizar oferta: {str(e)}"
        }


def deletar_oferta(id_oferta: int) -> dict:
    """
    Deleta uma oferta.
    
    Args:
        id_oferta: ID da oferta
    
    Returns:
        dict com success, message
    """
    try:
        return {
            "success": True,
            "message": "Função deletar_oferta ainda não implementada"
        }
    except Exception as e:
        print(f"[ERROR deletar_oferta] {e}")
        return {
            "success": False,
            "message": f"Erro ao deletar oferta: {str(e)}"
        }
