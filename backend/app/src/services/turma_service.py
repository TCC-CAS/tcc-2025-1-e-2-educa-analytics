"""
Service para gerenciar Turmas com estrutura profissional
"""
from app.src.adapters.db_adapter import execute_query, execute_write
from datetime import datetime
import re


def listar_turmas(ano_letivo_id=None, serie_id=None, periodo_id=None, status=None, sala_id=None):
    """Lista turmas com joins nas tabelas relacionadas"""
    try:
        query = """
            SELECT 
                t.idTurma,
                t.codTurma,
                t.codigo_automatico,
                t.nome_completo,
                t.nomeTurma,
                t.capacidade_maxima,
                t.capacidade_atual,
                t.status,
                t.observacoes,
                t.idSala,
                t.idCoordenador,
                t.idSerie,
                t.idPeriodo,
                t.idAnoLetivo,
                t.dataInicio,
                t.dataFim,
                t.qldVagas,
                s.codigo as serie_codigo,
                s.nome as serie_nome,
                p.codigo as periodo_codigo,
                p.nome as periodo_nome,
                p.hora_inicio,
                p.hora_fim,
                al.ano as ano_letivo,
                al.status as ano_letivo_status,
                sa.nomeSala,
                sa.capacidade as sala_capacidade,
                e.nomeCompleto as coordenador_nome
            FROM Turmas t
            INNER JOIN series s ON t.idSerie = s.idSerie
            INNER JOIN periodos p ON t.idPeriodo = p.idPeriodo
            INNER JOIN anos_letivos al ON t.idAnoLetivo = al.idAnoLetivo
            LEFT JOIN Salas sa ON t.idSala = sa.idSala
            LEFT JOIN Educador e ON t.idCoordenador = e.idMatricula
            WHERE 1=1
        """
        params = []
        
        if ano_letivo_id:
            try:
                val = int(ano_letivo_id)
                # Se valor >= 2000, interpreta como ano (ex: 2026); senão como idAnoLetivo (ex: 2)
                if val >= 2000:
                    query += " AND al.ano = %s"
                else:
                    query += " AND al.idAnoLetivo = %s"
                params.append(val)
            except (ValueError, TypeError):
                pass
        
        if serie_id:
            query += " AND t.idSerie = %s"
            params.append(serie_id)
        
        if periodo_id:
            query += " AND t.idPeriodo = %s"
            params.append(periodo_id)
        
        if status:
            query += " AND t.status = %s"
            params.append(status)
        
        if sala_id:
            query += " AND t.idSala = %s"
            params.append(sala_id)
        
        query += " ORDER BY al.ano DESC, s.ano_escolar, t.nomeTurma"
        
        turmas = execute_query(query, tuple(params))
        
        # DEBUG: verificar codTurma
        print(f"[turma_service] ANTES do loop: turmas[0] keys = {list(turmas[0].keys()) if turmas else 'VAZIO'}")
        if turmas and 'codTurma' in turmas[0]:
            print(f"[turma_service] codTurma do primeiro registro: [{turmas[0]['codTurma']}]")
        
        # Calcular vagas disponíveis
        for turma in turmas:
            turma['vagas_disponiveis'] = turma['capacidade_maxima'] - turma['capacidade_atual']
            turma['percentual_ocupacao'] = round((turma['capacidade_atual'] / turma['capacidade_maxima']) * 100, 2) if turma['capacidade_maxima'] > 0 else 0
        
        # DEBUG: verificar codTurma após loop
        print(f"[turma_service] DEPOIS do loop: turmas[0] keys = {list(turmas[0].keys()) if turmas else 'VAZIO'}")
        if turmas and 'codTurma' in turmas[0]:
            print(f"[turma_service] codTurma ainda existe: [{turmas[0]['codTurma']}]")
        
        return {
            "sucesso": True,
            "turmas": turmas,
            "total": len(turmas)
        }
    except Exception as e:
        print(f"[turma_service] Erro ao listar turmas: {e}")
        return {"sucesso": False, "turmas": [], "total": 0, "erro": str(e)}


def buscar_turma_por_id(id_turma):
    """Busca detalhes completos de uma turma"""
    try:
        # Buscar dados da turma
        query = """
            SELECT 
                t.*,
                s.codigo as serie_codigo,
                s.nome as serie_nome,
                s.idSerie,
                p.codigo as periodo_codigo,
                p.nome as periodo_nome,
                p.idPeriodo,
                p.hora_inicio,
                p.hora_fim,
                al.ano as ano_letivo,
                al.idAnoLetivo,
                sa.nomeSala,
                sa.codSala,
                e.nomeCompleto as coordenador_nome
            FROM Turmas t
            INNER JOIN series s ON t.idSerie = s.idSerie
            INNER JOIN periodos p ON t.idPeriodo = p.idPeriodo
            INNER JOIN anos_letivos al ON t.idAnoLetivo = al.idAnoLetivo
            LEFT JOIN Salas sa ON t.idSala = sa.idSala
            LEFT JOIN Educador e ON t.idCoordenador = e.idMatricula
            WHERE t.idTurma = %s
        """
        resultado = execute_query(query, (id_turma,))
        
        if not resultado:
            return {"sucesso": False, "erro": "Turma não encontrada"}
        
        turma = resultado[0]
        
        # Buscar disciplinas da turma
        query_disc = """
            SELECT 
                td.*,
                d.nomeDisciplina,
                d.areaConhecimento,
                e.nomeCompleto as educador_nome
            FROM turma_disciplinas td
            INNER JOIN Disciplinas d ON td.idDisciplina = d.idDisciplina
            LEFT JOIN Educador e ON td.idEducador = e.idMatricula
            WHERE td.idTurma = %s
            ORDER BY d.nomeDisciplina
        """
        disciplinas = execute_query(query_disc, (id_turma,))
        
        turma['disciplinas'] = disciplinas
        turma['vagas_disponiveis'] = turma['capacidade_maxima'] - turma['capacidade_atual']
        turma['percentual_ocupacao'] = round((turma['capacidade_atual'] / turma['capacidade_maxima']) * 100, 2) if turma['capacidade_maxima'] > 0 else 0
        
        return {"sucesso": True, "turma": turma}
    except Exception as e:
        print(f"[turma_service] Erro ao buscar turma: {e}")
        return {"sucesso": False, "erro": str(e)}


def gerar_codigo_automatico(ano_letivo_id, serie_id, periodo_id, letra=None):
    """Gera código automático no formato: ANO-SERIE-LETRA-PERIODO"""
    try:
        # Buscar dados
        query_serie = "SELECT codigo FROM series WHERE idSerie = %s"
        serie = execute_query(query_serie, (serie_id,))
        
        query_periodo = "SELECT codigo FROM periodos WHERE idPeriodo = %s"
        periodo = execute_query(query_periodo, (periodo_id,))
        
        query_ano = "SELECT ano FROM anos_letivos WHERE idAnoLetivo = %s"
        ano = execute_query(query_ano, (ano_letivo_id,))
        
        if not serie or not periodo or not ano:
            return None
        
        serie_codigo = serie[0]['codigo']
        periodo_codigo = periodo[0]['codigo']
        ano_letivo = ano[0]['ano']
        
        # Se não foi passada letra, buscar próxima disponível
        if not letra:
            query_ultima = """
                SELECT codigo_automatico 
                FROM Turmas 
                WHERE idSerie = %s AND idPeriodo = %s AND idAnoLetivo = %s
                ORDER BY codigo_automatico DESC
                LIMIT 1
            """
            ultima = execute_query(query_ultima, (serie_id, periodo_id, ano_letivo_id))
            
            if ultima and ultima[0]['codigo_automatico']:
                # Extrair letra do código (2026-EF1-1-A-M -> A)
                match = re.search(r'-([A-Z])-', ultima[0]['codigo_automatico'])
                if match:
                    ultima_letra = match.group(1)
                    proxima_letra = chr(ord(ultima_letra) + 1)
                else:
                    proxima_letra = 'A'
            else:
                proxima_letra = 'A'
            
            letra = proxima_letra
        
        # Formato: 2026-EF1-1-A-M
        codigo = f"{ano_letivo}-{serie_codigo}-{letra}-{periodo_codigo}"
        return codigo
        
    except Exception as e:
        print(f"[turma_service] Erro ao gerar código automático: {e}")
        return None


def validar_ocupacao_sala(sala_id, periodo_id, ano_letivo_id, turma_id=None):
    """Valida se sala está disponível no período e ano letivo"""
    try:
        query = """
            SELECT idTurma, codigo_automatico, nomeTurma
            FROM Turmas
            WHERE idSala = %s 
            AND idPeriodo = %s 
            AND idAnoLetivo = %s
            AND status IN ('planejada', 'ativa')
        """
        params = [sala_id, periodo_id, ano_letivo_id]
        
        # Se for edição, excluir a própria turma
        if turma_id:
            query += " AND idTurma != %s"
            params.append(turma_id)
        
        resultado = execute_query(query, tuple(params))
        
        if resultado:
            return {
                "disponivel": False,
                "turma_existente": resultado[0]
            }
        else:
            return {
                "disponivel": True
            }
    except Exception as e:
        print(f"[turma_service] Erro ao validar ocupação de sala: {e}")
        return {"disponivel": False, "erro": str(e)}


def criar_turma(dados):
    """Cria uma nova turma com código automático e disciplinas da matriz"""
    try:
        # Validar sala
        if dados.get('idSala'):
            validacao = validar_ocupacao_sala(
                dados['idSala'],
                dados['idPeriodo'],
                dados['idAnoLetivo']
            )
            if not validacao['disponivel']:
                return {
                    "sucesso": False,
                    "erro": f"Sala já ocupada pela turma {validacao['turma_existente']['codigo_automatico']}"
                }
        
        # Gerar código automático
        codigo_auto = gerar_codigo_automatico(
            dados['idAnoLetivo'],
            dados['idSerie'],
            dados['idPeriodo'],
            dados.get('letra')
        )
        
        if not codigo_auto:
            return {"sucesso": False, "erro": "Erro ao gerar código automático"}
        
        # Buscar dados das tabelas normalizadas para preencher campos antigos
        serie_data = execute_query("SELECT codigo, nome FROM series WHERE idSerie = %s", (dados['idSerie'],))
        periodo_data = execute_query("SELECT codigo, nome FROM periodos WHERE idPeriodo = %s", (dados['idPeriodo'],))
        ano_data = execute_query("SELECT ano, data_inicio, data_fim FROM anos_letivos WHERE idAnoLetivo = %s", (dados['idAnoLetivo'],))
        
        if not serie_data or not periodo_data or not ano_data:
            return {"sucesso": False, "erro": "Dados inválidos de série, período ou ano letivo"}
        
        serie = serie_data[0]
        periodo = periodo_data[0]
        ano = ano_data[0]
        
        # Mapear período para formato antigo (M -> matutino, T -> vespertino, etc.)
        periodo_map = {'M': 'matutino', 'T': 'vespertino', 'N': 'noturno', 'I': 'integral'}
        periodo_antigo = periodo_map.get(periodo['codigo'], 'matutino')
        
        # Inserir turma com AMBOS os formatos (novo + antigo para compatibilidade)
        query = """
            INSERT INTO Turmas (
                idSerie, idPeriodo, idAnoLetivo,
                codigo_automatico, codTurma, nomeTurma, nome_completo,
                capacidade_maxima, capacidade_atual, qldVagas,
                idSala, idCoordenador, observacoes, status,
                anoLetivo, serie, periodo, dataInicio, dataFim
            ) VALUES (
                %s, %s, %s, %s, %s, %s, %s, %s, 0, %s, %s, %s, %s, 'planejada',
                %s, %s, %s, %s, %s
            )
        """
        capacidade = dados.get('capacidade_maxima', 30)
        params = (
            dados['idSerie'],
            dados['idPeriodo'],
            dados['idAnoLetivo'],
            codigo_auto,                                        # codigo_automatico (novo)
            codigo_auto,                                        # codTurma (antigo)
            dados.get('nomeTurma', codigo_auto),               # nomeTurma
            dados.get('nome_completo'),                        # nome_completo (novo)
            capacidade,                                         # capacidade_maxima (novo)
            capacidade,                                         # qldVagas (antigo)
            dados.get('idSala'),                               # idSala
            dados.get('idCoordenador'),                        # idCoordenador
            dados.get('observacoes'),                          # observacoes
            ano['ano'],                                         # anoLetivo (antigo)
            serie['nome'],                                      # serie (antigo - ex: "1º Ano EF")
            periodo_antigo,                                     # periodo (antigo - ex: "matutino")
            ano['data_inicio'],                                 # dataInicio (antigo)
            ano['data_fim']                                     # dataFim (antigo)
        )
        
        id_turma = execute_write(query, params)
        
        if not id_turma:
            return {"sucesso": False, "erro": "Erro ao criar turma"}
        
        # Carregar disciplinas da matriz curricular
        query_matriz = """
            SELECT idDisciplina, carga_horaria_semanal
            FROM matriz_curricular
            WHERE idSerie = %s AND ativo = TRUE
        """
        disciplinas_matriz = execute_query(query_matriz, (dados['idSerie'],))
        
        # Inserir disciplinas da turma
        for disc in disciplinas_matriz:
            query_disc = """
                INSERT INTO turma_disciplinas (
                    idTurma, idDisciplina, carga_horaria_semanal
                ) VALUES (%s, %s, %s)
            """
            execute_write(query_disc, (id_turma, disc['idDisciplina'], disc['carga_horaria_semanal']))
        
        # Registrar no histórico
        adicionar_ao_historico(
            id_turma,
            'criacao',
            f"Turma {codigo_auto} criada com {len(disciplinas_matriz)} disciplinas"
        )
        
        return {
            "sucesso": True,
            "idTurma": id_turma,
            "codigo_automatico": codigo_auto,
            "disciplinas_adicionadas": len(disciplinas_matriz)
        }
        
    except Exception as e:
        print(f"[turma_service] Erro ao criar turma: {e}")
        return {"sucesso": False, "erro": str(e)}


def atualizar_turma(id_turma, dados):
    """Atualiza dados de uma turma mantendo sincronização com campos legados"""
    try:
        # Buscar turma atual para pegar IDs normalizados
        turma_atual = execute_query("SELECT * FROM Turmas WHERE idTurma = %s", (id_turma,))
        if not turma_atual:
            return {"sucesso": False, "erro": "Turma não encontrada"}
        
        turma_atual = turma_atual[0]
        
        # Validar sala se foi alterada
        if dados.get('idSala'):
            id_periodo = dados.get('idPeriodo', turma_atual['idPeriodo'])
            id_ano = dados.get('idAnoLetivo', turma_atual['idAnoLetivo'])
            
            validacao = validar_ocupacao_sala(
                dados['idSala'],
                id_periodo,
                id_ano,
                id_turma
            )
            if not validacao['disponivel']:
                return {
                    "sucesso": False,
                    "erro": f"Sala já ocupada pela turma {validacao['turma_existente']['codigo_automatico']}"
                }
        
        # Construir query de atualização
        campos = []
        params = []
        
        # Campos permitidos para atualização direta
        campos_simples = ['nomeTurma', 'nome_completo', 'idSala', 'idCoordenador', 'observacoes', 'status']
        
        for campo in campos_simples:
            if campo in dados:
                campos.append(f"{campo} = %s")
                params.append(dados[campo])
        
        # Sincronizar capacidade_maxima com qldVagas (campo legado)
        if 'capacidade_maxima' in dados:
            campos.append("capacidade_maxima = %s")
            params.append(dados['capacidade_maxima'])
            campos.append("qldVagas = %s")  # Manter sincronizado
            params.append(dados['capacidade_maxima'])
        
        # Se mudaram série, período ou ano letivo, atualizar campos legados também
        atualizar_campos_legados = False
        if 'idSerie' in dados or 'idPeriodo' in dados or 'idAnoLetivo' in dados:
            atualizar_campos_legados = True
            
            # Usar novos valores ou manter atuais
            id_serie = dados.get('idSerie', turma_atual['idSerie'])
            id_periodo = dados.get('idPeriodo', turma_atual['idPeriodo'])
            id_ano = dados.get('idAnoLetivo', turma_atual['idAnoLetivo'])
            
            # Buscar dados normalizados
            serie_data = execute_query("SELECT codigo, nome FROM series WHERE idSerie = %s", (id_serie,))
            periodo_data = execute_query("SELECT codigo, nome FROM periodos WHERE idPeriodo = %s", (id_periodo,))
            ano_data = execute_query("SELECT ano, data_inicio, data_fim FROM anos_letivos WHERE idAnoLetivo = %s", (id_ano,))
            
            if serie_data and periodo_data and ano_data:
                serie = serie_data[0]
                periodo = periodo_data[0]
                ano = ano_data[0]
                
                # Mapear período para formato antigo
                periodo_map = {'M': 'matutino', 'T': 'vespertino', 'N': 'noturno', 'I': 'integral'}
                periodo_antigo = periodo_map.get(periodo['codigo'], 'matutino')
                
                # Adicionar campos legados à atualização
                if 'idSerie' in dados:
                    campos.append("idSerie = %s")
                    params.append(id_serie)
                    campos.append("serie = %s")
                    params.append(serie['nome'])
                
                if 'idPeriodo' in dados:
                    campos.append("idPeriodo = %s")
                    params.append(id_periodo)
                    campos.append("periodo = %s")
                    params.append(periodo_antigo)
                
                if 'idAnoLetivo' in dados:
                    campos.append("idAnoLetivo = %s")
                    params.append(id_ano)
                    campos.append("anoLetivo = %s")
                    params.append(ano['ano'])
                    campos.append("dataInicio = %s")
                    params.append(ano['data_inicio'])
                    campos.append("dataFim = %s")
                    params.append(ano['data_fim'])
        
        if not campos:
            return {"sucesso": False, "erro": "Nenhum campo para atualizar"}
        
        params.append(id_turma)
        
        query = f"UPDATE Turmas SET {', '.join(campos)} WHERE idTurma = %s"
        execute_write(query, tuple(params))
        
        # Registrar no histórico
        alteracoes = ', '.join([f"{k}" for k in dados.keys()])
        adicionar_ao_historico(id_turma, 'alteracao', f"Campos atualizados: {alteracoes}")
        
        return {"sucesso": True, "idTurma": id_turma}
        
    except Exception as e:
        print(f"[turma_service] Erro ao atualizar turma: {e}")
        import traceback
        traceback.print_exc()
        return {"sucesso": False, "erro": str(e)}


def adicionar_ao_historico(id_turma, tipo_evento, descricao, usuario=None):
    """Registra evento no histórico da turma"""
    try:
        query = """
            INSERT INTO historico_turma (idTurma, tipo_evento, descricao, usuario)
            VALUES (%s, %s, %s, %s)
        """
        execute_write(query, (id_turma, tipo_evento, descricao, usuario))
        return True
    except Exception as e:
        print(f"[turma_service] Erro ao adicionar histórico: {e}")
        return False


def buscar_historico_turma(id_turma):
    """Busca histórico de eventos da turma"""
    try:
        query = """
            SELECT * FROM historico_turma
            WHERE idTurma = %s
            ORDER BY data_evento DESC
        """
        historico = execute_query(query, (id_turma,))
        
        return {
            "sucesso": True,
            "historico": historico,
            "total": len(historico)
        }
    except Exception as e:
        print(f"[turma_service] Erro ao buscar histórico: {e}")
        return {"sucesso": False, "historico": [], "total": 0, "erro": str(e)}


def relatorio_ocupacao_salas(ano_letivo_id):
    """Gera relatório de ocupação de salas"""
    try:
        query = """
            SELECT 
                s.idSala,
                s.nomeSala,
                s.capacidade as sala_capacidade,
                p.idPeriodo,
                p.nome as periodo_nome,
                t.idTurma,
                t.codigo_automatico,
                t.capacidade_atual,
                t.status
            FROM Salas s
            CROSS JOIN periodos p
            LEFT JOIN Turmas t ON s.idSala = t.idSala 
                AND p.idPeriodo = t.idPeriodo 
                AND t.idAnoLetivo = %s
                AND t.status IN ('planejada', 'ativa')
            ORDER BY s.nomeSala, p.codigo
        """
        
        resultado = execute_query(query, (ano_letivo_id,))
        
        # Agrupar por sala
        salas_dict = {}
        for row in resultado:
            sala_id = row['idSala']
            if sala_id not in salas_dict:
                salas_dict[sala_id] = {
                    'idSala': sala_id,
                    'nomeSala': row['nomeSala'],
                    'capacidade': row['sala_capacidade'],
                    'periodos': []
                }
            
            salas_dict[sala_id]['periodos'].append({
                'periodo_nome': row['periodo_nome'],
                'ocupada': row['idTurma'] is not None,
                'turma': row['codigo_automatico'],
                'alunos': row['capacidade_atual']
            })
        
        return {
            "sucesso": True,
            "salas": list(salas_dict.values())
        }
        
    except Exception as e:
        print(f"[turma_service] Erro ao gerar relatório: {e}")
        return {"sucesso": False, "salas": [], "erro": str(e)}
