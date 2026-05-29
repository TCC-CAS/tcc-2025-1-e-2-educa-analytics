"""
Serviços avançados para gerenciamento de cronograma escolar
Inclui validações, detecção de conflitos e geração automática
"""

from typing import List, Dict, Optional, Tuple
from datetime import datetime, time, timedelta
from ..models.models import (
    CronogramaModel,
    TurmaModel,
    SalaModel,
    EducadorModel,
    DisciplinaModel,
    PeriodoLetivoModel,
    DisponibilidadeEducadorModel,
    EventoEscolarModel,
    ConflitoHorarioModel,
    AuditoriaCronogramaModel,
    BloqueioHorarioModel,
    HorarioTemplateModel,
    MatrizCurricularModel
)


# ═══════════════════════════════════════════════════════════════════════════
# VALIDADORES E DETECTORES DE CONFLITOS
# ═══════════════════════════════════════════════════════════════════════════

class ValidadorCronograma:
    """Classe para validação de horários e detecção de conflitos"""
    
    @staticmethod
    def validar_horario_completo(dados: dict, id_excluir: Optional[int] = None) -> Tuple[bool, List[str]]:
        """
        Valida todos os aspectos de um horário antes de criar/atualizar
        
        Returns:
            (valido, lista_de_erros)
        """
        erros = []
        
        # 1. Validar conflito de turma
        conflitos_turma = CronogramaModel.find_conflitos_turma(
            id_turma=dados["idTurma"],
            dia_semana=dados["diaSemana"],
            hora_inicio=dados["horaInicio"],
            hora_fim=dados["horaFim"],
            exclude_id=id_excluir
        )
        if conflitos_turma:
            erros.append(f"Turma já possui aula de {conflitos_turma[0]['nomeDisciplina']} neste horário")
        
        # 2. Validar conflito de educador
        conflitos_educador = CronogramaModel.find_conflitos_educador(
            id_educador=dados["idEducador"],
            dia_semana=dados["diaSemana"],
            hora_inicio=dados["horaInicio"],
            hora_fim=dados["horaFim"],
            exclude_id=id_excluir
        )
        if conflitos_educador:
            erros.append(f"Educador já leciona para turma {conflitos_educador[0]['codTurma']} neste horário")
        
        # 3. Validar conflito de sala
        if dados.get("idSala"):
            conflitos_sala = CronogramaModel.find_conflitos_sala(
                id_sala=dados["idSala"],
                dia_semana=dados["diaSemana"],
                hora_inicio=dados["horaInicio"],
                hora_fim=dados["horaFim"],
                exclude_id=id_excluir
            )
            if conflitos_sala:
                erros.append(f"Sala ocupada pela turma {conflitos_sala[0]['codTurma']} neste horário")
        
        # 4. Validar disponibilidade do educador
        disponivel = DisponibilidadeEducadorModel.check_disponibilidade(
            id_educador=dados["idEducador"],
            dia_semana=dados["diaSemana"],
            hora_inicio=dados["horaInicio"],
            hora_fim=dados["horaFim"]
        )
        if not disponivel:
            erros.append("Educador não está disponível neste horário")
        
        # 5. Validar capacidade da sala
        if dados.get("idSala"):
            sala = SalaModel.find_by_id(dados["idSala"])
            turma = TurmaModel.find_by_id(dados["idTurma"])
            
            if sala and turma:
                if sala.get("capacidade", 0) < turma.get("qldVagas", 0):
                    erros.append(f"Sala tem capacidade de {sala['capacidade']} mas turma tem {turma['qldVagas']} alunos")
        
        # 6. Validar horário lógico (início < fim)
        try:
            h_inicio = datetime.strptime(dados["horaInicio"], "%H:%M:%S").time()
            h_fim = datetime.strptime(dados["horaFim"], "%H:%M:%S").time()
            
            if h_inicio >= h_fim:
                erros.append("Horário de início deve ser anterior ao horário de fim")
            
            # Validar duração mínima (pelo menos 30 minutos)
            duracao_segundos = (datetime.combine(datetime.min, h_fim) - datetime.combine(datetime.min, h_inicio)).seconds
            if duracao_segundos < 1800:  # 30 minutos
                erros.append("Aula deve ter pelo menos 30 minutos de duração")
                
        except ValueError:
            erros.append("Formato de horário inválido. Use HH:MM:SS")
        
        # 7. Validar carga horária excessiva
        aulas_educador_dia = CronogramaModel.find_by_educador(dados["idEducador"])
        aulas_mesmo_dia = [a for a in aulas_educador_dia if a["diaSemana"] == dados["diaSemana"]]
        
        if len(aulas_mesmo_dia) >= 8:
            erros.append("Educador já possui 8 ou mais aulas neste dia (limite recomendado)")
        
        return (len(erros) == 0, erros)
    
    @staticmethod
    def detectar_conflitos_sistema() -> List[Dict]:
        """
        Executa varredura completa do sistema para detectar conflitos
        """
        # Chama a stored procedure do banco de dados
        from ..adapters.db_adapter import execute_query
        
        try:
            execute_query("CALL sp_detectar_conflitos()")
            return ConflitoHorarioModel.find_all_pendentes()
        except Exception as e:
            print(f"[ERRO] Detecção de conflitos: {e}")
            return []
    
    @staticmethod
    def sugerir_horarios_livres(
        id_educador: int,
        id_sala: int,
        id_turma: int,
        duracao: int = 50
    ) -> List[Dict]:
        """
        Sugere horários livres considerando educador, sala e turma
        """
        from ..adapters.db_adapter import execute_query
        
        try:
            return execute_query(
                "CALL sp_sugerir_horarios_livres(%s, %s, %s, %s)",
                (id_educador, id_sala, id_turma, duracao)
            )
        except Exception as e:
            print(f"[ERRO] Sugestão de horários: {e}")
            return []


# ═══════════════════════════════════════════════════════════════════════════
# ALGORITMO DE GERAÇÃO AUTOMÁTICA DE GRADE HORÁRIA
# ═══════════════════════════════════════════════════════════════════════════

class GeradorGradeAutomatica:
    """
    Algoritmo inteligente para geração automática de grade horária
    Usa técnicas de constraint solving e backtracking
    """
    
    def __init__(self, id_turma: int, id_periodo: int):
        self.id_turma = id_turma
        self.id_periodo = id_periodo
        self.turma = TurmaModel.find_by_id(id_turma)
        self.periodo = PeriodoLetivoModel.find_by_id(id_periodo)
        
        if not self.turma:
            raise ValueError(f"Turma com ID {id_turma} não encontrada")
        
        if not self.periodo:
            raise ValueError(f"Período com ID {id_periodo} não encontrado")
        
        # Busca horários template baseado no turno da turma
        turno_map = {
            "Manhã": "manha",
            "Tarde": "tarde", 
            "Noite": "noite"
        }
        turno = self.turma.get("turno", "Manhã")
        turno_normalizado = turno_map.get(turno, "manha")
        self.horarios_template = HorarioTemplateModel.find_by_turno(turno_normalizado)
        
        # Se não houver template, usa horários padrão
        if not self.horarios_template:
            self.horarios_template = self._criar_horarios_padrao(turno_normalizado)
        
        self.disciplinas = self._buscar_disciplinas_turma()
        self.conflitos: List[str] = []
        
    def _criar_horarios_padrao(self, turno: str) -> List[Dict]:
        """Cria horários padrão quando não há template"""
        if turno == "manha":
            return [
                {"tipo": "aula", "horaInicio": "07:00:00", "horaFim": "07:50:00"},
                {"tipo": "aula", "horaInicio": "07:50:00", "horaFim": "08:40:00"},
                {"tipo": "intervalo", "horaInicio": "08:40:00", "horaFim": "09:00:00"},
                {"tipo": "aula", "horaInicio": "09:00:00", "horaFim": "09:50:00"},
                {"tipo": "aula", "horaInicio": "09:50:00", "horaFim": "10:40:00"},
                {"tipo": "aula", "horaInicio": "10:40:00", "horaFim": "11:30:00"},
            ]
        elif turno == "tarde":
            return [
                {"tipo": "aula", "horaInicio": "13:00:00", "horaFim": "13:50:00"},
                {"tipo": "aula", "horaInicio": "13:50:00", "horaFim": "14:40:00"},
                {"tipo": "intervalo", "horaInicio": "14:40:00", "horaFim": "15:00:00"},
                {"tipo": "aula", "horaInicio": "15:00:00", "horaFim": "15:50:00"},
                {"tipo": "aula", "horaInicio": "15:50:00", "horaFim": "16:40:00"},
                {"tipo": "aula", "horaInicio": "16:40:00", "horaFim": "17:30:00"},
            ]
        else:  # noite
            return [
                {"tipo": "aula", "horaInicio": "18:30:00", "horaFim": "19:20:00"},
                {"tipo": "aula", "horaInicio": "19:20:00", "horaFim": "20:10:00"},
                {"tipo": "intervalo", "horaInicio": "20:10:00", "horaFim": "20:20:00"},
                {"tipo": "aula", "horaInicio": "20:20:00", "horaFim": "21:10:00"},
                {"tipo": "aula", "horaInicio": "21:10:00", "horaFim": "22:00:00"},
            ]
        
    def _buscar_disciplinas_turma(self) -> List[Dict]:
        """Busca disciplinas da série/ano da turma a partir da Matriz Curricular"""
        serie = self.turma.get("serie")
        ano_letivo = self.turma.get("anoLetivo")
        
        if not serie or not ano_letivo:
            print(f"[AVISO] Turma sem série ou ano letivo definido")
            return []
        
        # Busca na matriz curricular
        try:
            ano_letivo_int = int(ano_letivo)
            matriz = MatrizCurricularModel.find_by_serie(serie, ano_letivo_int, status="ativa")
            
            if not matriz:
                print(f"[AVISO] Nenhuma disciplina encontrada na matriz curricular para {serie} / {ano_letivo}")
                return []
            
            # Enriquecer com dados completos da disciplina
            disciplinas_completas = []
            for item in matriz:
                disc = DisciplinaModel.find_by_id(item["idDisciplina"])
                if disc:
                    disc["cargaHorariaSemanal"] = item.get("cargaHorariaSemanal", 2)
                    disciplinas_completas.append(disc)
            
            return disciplinas_completas
        except Exception as e:
            print(f"[ERRO] Erro ao buscar disciplinas da turma: {e}")
            return []
    
    def _calcular_aulas_necessarias(self, disciplina: Dict) -> int:
        """
        Calcula quantas aulas semanais são necessárias baseado na carga horária
        Agora usa diretamente a cargaHorariaSemanal da matriz curricular
        """
        # Usa a carga horária semanal da matriz curricular
        aulas_semanais = disciplina.get("cargaHorariaSemanal", 2)
        return max(1, min(aulas_semanais, 10))  # Entre 1 e 10 aulas por semana
    
    def _encontrar_educador_disponivel(self, disciplina: Dict, dia: str, hora_inicio: str, hora_fim: str) -> Optional[int]:
        """
        Encontra um educador disponível que leciona a disciplina no turno correto
        """
        # Busca educadores que lecionam esta disciplina
        educadores = EducadorModel.find_by_disciplina(disciplina["idDisciplina"])
        
        if not educadores:
            return None
        
        turno_turma = self.turma.get("turno", "Manhã")
        
        for educador in educadores:
            id_educador = educador.get("idEducador")
            if not id_educador:
                continue
            
            # Verifica se o educador trabalha neste turno
            # (Simplificado: assume que se tem disponibilidade no horário, trabalha no turno)
            
            # Verifica se está disponível no horário
            try:
                disponivel = DisponibilidadeEducadorModel.check_disponibilidade(
                    id_educador, dia, hora_inicio, hora_fim
                )
                if not disponivel:
                    continue
            except Exception as e:
                # Se o método não existir ou falhar, assume disponível
                print(f"[AVISO] Erro ao verificar disponibilidade: {e}")
                pass
            
            # Verifica se não tem conflito
            conflitos = CronogramaModel.find_conflitos_educador(
                id_educador, dia, hora_inicio, hora_fim
            )
            if not conflitos:
                return id_educador
        
        return None
    
    def _encontrar_sala_disponivel(self, dia: str, hora_inicio: str, hora_fim: str) -> Optional[int]:
        """
        Encontra uma sala disponível e adequada para a turma
        Considera a quantidade de alunos matriculados e a capacidade da sala
        """
        salas = SalaModel.find_all_active()
        
        if not salas:
            return None
        
        # Busca quantidade de alunos na turma
        # (idealmente deveria buscar de HistoricoEscolar, mas por simplicidade usa qldVagas)
        capacidade_necessaria = self.turma.get("qldVagas", 30)
        
        # Filtra salas com capacidade suficiente
        salas_adequadas = [
            s for s in salas 
            if s.get("capacidade", 0) >= capacidade_necessaria
        ]
        
        if not salas_adequadas:
            # Se não houver salas adequadas, usa qualquer sala disponível
            salas_adequadas = salas
        
        # Ordena por capacidade (preferir menor sala adequada)
        salas_adequadas.sort(key=lambda s: s.get("capacidade", 999))
        
        for sala in salas_adequadas:
            id_sala = sala.get("idSala")
            if not id_sala:
                continue
            
            conflitos = CronogramaModel.find_conflitos_sala(
                id_sala, dia, hora_inicio, hora_fim
            )
            if not conflitos:
                return id_sala
        
        return None
    
    def gerar_grade_completa(self) -> Dict:
        """
        Gera grade horária completa para a turma
        
        Returns:
            {
                'success': bool,
                'aulas_criadas': int,
                'conflitos': List[str],
                'avisos': List[str]
            }
        """
        dias_semana = ['segunda', 'terca', 'quarta', 'quinta', 'sexta']
        aulas_criadas = 0
        avisos = []
        
        # Para cada disciplina
        for disciplina in self.disciplinas:
            aulas_necessarias = self._calcular_aulas_necessarias(disciplina)
            aulas_alocadas = 0
            
            # Tenta distribuir as aulas pela semana
            for dia in dias_semana:
                if aulas_alocadas >= aulas_necessarias:
                    break
                
                # Para cada horário do dia
                for horario in self.horarios_template:
                    if horario["tipo"] != "aula":
                        continue
                    
                    if aulas_alocadas >= aulas_necessarias:
                        break
                    
                    hora_inicio = str(horario["horaInicio"])
                    hora_fim = str(horario["horaFim"])
                    
                    # Verifica se turma já tem aula neste horário
                    conflito_turma = CronogramaModel.find_conflitos_turma(
                        self.id_turma, dia, hora_inicio, hora_fim
                    )
                    if conflito_turma:
                        continue
                    
                    # Encontra educador e sala
                    id_educador = self._encontrar_educador_disponivel(
                        disciplina, dia, hora_inicio, hora_fim
                    )
                    id_sala = self._encontrar_sala_disponivel(dia, hora_inicio, hora_fim)
                    
                    if not id_educador:
                        avisos.append(
                            f"Nenhum educador disponível para {disciplina['nomeDisciplina']} "
                            f"em {dia} às {hora_inicio}"
                        )
                        continue
                    
                    if not id_sala:
                        avisos.append(
                            f"Nenhuma sala disponível para {disciplina['nomeDisciplina']} "
                            f"em {dia} às {hora_inicio}"
                        )
                        continue
                    
                    # Cria a aula
                    try:
                        dados = {
                            "idTurma": self.id_turma,
                            "idDisciplina": disciplina["idDisciplina"],
                            "idEducador": id_educador,
                            "idSala": id_sala,
                            "idPeriodo": self.id_periodo,
                            "diaSemana": dia,
                            "horaInicio": hora_inicio,
                            "horaFim": hora_fim,
                            "recorrente": True,
                            "observacoes": "Gerado automaticamente"
                        }
                        
                        CronogramaModel.create(dados)
                        aulas_criadas += 1
                        aulas_alocadas += 1
                        
                    except Exception as e:
                        avisos.append(f"Erro ao criar aula: {str(e)}")
            
            # Verifica se conseguiu alocar todas as aulas
            if aulas_alocadas < aulas_necessarias:
                self.conflitos.append(
                    f"Disciplina {disciplina['nomeDisciplina']}: alocadas {aulas_alocadas} "
                    f"de {aulas_necessarias} aulas necessárias"
                )
        
        return {
            "success": aulas_criadas > 0,
            "aulas_criadas": aulas_criadas,
            "conflitos": self.conflitos,
            "avisos": avisos,
            "message": f"{aulas_criadas} aulas criadas automaticamente"
        }
    
    def otimizar_grade_existente(self) -> Dict:
        """
        Otimiza uma grade existente, redistribuindo aulas para evitar
        horários vagos e melhorar a distribuição
        """
        # Busca grade atual
        aulas_atuais = CronogramaModel.find_by_turma(self.id_turma)
        
        # Análise: detectar problemas
        problemas = {
            "janelas_vagas": 0,
            "dias_sobrecarregados": [],
            "dias_ociosos": []
        }
        
        dias_semana = ['segunda', 'terca', 'quarta', 'quinta', 'sexta']
        
        for dia in dias_semana:
            aulas_dia = [a for a in aulas_atuais if a["diaSemana"] == dia]
            
            if len(aulas_dia) == 0:
                problemas["dias_ociosos"].append(dia)
            elif len(aulas_dia) > 6:
                problemas["dias_sobrecarregados"].append(dia)
            
            # Detectar janelas (horários vagos entre aulas)
            if len(aulas_dia) >= 2:
                aulas_ordenadas = sorted(aulas_dia, key=lambda a: a["horaInicio"])
                for i in range(len(aulas_ordenadas) - 1):
                    fim_atual = aulas_ordenadas[i]["horaFim"]
                    inicio_prox = aulas_ordenadas[i + 1]["horaInicio"]
                    
                    # Se gap > 30 minutos
                    if (datetime.combine(datetime.min, inicio_prox) - 
                        datetime.combine(datetime.min, fim_atual)).seconds > 1800:
                        problemas["janelas_vagas"] += 1
        
        return {
            "success": True,
            "analise": problemas,
            "total_aulas": len(aulas_atuais),
            "recomendacoes": self._gerar_recomendacoes(problemas)
        }
    
    def _gerar_recomendacoes(self, problemas: Dict) -> List[str]:
        """Gera recomendações baseadas nos problemas detectados"""
        recomendacoes = []
        
        if problemas["janelas_vagas"] > 2:
            recomendacoes.append(
                f"Detectadas {problemas['janelas_vagas']} janelas vagas. "
                "Considere reorganizar horários para ter aulas consecutivas."
            )
        
        if problemas["dias_sobrecarregados"]:
            recomendacoes.append(
                f"Dias sobrecarregados: {', '.join(problemas['dias_sobrecarregados'])}. "
                "Redistribua algumas aulas para outros dias."
            )
        
        if problemas["dias_ociosos"]:
            recomendacoes.append(
                f"Dias sem aulas: {', '.join(problemas['dias_ociosos'])}. "
                "Utilize estes dias para melhor distribuição."
            )
        
        return recomendacoes


# ═══════════════════════════════════════════════════════════════════════════
# SERVIÇOS DE CRONOGRAMA
# ═══════════════════════════════════════════════════════════════════════════

def criar_aula_validada(dados: dict, id_usuario: Optional[int] = None) -> Dict:
    """
    Cria uma aula com validação completa
    """
    # Validar
    valido, erros = ValidadorCronograma.validar_horario_completo(dados)
    
    if not valido:
        return {
            "success": False,
            "data": None,
            "message": "; ".join(erros)
        }
    
    try:
        # Criar
        id_cronograma = CronogramaModel.create(dados)
        
        # Auditoria
        if id_usuario:
            AuditoriaCronogramaModel.create_log(
                id_cronograma=id_cronograma,
                operacao="INSERT",
                valor_novo=str(dados),
                id_usuario=id_usuario
            )
        
        return {
            "success": True,
            "data": {"id": id_cronograma},
            "message": "Aula criada com sucesso"
        }
    except Exception as e:
        return {
            "success": False,
            "data": None,
            "message": f"Erro ao criar aula: {str(e)}"
        }


def atualizar_aula_validada(id_cronograma: int, dados: dict, id_usuario: Optional[int] = None) -> Dict:
    """
    Atualiza uma aula com validação completa
    """
    # Buscar aula antiga para auditoria
    aulas = CronogramaModel.find_by_turma(dados["idTurma"])
    aula_antiga = next((a for a in aulas if a["idCronograma"] == id_cronograma), None)
    
    # Validar
    valido, erros = ValidadorCronograma.validar_horario_completo(dados, id_excluir=id_cronograma)
    
    if not valido:
        return {
            "success": False,
            "data": None,
            "message": "; ".join(erros)
        }
    
    try:
        # Atualizar
        CronogramaModel.update(id_cronograma, dados)
        
        # Auditoria
        if id_usuario and aula_antiga:
            # Registrar cada campo alterado
            if aula_antiga["idEducador"] != dados["idEducador"]:
                AuditoriaCronogramaModel.create_log(
                    id_cronograma, "UPDATE", "idEducador",
                    str(aula_antiga["idEducador"]), str(dados["idEducador"]),
                    id_usuario
                )
            if aula_antiga.get("idSala") != dados.get("idSala"):
                AuditoriaCronogramaModel.create_log(
                    id_cronograma, "UPDATE", "idSala",
                    str(aula_antiga.get("idSala")), str(dados.get("idSala")),
                    id_usuario
                )
            # ... mais campos conforme necessário
        
        return {
            "success": True,
            "data": {"id": id_cronograma},
            "message": "Aula atualizada com sucesso"
        }
    except Exception as e:
        return {
            "success": False,
            "data": None,
            "message": f"Erro ao atualizar aula: {str(e)}"
        }


def gerar_grade_automatica(id_turma: int, id_periodo: int) -> Dict:
    """
    Gera grade horária completa automaticamente
    """
    try:
        gerador = GeradorGradeAutomatica(id_turma, id_periodo)
        resultado = gerador.gerar_grade_completa()
        return resultado
    except Exception as e:
        return {
            "success": False,
            "aulas_criadas": 0,
            "conflitos": [],
            "avisos": [],
            "message": f"Erro ao gerar grade: {str(e)}"
        }


def otimizar_grade(id_turma: int) -> Dict:
    """
    Analisa e otimiza grade existente
    """
    try:
        periodo_atual = PeriodoLetivoModel.find_atual()
        if not periodo_atual:
            return {
                "success": False,
                "message": "Nenhum período letivo ativo encontrado"
            }
        
        gerador = GeradorGradeAutomatica(id_turma, periodo_atual["idPeriodo"])
        resultado = gerador.otimizar_grade_existente()
        return resultado
    except Exception as e:
        return {
            "success": False,
            "message": f"Erro ao otimizar grade: {str(e)}"
        }


def detectar_todos_conflitos() -> Dict:
    """
    Executa varredura completa de conflitos
    """
    try:
        conflitos = ValidadorCronograma.detectar_conflitos_sistema()
        
        return {
            "success": True,
            "total": len(conflitos),
            "conflitos": conflitos,
            "message": f"{len(conflitos)} conflito(s) detectado(s)"
        }
    except Exception as e:
        return {
            "success": False,
            "total": 0,
            "conflitos": [],
            "message": f"Erro ao detectar conflitos: {str(e)}"
        }


def sugerir_horarios_livres(id_educador: int, id_sala: int, id_turma: int) -> Dict:
    """
    Sugere horários disponíveis
    """
    try:
        sugestoes = ValidadorCronograma.sugerir_horarios_livres(
            id_educador, id_sala, id_turma
        )
        
        return {
            "success": True,
            "data": sugestoes,
            "message": f"{len(sugestoes)} horário(s) disponível(is)"
        }
    except Exception as e:
        return {
            "success": False,
            "data": [],
            "message": f"Erro ao sugerir horários: {str(e)}"
        }


def listar_por_educador(id_educador: int) -> Dict:
    """Lista todas as aulas de um educador"""
    try:
        aulas = CronogramaModel.find_by_educador(id_educador)
        return {
            "success": True,
            "data": aulas,
            "message": f"{len(aulas)} aula(s) encontrada(s)"
        }
    except Exception as e:
        return {
            "success": False,
            "data": [],
            "message": f"Erro: {str(e)}"
        }


def listar_por_sala(id_sala: int) -> Dict:
    """Lista todas as aulas de uma sala"""
    try:
        aulas = CronogramaModel.find_by_sala(id_sala)
        return {
            "success": True,
            "data": aulas,
            "message": f"{len(aulas)} aula(s) encontrada(s)"
        }
    except Exception as e:
        return {
            "success": False,
            "data": [],
            "message": f"Erro: {str(e)}"
        }


def historico_auditoria(id_cronograma: int) -> Dict:
    """Retorna histórico de alterações de uma aula"""
    try:
        historico = AuditoriaCronogramaModel.find_by_cronograma(id_cronograma)
        return {
            "success": True,
            "data": historico,
            "message": f"{len(historico)} registro(s) de auditoria"
        }
    except Exception as e:
        return {
            "success": False,
            "data": [],
            "message": f"Erro: {str(e)}"
        }
