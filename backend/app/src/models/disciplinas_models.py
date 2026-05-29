# ══════════════════════════════════════════════════════════════════════════════
# NOVOS MODELS - SISTEMA DE DISCIPLINAS PROFISSIONAL
# Adicionado em: 2026-05-24
# ══════════════════════════════════════════════════════════════════════════════

from __future__ import annotations

from app.src.models.base import BaseModel
from app.src.adapters.db_adapter import execute_query, execute_write


class AreaConhecimentoModel(BaseModel):
    """Model para áreas de conhecimento (BNCC)"""
    TABLE = "areas_conhecimento"

    @classmethod
    def find_all(cls, ativa=True) -> list[dict]:
        """Retorna todas as áreas de conhecimento"""
        if ativa is not None:
            return execute_query(
                "SELECT * FROM areas_conhecimento WHERE ativa = %s ORDER BY ordem, nome",
                (ativa,)
            )
        return execute_query("SELECT * FROM areas_conhecimento ORDER BY ordem, nome")

    @classmethod
    def find_by_id(cls, id_area: int) -> dict | None:
        """Retorna uma área pelo ID"""
        rows = execute_query(
            "SELECT * FROM areas_conhecimento WHERE idAreaConhecimento = %s",
            (id_area,)
        )
        return rows[0] if rows else None

    @classmethod
    def find_by_sigla(cls, sigla: str) -> dict | None:
        """Retorna uma área pela sigla"""
        rows = execute_query(
            "SELECT * FROM areas_conhecimento WHERE sigla = %s",
            (sigla,)
        )
        return rows[0] if rows else None


class TipoDisciplinaModel(BaseModel):
    """Model para tipos de disciplina"""
    TABLE = "tipos_disciplina"

    @classmethod
    def find_all(cls, ativa=True) -> list[dict]:
        """Retorna todos os tipos de disciplina"""
        if ativa is not None:
            return execute_query(
                "SELECT * FROM tipos_disciplina WHERE ativa = %s ORDER BY ordem, nome",
                (ativa,)
            )
        return execute_query("SELECT * FROM tipos_disciplina ORDER BY ordem, nome")

    @classmethod
    def find_by_id(cls, id_tipo: int) -> dict | None:
        """Retorna um tipo pelo ID"""
        rows = execute_query(
            "SELECT * FROM tipos_disciplina WHERE idTipoDisciplina = %s",
            (id_tipo,)
        )
        return rows[0] if rows else None

    @classmethod
    def find_by_codigo(cls, codigo: str) -> dict | None:
        """Retorna um tipo pelo código"""
        rows = execute_query(
            "SELECT * FROM tipos_disciplina WHERE codigo = %s",
            (codigo,)
        )
        return rows[0] if rows else None


class EtapaEnsinoModel(BaseModel):
    """Model para etapas de ensino"""
    TABLE = "etapas_ensino"

    @classmethod
    def find_all(cls, ativa=True) -> list[dict]:
        """Retorna todas as etapas de ensino"""
        if ativa is not None:
            return execute_query(
                "SELECT * FROM etapas_ensino WHERE ativa = %s ORDER BY ordem, nome",
                (ativa,)
            )
        return execute_query("SELECT * FROM etapas_ensino ORDER BY ordem, nome")

    @classmethod
    def find_by_id(cls, id_etapa: int) -> dict | None:
        """Retorna uma etapa pelo ID"""
        rows = execute_query(
            "SELECT * FROM etapas_ensino WHERE idEtapaEnsino = %s",
            (id_etapa,)
        )
        return rows[0] if rows else None

    @classmethod
    def find_by_codigo(cls, codigo: str) -> dict | None:
        """Retorna uma etapa pelo código"""
        rows = execute_query(
            "SELECT * FROM etapas_ensino WHERE codigo = %s",
            (codigo,)
        )
        return rows[0] if rows else None


class TurmaDisciplinaModel(BaseModel):
    """Model para ofertas de disciplinas (turma_disciplinas)"""
    TABLE = "turma_disciplinas"

    @classmethod
    def find_all(cls) -> list[dict]:
        """Retorna todas as ofertas com informações completas"""
        return execute_query("""
            SELECT 
                td.*,
                t.codTurma, t.nomeTurma, t.serie, t.periodo, t.anoLetivo,
                d.codDisciplina, d.nomeDisciplina,
                a.nome AS areaConhecimento, a.cor AS areaCor,
                ed.nomeCompleto AS nomeEducador, ed.email AS emailEducador
            FROM turma_disciplinas td
            INNER JOIN Turmas t ON td.idTurma = t.idTurma
            INNER JOIN Disciplinas d ON td.idDisciplina = d.idDisciplina
            LEFT JOIN areas_conhecimento a ON d.idAreaConhecimento = a.idAreaConhecimento
            LEFT JOIN Educador ed ON td.idEducador = ed.idMatricula
            ORDER BY t.anoLetivo DESC, t.nomeTurma, d.nomeDisciplina
        """)

    @classmethod
    def find_by_turma(cls, id_turma: int) -> list[dict]:
        """Retorna todas as disciplinas de uma turma"""
        return execute_query("""
            SELECT 
                td.*,
                d.codDisciplina, d.nomeDisciplina, d.cargaHoraria,
                a.nome AS areaConhecimento, a.sigla AS areaSigla, a.cor AS areaCor,
                t.nome AS tipoDisciplina,
                ed.nomeCompleto AS nomeEducador, ed.email AS emailEducador
            FROM turma_disciplinas td
            INNER JOIN Disciplinas d ON td.idDisciplina = d.idDisciplina
            LEFT JOIN areas_conhecimento a ON d.idAreaConhecimento = a.idAreaConhecimento
            LEFT JOIN tipos_disciplina t ON d.idTipoDisciplina = t.idTipoDisciplina
            LEFT JOIN Educador ed ON td.idEducador = ed.idMatricula
            WHERE td.idTurma = %s
            ORDER BY d.nomeDisciplina
        """, (id_turma,))

    @classmethod
    def find_by_educador(cls, id_educador: str) -> list[dict]:
        """Retorna todas as ofertas de um educador"""
        return execute_query("""
            SELECT 
                td.*,
                t.codTurma, t.nomeTurma, t.serie, t.periodo, t.anoLetivo,
                d.codDisciplina, d.nomeDisciplina,
                a.nome AS areaConhecimento
            FROM turma_disciplinas td
            INNER JOIN Turmas t ON td.idTurma = t.idTurma
            INNER JOIN Disciplinas d ON td.idDisciplina = d.idDisciplina
            LEFT JOIN areas_conhecimento a ON d.idAreaConhecimento = a.idAreaConhecimento
            WHERE td.idEducador = %s
            ORDER BY t.anoLetivo DESC, t.nomeTurma, d.nomeDisciplina
        """, (id_educador,))

    @classmethod
    def find_by_id(cls, id_turma_disciplina: int) -> dict | None:
        """Retorna uma oferta específica"""
        rows = execute_query("""
            SELECT 
                td.*,
                t.codTurma, t.nomeTurma, t.serie, t.periodo, t.anoLetivo,
                d.codDisciplina, d.nomeDisciplina, d.cargaHoraria,
                a.nome AS areaConhecimento, a.sigla AS areaSigla,
                tp.nome AS tipoDisciplina,
                ed.nomeCompleto AS nomeEducador
            FROM turma_disciplinas td
            INNER JOIN Turmas t ON td.idTurma = t.idTurma
            INNER JOIN Disciplinas d ON td.idDisciplina = d.idDisciplina
            LEFT JOIN areas_conhecimento a ON d.idAreaConhecimento = a.idAreaConhecimento
            LEFT JOIN tipos_disciplina tp ON d.idTipoDisciplina = tp.idTipoDisciplina
            LEFT JOIN Educador ed ON td.idEducador = ed.idMatricula
            WHERE td.idTurmaDisciplina = %s
        """, (id_turma_disciplina,))
        return rows[0] if rows else None

    @classmethod
    def create(cls, data: dict) -> int:
        """Cria uma nova oferta de disciplina"""
        return execute_write("""
            INSERT INTO turma_disciplinas (
                idTurma, idDisciplina, idEducador,
                carga_horaria_semanal, carga_horaria_total,
                semanas_letivas, aulas_por_semana, duracao_aula_minutos,
                carga_horaria_teorica, carga_horaria_pratica,
                dia_semana, horario, status, observacoes
            ) VALUES (
                %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
            )
        """, (
            data['idTurma'],
            data['idDisciplina'],
            data.get('idEducador'),
            data.get('carga_horaria_semanal'),
            data.get('carga_horaria_total'),
            data.get('semanas_letivas', 40),
            data.get('aulas_por_semana'),
            data.get('duracao_aula_minutos', 50),
            data.get('carga_horaria_teorica'),
            data.get('carga_horaria_pratica'),
            data.get('dia_semana'),
            data.get('horario'),
            data.get('status', 'planejada'),
            data.get('observacoes')
        ))

    @classmethod
    def update(cls, id_turma_disciplina: int, data: dict) -> int:
        """Atualiza uma oferta"""
        return execute_write("""
            UPDATE turma_disciplinas SET
                idEducador = %s,
                carga_horaria_semanal = %s,
                carga_horaria_total = %s,
                semanas_letivas = %s,
                aulas_por_semana = %s,
                duracao_aula_minutos = %s,
                carga_horaria_teorica = %s,
                carga_horaria_pratica = %s,
                dia_semana = %s,
                horario = %s,
                status = %s,
                observacoes = %s
            WHERE idTurmaDisciplina = %s
        """, (
            data.get('idEducador'),
            data.get('carga_horaria_semanal'),
            data.get('carga_horaria_total'),
            data.get('semanas_letivas'),
            data.get('aulas_por_semana'),
            data.get('duracao_aula_minutos'),
            data.get('carga_horaria_teorica'),
            data.get('carga_horaria_pratica'),
            data.get('dia_semana'),
            data.get('horario'),
            data.get('status'),
            data.get('observacoes'),
            id_turma_disciplina
        ))

    @classmethod
    def delete(cls, id_turma_disciplina: int) -> int:
        """Remove uma oferta"""
        return execute_write(
            "DELETE FROM turma_disciplinas WHERE idTurmaDisciplina = %s",
            (id_turma_disciplina,)
        )
