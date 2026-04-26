from __future__ import annotations

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


# â”€â”€ Educando / ResponsÃ¡vel â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

class EducandoResponsavelModel(BaseModel):
    TABLE = "EducandoResponsavel"

    @classmethod
    def find_by_id(cls, id_matricula: str) -> dict | None:
        rows = execute_query(
            "SELECT * FROM EducandoResponsavel WHERE idMatricula = %s LIMIT 1",
            (id_matricula,),
        )
        return rows[0] if rows else None

    @classmethod
    def find_by_cpf(cls, cpf: str) -> dict | None:
        rows = execute_query(
            "SELECT * FROM EducandoResponsavel WHERE cpf = %s LIMIT 1",
            (cpf,),
        )
        return rows[0] if rows else None

    @classmethod
    def create(cls, data: dict) -> str:
        execute_write(
            """
            INSERT INTO EducandoResponsavel
                (idMatricula, nomeCompleto, nacionalidade, genero, cor,
                 dataNascimento, idade, telefone, email, cpf,
                 rg, orgaoEmissor, estadoEmissor, idStatus, tipoUsuario)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
            """,
            (
                data["idMatricula"], data["nomeCompleto"], data.get("nacionalidade"),
                data.get("genero"), data.get("cor"), data.get("dataNascimento"),
                data.get("idade"), data.get("telefone"), data.get("email"),
                data.get("cpf"), data.get("rg"), data.get("orgaoEmissor"),
                data.get("estadoEmissor"), data.get("idStatus", "Ativa"), data["tipoUsuario"],
            ),
        )
        return data["idMatricula"]

    @classmethod
    def find_educandos(cls) -> list[dict]:
        return execute_query(
            "SELECT * FROM EducandoResponsavel WHERE tipoUsuario = 'educando' ORDER BY nomeCompleto"
        )

    # Constante SQL reutilizada por listar_matriculas
    _LIST_SQL = """
        SELECT
            e.idMatricula,
            e.nomeCompleto         AS alunoNome,
            DATE_FORMAT(e.dataNascimento, '%%Y-%%m-%%d') AS alunoNascimento,
            e.idade                AS alunoIdade,
            e.genero               AS alunoGenero,
            e.cor                  AS alunoCorRaca,
            e.cpf                  AS alunoCpf,
            e.rg                   AS alunoRg,
            e.email                AS alunoEmail,
            e.telefone             AS alunoTelefone,
            e.idStatus             AS status,
            DATE_FORMAT(e.createdAt, '%%Y-%%m-%%d') AS dataMatricula,
            h.serie,
            h.anoLetivo,
            h.situacao,
            h.idResponsavel,
            t.codTurma             AS codigoTurma,
            t.nomeTurma            AS turma,
            t.periodo,
            DATE_FORMAT(t.dataInicio, '%%Y-%%m-%%d') AS dataInicio,
            DATE_FORMAT(t.dataFim,    '%%Y-%%m-%%d') AS dataTermino,
            s.nomeSala             AS sala,
            ROW_NUMBER() OVER (ORDER BY e.nomeCompleto, e.idMatricula) AS id
        FROM EducandoResponsavel e
        LEFT JOIN HistoricoEscolar h
            ON h.idMatricula = e.idMatricula
            AND h.idHistorico = (
                SELECT h2.idHistorico
                FROM HistoricoEscolar h2
                WHERE h2.idMatricula = e.idMatricula
                ORDER BY h2.anoLetivo DESC, h2.idHistorico DESC
                LIMIT 1
            )
        LEFT JOIN Turmas t ON t.idTurma = h.idTurma
        LEFT JOIN Salas  s ON s.idSala  = t.idSala
        WHERE e.tipoUsuario = 'educando'
        ORDER BY e.nomeCompleto, e.idMatricula
    """

    @classmethod
    def find_lista(cls) -> list[dict]:
        """Retorna todos os educandos com dados do Ãºltimo histÃ³rico.

        Usa try/except para suportar bancos onde createdAt ou idResponsavel
        ainda nÃ£o existem (migraÃ§Ã£o pendente).
        """
        try:
            return execute_query(cls._LIST_SQL)
        except Exception:
            # Fallback: substitui colunas que podem nÃ£o existir antes da migraÃ§Ã£o
            sql = (
                cls._LIST_SQL
                .replace(
                    "DATE_FORMAT(e.createdAt, '%%Y-%%m-%%d') AS dataMatricula,",
                    "NULL AS dataMatricula,",
                )
                .replace(
                    "h.idResponsavel,",
                    "NULL AS idResponsavel,",
                )
            )
            return execute_query(sql)

    @classmethod
    def update_status(cls, id_matricula: str, novo_status: str) -> None:
        execute_write(
            "UPDATE EducandoResponsavel SET idStatus = %s WHERE idMatricula = %s",
            (novo_status, id_matricula),
        )

    @classmethod
    def update_data(cls, id_matricula: str, data: dict) -> None:
        execute_write(
            """
            UPDATE EducandoResponsavel SET
                nomeCompleto   = %s,
                nacionalidade  = %s,
                genero         = %s,
                cor            = %s,
                dataNascimento = %s,
                idade          = %s,
                telefone       = %s,
                email          = %s,
                rg             = %s,
                orgaoEmissor   = %s,
                estadoEmissor  = %s
            WHERE idMatricula = %s
            """,
            (
                data.get("nomeCompleto"),  data.get("nacionalidade"),
                data.get("genero"),        data.get("cor"),
                data.get("dataNascimento"), data.get("idade"),
                data.get("telefone"),      data.get("email"),
                data.get("rg"),            data.get("orgaoEmissor"),
                data.get("estadoEmissor"), id_matricula,
            ),
        )


# â”€â”€ EndereÃ§o â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

class EnderecoModel(BaseModel):
    TABLE = "Endereco"

    @classmethod
    def create(cls, data: dict) -> None:
        execute_write(
            """
            INSERT INTO Endereco
                (idMatricula, tipoUsuario, cep, logradouro, numero,
                 complemento, bairro, uf, cidade)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s)
            ON DUPLICATE KEY UPDATE
                cep = VALUES(cep), logradouro = VALUES(logradouro),
                numero = VALUES(numero), complemento = VALUES(complemento),
                bairro = VALUES(bairro), uf = VALUES(uf), cidade = VALUES(cidade)
            """,
            (
                data["idMatricula"], data["tipoUsuario"], data.get("cep"),
                data.get("logradouro"), data.get("numero"), data.get("complemento"),
                data.get("bairro"), data.get("uf"), data.get("cidade"),
            ),
        )

    @classmethod
    def find_by_matricula(cls, id_matricula: str) -> list[dict]:
        return execute_query(
            "SELECT * FROM Endereco WHERE idMatricula = %s", (id_matricula,)
        )


# â”€â”€ Login â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

class LoginModel(BaseModel):
    TABLE = "Login"

    @classmethod
    def create(cls, id_matricula: str, email: str, senha_hash: str) -> None:
        execute_write(
            """
            INSERT IGNORE INTO Login (idMatricula, email, senha)
            VALUES (%s, %s, %s)
            """,
            (id_matricula, email, senha_hash),
        )

    @classmethod
    def save_token(cls, id_matricula: str, token: str, expiracao: str) -> None:
        """Persiste o token de criaÃ§Ã£o de senha e sua expiraÃ§Ã£o."""
        execute_write(
            """
            UPDATE Login
               SET token_criacao_senha = %s,
                   token_expiracao     = %s,
                   senha_definida      = 0
             WHERE idMatricula = %s
            """,
            (token, expiracao, id_matricula),
        )

    @classmethod
    def find_by_matricula(cls, id_matricula: str) -> dict | None:
        rows = execute_query(
            "SELECT idMatricula, email FROM Login WHERE idMatricula = %s LIMIT 1",
            (id_matricula,),
        )
        return rows[0] if rows else None


# â”€â”€ Turmas â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

class TurmaModel(BaseModel):
    TABLE = "Turmas"

    @classmethod
    def find_by_id(cls, id_turma: int) -> dict | None:
        rows = execute_query(
            "SELECT * FROM Turmas WHERE idTurma = %s LIMIT 1", (id_turma,)
        )
        return rows[0] if rows else None

    @classmethod
    def find_by_cod_ano(cls, cod_turma: str, ano_letivo: str) -> dict | None:
        rows = execute_query(
            "SELECT * FROM Turmas WHERE codTurma = %s AND anoLetivo = %s LIMIT 1",
            (cod_turma, ano_letivo),
        )
        return rows[0] if rows else None

    @classmethod
    def find_filtered(
        cls,
        ano_letivo: str | None = None,
        serie: str | None = None,
        periodo: str | None = None,
    ) -> list[dict]:
        conditions = ["t.status = 'ativa'"]
        params: list = []
        if ano_letivo:
            conditions.append("t.anoLetivo = %s")
            params.append(ano_letivo)
        if serie:
            conditions.append("t.serie = %s")
            params.append(serie)
        if periodo:
            conditions.append("t.periodo = %s")
            params.append(periodo)
        where = " AND ".join(conditions)
        return execute_query(
            f"""
            SELECT t.*, s.nomeSala
            FROM Turmas t
            LEFT JOIN Salas s ON s.idSala = t.idSala
            WHERE {where}
            ORDER BY t.serie, t.codTurma
            """,
            tuple(params),
        )

    @classmethod
    def find_series_by_ano(cls, ano_letivo: str) -> list[str]:
        rows = execute_query(
            """
            SELECT DISTINCT serie FROM Turmas
            WHERE anoLetivo = %s AND status = 'ativa' AND serie IS NOT NULL
            ORDER BY serie
            """,
            (ano_letivo,),
        )
        return [r["serie"] for r in rows]

    @classmethod
    def find_periodos_by_ano_serie(cls, ano_letivo: str, serie: str) -> list[str]:
        rows = execute_query(
            """
            SELECT DISTINCT periodo FROM Turmas
            WHERE anoLetivo = %s AND serie = %s AND status = 'ativa'
            ORDER BY periodo
            """,
            (ano_letivo, serie),
        )
        return [r["periodo"] for r in rows]

    @classmethod
    def create(cls, data: dict) -> int:
        return execute_write(
            """
            INSERT INTO Turmas
                (codTurma, nomeTurma, periodo, anoLetivo, serie,
                 qldVagas, dataInicio, dataFim, status, idSala)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
            """,
            (
                data["codTurma"], data["nomeTurma"], data["periodo"],
                data["anoLetivo"], data.get("serie"), data.get("qldVagas", 30),
                data.get("dataInicio"), data.get("dataFim"),
                data.get("status", "ativa"), data.get("idSala"),
            ),
        )


# â”€â”€ HistÃ³rico Escolar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

class HistoricoEscolarModel(BaseModel):
    TABLE = "HistoricoEscolar"

    @classmethod
    def find_by_matricula(cls, id_matricula: str) -> list[dict]:
        return execute_query(
            """
            SELECT h.*,
                   t.nomeTurma, t.codTurma, t.periodo,
                   DATE_FORMAT(t.dataInicio, '%%Y-%%m-%%d') AS dataInicio,
                   DATE_FORMAT(t.dataFim,    '%%Y-%%m-%%d') AS dataTermino,
                   s.nomeSala AS sala
            FROM HistoricoEscolar h
            LEFT JOIN Turmas t ON t.idTurma = h.idTurma
            LEFT JOIN Salas  s ON s.idSala  = t.idSala
            WHERE h.idMatricula = %s
            ORDER BY h.anoLetivo DESC
            """,
            (id_matricula,),
        )

    @classmethod
    def count_by_turma(cls, id_turma: int) -> int:
        rows = execute_query(
            """
            SELECT COUNT(*) AS total FROM HistoricoEscolar
            WHERE idTurma = %s AND situacao = 'cursando'
            """,
            (id_turma,),
        )
        return rows[0]["total"] if rows else 0

    @classmethod
    def create(cls, id_matricula: str, id_turma: int, serie: str, ano_letivo: str) -> int:
        return execute_write(
            """
            INSERT INTO HistoricoEscolar
                (idMatricula, idTurma, serie, anoLetivo, situacao)
            VALUES (%s, %s, %s, %s, 'cursando')
            """,
            (id_matricula, id_turma, serie, ano_letivo),
        )


# â”€â”€ Colaborador â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

class ColaboradorModel(BaseModel):
    TABLE = "Colaborador"

    @classmethod
    def find_all(cls) -> list[dict]:
        return execute_query("SELECT * FROM Colaborador ORDER BY nomeCompleto")

    @classmethod
    def find_by_id(cls, id_matricula: str) -> dict | None:
        rows = execute_query(
            "SELECT * FROM Colaborador WHERE idMatricula = %s LIMIT 1", (id_matricula,)
        )
        return rows[0] if rows else None

    @classmethod
    def find_by_cpf(cls, cpf: str) -> dict | None:
        rows = execute_query(
            "SELECT * FROM Colaborador WHERE cpf = %s LIMIT 1", (cpf,)
        )
        return rows[0] if rows else None

    @classmethod
    def create(cls, data: dict) -> str:
        execute_write(
            """
            INSERT INTO Colaborador
                (idMatricula, nomeCompleto, nacionalidade, genero, cor,
                 dataNascimento, idade, telefone, email, cpf,
                 rg, orgaoEmissor, estadoEmissor, idStatus, tipoUsuario,
                 cargo, departamento)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,1,'colaborador',%s,%s)
            """,
            (
                data["idMatricula"], data["nomeCompleto"], data.get("nacionalidade"),
                data.get("genero"), data.get("cor"), data.get("dataNascimento") or None,
                data.get("idade"), data.get("telefone"), data["email"],
                data["cpf"], data.get("rg"), data.get("orgaoEmissor"),
                data.get("estadoEmissor"), data.get("cargo"), data.get("departamento"),
            ),
        )
        return data["idMatricula"]

    @classmethod
    def update(cls, id_matricula: str, data: dict) -> int:
        return execute_write(
            """
            UPDATE Colaborador SET
                nomeCompleto=%s, nacionalidade=%s, genero=%s, cor=%s,
                dataNascimento=%s, idade=%s, telefone=%s, email=%s,
                cpf=%s, rg=%s, orgaoEmissor=%s, estadoEmissor=%s,
                cargo=%s, departamento=%s
            WHERE idMatricula = %s
            """,
            (
                data.get("nomeCompleto"), data.get("nacionalidade"), data.get("genero"),
                data.get("cor"), data.get("dataNascimento") or None, data.get("idade"),
                data.get("telefone"), data.get("email"), data.get("cpf"),
                data.get("rg"), data.get("orgaoEmissor"), data.get("estadoEmissor"),
                data.get("cargo"), data.get("departamento"), id_matricula,
            ),
        )

    @classmethod
    def set_status(cls, id_matricula: str, ativo: int) -> int:
        return execute_write(
            "UPDATE Colaborador SET idStatus = %s WHERE idMatricula = %s",
            (ativo, id_matricula),
        )

    @classmethod
    def delete_by_matricula(cls, id_matricula: str) -> int:
        return execute_write(
            "DELETE FROM Colaborador WHERE idMatricula = %s", (id_matricula,)
        )


# â”€â”€ EducadorDisciplina â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

class EducadorDisciplinaModel(BaseModel):
    TABLE = "EducadorDisciplina"

    @classmethod
    def find_by_matricula(cls, id_matricula: str) -> list[int]:
        rows = execute_query(
            "SELECT idDisciplina FROM EducadorDisciplina WHERE idMatricula = %s",
            (id_matricula,),
        )
        return [r["idDisciplina"] for r in rows]

    @classmethod
    def replace_all(cls, id_matricula: str, ids_disciplinas: list[int]) -> None:
        execute_write(
            "DELETE FROM EducadorDisciplina WHERE idMatricula = %s", (id_matricula,)
        )
        for id_disc in ids_disciplinas:
            execute_write(
                "INSERT IGNORE INTO EducadorDisciplina (idMatricula, idDisciplina) VALUES (%s, %s)",
                (id_matricula, id_disc),
            )


# â”€â”€ Educador â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

class EducadorModel(BaseModel):
    TABLE = "Educador"

    @classmethod
    def find_all(cls) -> list[dict]:
        return execute_query("SELECT * FROM Educador ORDER BY nomeCompleto")

    @classmethod
    def find_by_id(cls, id_matricula: str) -> dict | None:
        rows = execute_query(
            "SELECT * FROM Educador WHERE idMatricula = %s LIMIT 1", (id_matricula,)
        )
        return rows[0] if rows else None

    @classmethod
    def find_by_cpf(cls, cpf: str) -> dict | None:
        rows = execute_query(
            "SELECT * FROM Educador WHERE cpf = %s LIMIT 1", (cpf,)
        )
        return rows[0] if rows else None

    @classmethod
    def create(cls, data: dict) -> str:
        import json as _json
        periodos_json = _json.dumps(data.get("periodos") or [], ensure_ascii=False)
        execute_write(
            """
            INSERT INTO Educador
                (idMatricula, nomeCompleto, nacionalidade, genero, cor,
                 dataNascimento, idade, telefone, email, cpf,
                 rg, orgaoEmissor, estadoEmissor, idStatus, tipoUsuario,
                 cargo, departamento, periodos)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,'Ativo','educador','educador',%s,%s)
            """,
            (
                data["idMatricula"], data["nomeCompleto"], data.get("nacionalidade"),
                data.get("genero"), data.get("cor"), data.get("dataNascimento") or None,
                data.get("idade"), data.get("telefone"), data["email"],
                data["cpf"], data.get("rg"), data.get("orgaoEmissor"),
                data.get("estadoEmissor"), u"Educa\u00e7\u00e3o", periodos_json,
            ),
        )
        return data["idMatricula"]

    @classmethod
    def update(cls, id_matricula: str, data: dict) -> int:
        import json as _json
        periodos_json = _json.dumps(data.get("periodos") or [], ensure_ascii=False)
        return execute_write(
            """
            UPDATE Educador SET
                nomeCompleto=%s, nacionalidade=%s, genero=%s, cor=%s,
                dataNascimento=%s, idade=%s, telefone=%s, email=%s,
                cpf=%s, rg=%s, orgaoEmissor=%s, estadoEmissor=%s,
                periodos=%s
            WHERE idMatricula = %s
            """,
            (
                data.get("nomeCompleto"), data.get("nacionalidade"), data.get("genero"),
                data.get("cor"), data.get("dataNascimento") or None, data.get("idade"),
                data.get("telefone"), data.get("email"), data.get("cpf"),
                data.get("rg"), data.get("orgaoEmissor"), data.get("estadoEmissor"),
                periodos_json, id_matricula,
            ),
        )

    @classmethod
    def set_status(cls, id_matricula: str, ativo: int) -> int:
        return execute_write(
            "UPDATE Educador SET idStatus = %s WHERE idMatricula = %s",
            (ativo, id_matricula),
        )

    @classmethod
    def delete_by_matricula(cls, id_matricula: str) -> int:
        return execute_write(
            "DELETE FROM Educador WHERE idMatricula = %s", (id_matricula,)
        )


# â”€â”€ FormacaoAcademica â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

class FormacaoAcademicaModel(BaseModel):
    TABLE = "FormacaoAcademica"

    @classmethod
    def find_by_matricula(cls, id_matricula: str) -> list[dict]:
        return execute_query(
            "SELECT * FROM FormacaoAcademica WHERE idMatricula = %s ORDER BY dataInicio DESC",
            (id_matricula,),
        )

    @classmethod
    def replace_all(cls, id_matricula: str, tipo_usuario: str, formacoes: list[dict]) -> None:
        """Apaga e reinserece todas as formaÃ§Ãµes do registro em uma transaÃ§Ã£o."""
        steps: list[tuple[str, tuple]] = [
            ("DELETE FROM FormacaoAcademica WHERE idMatricula = %s", (id_matricula,))
        ]
        for f in formacoes:
            steps.append((
                """
                INSERT INTO FormacaoAcademica
                    (idMatricula, tipoUsuario, grau, instituicao, areaConhecimento,
                     dataInicio, dataFim, status)
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s)
                """,
                (
                    id_matricula, tipo_usuario, f.get("grau"),
                    f.get("instituicao"), f.get("areaEstudo"),
                    f.get("dataInicio") or None, f.get("dataTermino") or None,
                    f.get("situacao", "concluido"),
                ),
            ))
        from app.src.adapters.db_adapter import execute_transaction
        execute_transaction(steps)


# â”€â”€ Models legados (mantidos para compatibilidade) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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
    TABLE = "Disciplinas"

    @classmethod
    def find_all(cls) -> list[dict]:
        return execute_query(
            "SELECT idDisciplina, codDisciplina, nomeDisciplina, areaConhecimento "
            "FROM Disciplinas ORDER BY nomeDisciplina"
        )

    @classmethod
    def create(cls, nome: str, carga_horaria: int) -> int:
        return execute_write(
            "INSERT INTO disciplinas (nome, carga_horaria) VALUES (%s, %s)",
            (nome, carga_horaria),
        )
