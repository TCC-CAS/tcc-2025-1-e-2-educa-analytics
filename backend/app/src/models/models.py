from app.src.models.base import BaseModel
from app.src.adapters.db_adapter import execute_query, execute_write


class UsuarioModel(BaseModel):
    TABLE = "usuarios"

    @classmethod
    def find_by_email(cls, email: str) -> dict | None:
        rows = execute_query(
            "SELECT * FROM usuarios WHERE email = %s LIMIT 1", (email,)
        )
        return rows[0] if rows else None

    @classmethod
    def create(cls, nome: str, email: str, senha_hash: str, perfil: str) -> int:
        return execute_write(
            """
            INSERT INTO usuarios (nome, email, senha_hash, perfil)
            VALUES (%s, %s, %s, %s)
            """,
            (nome, email, senha_hash, perfil),
        )


class AlunoModel(BaseModel):
    TABLE = "alunos"

    @classmethod
    def create(cls, nome: str, email: str, matricula: str, turma_id: int) -> int:
        return execute_write(
            """
            INSERT INTO alunos (nome, email, matricula, turma_id)
            VALUES (%s, %s, %s, %s)
            """,
            (nome, email, matricula, turma_id),
        )

    @classmethod
    def find_by_turma(cls, turma_id: int) -> list[dict]:
        return execute_query(
            "SELECT * FROM alunos WHERE turma_id = %s", (turma_id,)
        )

    @classmethod
    def update(cls, aluno_id: int, nome: str, email: str, turma_id: int) -> int:
        return execute_write(
            """
            UPDATE alunos SET nome = %s, email = %s, turma_id = %s
            WHERE id = %s
            """,
            (nome, email, turma_id, aluno_id),
        )


class TurmaModel(BaseModel):
    TABLE = "turmas"

    @classmethod
    def create(cls, nome: str, ano: int, periodo: str) -> int:
        return execute_write(
            "INSERT INTO turmas (nome, ano, periodo) VALUES (%s, %s, %s)",
            (nome, ano, periodo),
        )


class NotaModel(BaseModel):
    TABLE = "notas"

    @classmethod
    def find_by_aluno(cls, aluno_id: int) -> list[dict]:
        return execute_query(
            """
            SELECT n.*, d.nome AS disciplina_nome
            FROM notas n
            JOIN disciplinas d ON d.id = n.disciplina_id
            WHERE n.aluno_id = %s
            """,
            (aluno_id,),
        )

    @classmethod
    def create(cls, aluno_id: int, disciplina_id: int, valor: float, bimestre: int) -> int:
        return execute_write(
            """
            INSERT INTO notas (aluno_id, disciplina_id, valor, bimestre)
            VALUES (%s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE valor = %s
            """,
            (aluno_id, disciplina_id, valor, bimestre, valor),
        )


class FrequenciaModel(BaseModel):
    TABLE = "frequencias"

    @classmethod
    def find_by_aluno(cls, aluno_id: int) -> list[dict]:
        return execute_query(
            """
            SELECT f.*, d.nome AS disciplina_nome
            FROM frequencias f
            JOIN disciplinas d ON d.id = f.disciplina_id
            WHERE f.aluno_id = %s
            """,
            (aluno_id,),
        )

    @classmethod
    def registrar(cls, aluno_id: int, disciplina_id: int, data_aula: str, presente: bool) -> int:
        return execute_write(
            """
            INSERT INTO frequencias (aluno_id, disciplina_id, data_aula, presente)
            VALUES (%s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE presente = %s
            """,
            (aluno_id, disciplina_id, data_aula, presente, presente),
        )


class DisciplinaModel(BaseModel):
    TABLE = "disciplinas"

    @classmethod
    def create(cls, nome: str, carga_horaria: int) -> int:
        return execute_write(
            "INSERT INTO disciplinas (nome, carga_horaria) VALUES (%s, %s)",
            (nome, carga_horaria),
        )
