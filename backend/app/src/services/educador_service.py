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
    # DisponibilidadeEducadorModel,  # Comentado temporariamente - modelo não disponível
)
from app.src.services import email_service
from app.src.services.colaborador_service import (
    _calcular_idade,
    _format_detail,
    _senha_placeholder,
    _upsert_endereco,
)


def listar_educadores() -> dict:
    """Lista todos os educadores com suas disciplinas."""
    try:
        # Usar EducadorModel (tabela Educador)
        educadores = EducadorModel.find_all()
        
        # Enriquecer com disciplinas de cada educador
        for educador in educadores:
            matricula = educador.get("idMatricula")  # Campo correto da tabela Educador
            if matricula:
                # Buscar disciplinas vinculadas
                ids_disc = EducadorDisciplinaModel.find_by_id_educador(matricula)
                
                # Buscar nomes das disciplinas
                if ids_disc:
                    placeholders = ",".join(["%s"] * len(ids_disc))
                    query = f"SELECT nomeDisciplina FROM Disciplinas WHERE idDisciplina IN ({placeholders})"
                    disc_rows = execute_query(query, tuple(ids_disc))
                    educador["disciplinas"] = [d["nomeDisciplina"] for d in disc_rows]
                else:
                    educador["disciplinas"] = []
                
                # Converter periodos de JSON para array
                try:
                    import json
                    periodos_json = educador.get("periodos", "[]") or "[]"
                    # Remover escape duplo se existir
                    if isinstance(periodos_json, str):
                        # Se tem escape duplo, limpar
                        periodos_json = periodos_json.replace('\\"', '"').strip('"')
                        educador["periodos"] = json.loads(periodos_json)
                    else:
                        educador["periodos"] = periodos_json if isinstance(periodos_json, list) else []
                except Exception as e:
                    print(f"[educador_service] Erro ao converter periodos: {e}")
                    educador["periodos"] = []
            else:
                educador["disciplinas"] = []
                educador["periodos"] = []
        
        return {"sucesso": True, "educadores": educadores, "total": len(educadores)}
    except Exception as e:
        print(f"[educador_service] Erro ao listar educadores: {e}")
        import traceback
        traceback.print_exc()
        return {"sucesso": False, "educadores": [], "total": 0, "erro": str(e)}


def criar_educador(body: str | dict) -> dict:
    data = json.loads(body) if isinstance(body, str) else body

    # Aceitar tanto matriculaFuncional quanto matricula
    id_matricula = data.get("matriculaFuncional") or data.get("matricula") or data.get("idMatricula")
    if not id_matricula:
        raise ValueError("matriculaFuncional é obrigatório")
    if not data.get("nomeCompleto"):
        raise ValueError("nomeCompleto é obrigatório")
    if not data.get("email"):
        raise ValueError("email é obrigatório")
    if not data.get("cpf"):
        raise ValueError("cpf é obrigatório")

    # Mapear campo matricula para o EducadorModel (tabela Educadores consolidada)
    data["matricula"] = id_matricula
    data["cor"] = data.get("corRaca") or data.get("cor")
    data["idade"] = _calcular_idade(data.get("dataNascimento"))
    
    # Garantir que cargo e departamento sejam salvos com valores padrão
    if not data.get("cargo"):
        data["cargo"] = "Professor(a)"  # Valor padrão do select
    if not data.get("departamento"):
        data["departamento"] = "Ensino Fundamental II"  # Valor padrão mais comum
    
    # Converter array de periodos para JSON string se necessário
    periodos = data.get("periodos") or []
    if isinstance(periodos, list):
        data["periodos"] = json.dumps(periodos, ensure_ascii=False)

    if EducadorModel.find_by_matricula(id_matricula):
        raise ValueError(f"Matrícula {id_matricula} já cadastrada")

    print(f"[educador_service] Criando educador com cargo={data.get('cargo')}, departamento={data.get('departamento')}")
    
    # Cria educador (EducadorModel agora usa tabela Educadores)
    EducadorModel.create(data)

    end = data.get("endereco") or {}
    if end.get("cep"):
        _upsert_endereco(id_matricula, "educador", end)

    FormacaoAcademicaModel.replace_all(id_matricula, "educador", data.get("formacoes") or [])
    LoginModel.create(id_matricula, data["email"], _senha_placeholder(id_matricula))

    # Vínculos de disciplinas
    ids_disc = [int(x) for x in (data.get("disciplinas") or []) if str(x).isdigit()]
    print(f"[educador_service] disciplinas recebidas: {data.get('disciplinas')} → ids_disc: {ids_disc}")
    if ids_disc:
        # Usar replace_all para substituir todas as disciplinas do educador
        EducadorDisciplinaModel.replace_all(id_matricula, ids_disc)
    print(f"[educador_service] EducadorDisciplina salvo para matricula={id_matricula}: {ids_disc}")

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
            matricula_funcional=id_matricula,
        )
    except Exception as exc:
        print(f"[educador_service] AVISO: e-mail não enviado — {exc}")

    # Salvar disponibilidades (bloqueios de horário)
    disponibilidades = data.get("disponibilidades") or []
    if disponibilidades:
        print(f"[educador_service] Salvando {len(disponibilidades)} disponibilidades para {id_matricula}")
        # Buscar idEducador pela matrícula
        educador_row = EducadorModel.find_by_matricula(id_matricula)
        # Disponibilidades comentadas temporariamente - DisponibilidadeEducadorModel não disponível
        # if educador_row and educador_row.get('idEducador'):
        #     id_educador = educador_row['idEducador']
        #     for disp in disponibilidades:
        #         try:
        #             disp_com_id = {**disp, 'idEducador': id_educador}
        #             DisponibilidadeEducadorModel.create(disp_com_id)
        #             print(f"   ✅ Disponibilidade salva: {disp['diaSemana']} {disp['horaInicio']}-{disp['horaFim']}")
        #         except Exception as e:
        #             print(f"   ⚠️  Erro ao salvar disponibilidade: {e}")

    return buscar_educador(id_matricula)


def buscar_educador(id_matricula: str) -> dict | None:
    row = EducadorModel.find_by_matricula(id_matricula)
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

    ids_disc = EducadorDisciplinaModel.find_by_id_educador(id_matricula)
    detail["disciplinas"] = ids_disc

    return detail


def atualizar_educador(id_matricula: str, body: str | dict) -> dict:
    data = json.loads(body) if isinstance(body, str) else body

    educador = EducadorModel.find_by_matricula(id_matricula)
    if not educador:
        raise ValueError(f"Educador {id_matricula} não encontrado")

    data["cor"] = data.get("corRaca") or data.get("cor")
    data["idade"] = _calcular_idade(data.get("dataNascimento"))
    
    # Garantir que cargo e departamento sejam atualizados com valores padrão
    if not data.get("cargo"):
        data["cargo"] = "Professor(a)"  # Valor padrão do select
    if not data.get("departamento"):
        data["departamento"] = "Ensino Fundamental II"  # Valor padrão mais comum
    
    # Converter array de periodos para JSON string se necessário
    periodos = data.get("periodos") or []
    if isinstance(periodos, list):
        data["periodos"] = json.dumps(periodos, ensure_ascii=False)
    
    print(f"[educador_service] Atualizando educador {id_matricula} com cargo={data.get('cargo')}, departamento={data.get('departamento')}")

    EducadorModel.update(id_matricula, data)

    end = data.get("endereco") or {}
    if end.get("cep"):
        _upsert_endereco(id_matricula, "educador", end)

    FormacaoAcademicaModel.replace_all(id_matricula, "educador", data.get("formacoes") or [])

    ids_disc = [int(x) for x in (data.get("disciplinas") or []) if str(x).isdigit()]
    EducadorDisciplinaModel.replace_all(id_matricula, ids_disc)

    # Atualizar disponibilidades (bloqueios de horário)
    disponibilidades = data.get("disponibilidades") or []
    if disponibilidades:
        print(f"[educador_service] Atualizando {len(disponibilidades)} disponibilidades para {id_matricula}")
        # Buscar idEducador pela matrícula
        educador_row = EducadorModel.find_by_matricula(id_matricula)
        if educador_row and educador_row.get('idEducador'):
            id_educador = educador_row['idEducador']
            # Disponibilidades comentadas temporariamente - DisponibilidadeEducadorModel não disponível
            # DisponibilidadeEducadorModel.delete_by_educador(id_educador)
            # for disp in disponibilidades:
            #     try:
            #         disp_com_id = {**disp, 'idEducador': id_educador}
            #         DisponibilidadeEducadorModel.create(disp_com_id)
            #         print(f"   ✅ Disponibilidade salva: {disp['diaSemana']} {disp['horaInicio']}-{disp['horaFim']}")
            #     except Exception as e:
            #         print(f"   ⚠️  Erro ao salvar disponibilidade: {e}")
            pass

    return buscar_educador(id_matricula)


def gerar_proxima_matricula() -> dict:
    """
    Gera a próxima matrícula funcional sequencial no formato EDUAAAA#### 
    onde AAAA = ano atual e #### = sequencial de 4 dígitos.
    """
    ano_atual = datetime.now().year
    prefixo = f"EDU{ano_atual}"
    
    # Busca a última matrícula com o prefixo do ano atual
    query = """
        SELECT idMatricula FROM Educador 
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


def excluir_educador(id_matricula: str) -> dict:
    """
    Exclui um educador e todos os seus dados relacionados.
    Remove: disciplinas vinculadas, endereço, formações, login.
    """
    educador = EducadorModel.find_by_matricula(id_matricula)
    if not educador:
        raise ValueError(f"Educador {id_matricula} não encontrado")
    
    try:
        # Remove disciplinas vinculadas (usa idMatricula, não idEducador)
        execute_write("DELETE FROM EducadorDisciplina WHERE idMatricula = %s", (id_matricula,))
        
        # Remove formações
        FormacaoAcademicaModel.replace_all(id_matricula, "educador", [])
        
        # Remove endereço (tenta, mas não falha se não existir)
        try:
            execute_write("DELETE FROM Endereco WHERE idMatricula = %s AND tipoUsuario = 'educador'", (id_matricula,))
        except:
            pass
        
        # Remove login (tenta, mas não falha se não existir)
        try:
            execute_write("DELETE FROM Login WHERE idMatricula = %s", (id_matricula,))
        except:
            pass
        
        # Remove o educador
        EducadorModel.delete_by_matricula(id_matricula)
        
        return {"sucesso": True, "mensagem": f"Educador {id_matricula} excluído com sucesso"}
    except Exception as e:
        print(f"[educador_service] Erro ao excluir educador: {e}")
        raise ValueError(f"Erro ao excluir educador: {str(e)}")
