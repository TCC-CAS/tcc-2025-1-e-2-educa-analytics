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
        """Persiste o token de criação de senha e sua expiração."""
        try:
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
        except Exception as e:
            # Se der erro, provavelmente as colunas não existem
            print(f"[LoginModel] ERRO ao salvar token: {e}")
            print(f"[LoginModel] Execute o script: python backend/scripts/add_token_columns.py")
            raise Exception(
                "Erro ao salvar token. Verifique se as colunas token_criacao_senha, "
                "token_expiracao e senha_definida existem na tabela Login. "
                "Execute: python backend/scripts/add_token_columns.py"
            ) from e

    @classmethod
    def find_by_matricula(cls, id_matricula: str) -> dict | None:
        rows = execute_query(
            "SELECT idMatricula, email FROM Login WHERE idMatricula = %s LIMIT 1",
            (id_matricula,),
        )
        return rows[0] if rows else None

    @classmethod
    def find_by_email(cls, email: str) -> dict | None:
        """Busca login por email."""
        rows = execute_query(
            "SELECT idMatricula, email, senha, senha_definida FROM Login WHERE email = %s LIMIT 1",
            (email,),
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
    def find_all_with_sala(cls) -> list[dict]:
        return execute_query(
            """
            SELECT t.*,
                   s.nomeSala,
                   DATE_FORMAT(t.dataInicio, '%%Y-%%m-%%d') AS dataInicioFmt,
                   DATE_FORMAT(t.dataFim,    '%%Y-%%m-%%d') AS dataFimFmt,
                   (SELECT COUNT(*) FROM HistoricoEscolar h
                    WHERE h.idTurma = t.idTurma AND h.situacao = 'cursando') AS vagasOcupadas
            FROM Turmas t
            LEFT JOIN Salas s ON s.idSala = t.idSala
            ORDER BY t.anoLetivo DESC, t.serie, t.codTurma
            """
        )

    @classmethod
    def update(cls, id_turma: int, data: dict) -> None:
        execute_write(
            """
            UPDATE Turmas SET
                codTurma   = %s, nomeTurma  = %s, periodo    = %s,
                anoLetivo  = %s, serie      = %s, qldVagas   = %s,
                dataInicio = %s, dataFim    = %s, status     = %s,
                idSala     = %s
            WHERE idTurma = %s
            """,
            (
                data["codTurma"], data["nomeTurma"], data["periodo"],
                data["anoLetivo"], data.get("serie"), data.get("qldVagas", 30),
                data.get("dataInicio") or None, data.get("dataFim") or None,
                data.get("status", "ativa"), data.get("idSala"),
                id_turma,
            ),
        )

    @classmethod
    def delete(cls, id_turma: int) -> None:
        execute_write("DELETE FROM Turmas WHERE idTurma = %s", (id_turma,))

    @classmethod
    def update_status(cls, id_turma: int, status: str) -> None:
        execute_write(
            "UPDATE Turmas SET status = %s WHERE idTurma = %s",
            (status, id_turma),
        )

    @classmethod
    def update_status_lote(cls, ids: list[int], status: str) -> int:
        if not ids:
            return 0
        ph = ",".join(["%s"] * len(ids))
        execute_write(
            f"UPDATE Turmas SET status = %s WHERE idTurma IN ({ph})",
            (status, *ids),
        )
        return len(ids)

    @classmethod
    def find_educandos(cls, id_turma: int) -> list[dict]:
        return execute_query(
            """
            SELECT er.idMatricula, er.nomeCompleto AS nome,
                   h.serie, er.idStatus AS status
            FROM HistoricoEscolar h
            JOIN EducandoResponsavel er ON er.idMatricula = h.idMatricula
            WHERE h.idTurma = %s AND h.situacao = 'cursando'
            ORDER BY er.nomeCompleto
            """,
            (id_turma,),
        )

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


# ── Salas ──────────────────────────────────────────────────────────────────────────────────────────

class SalaModel(BaseModel):
    TABLE = "Salas"

    @classmethod
    def find_all(cls) -> list[dict]:
        return execute_query(
            """
            SELECT idSala, codSala, nomeSala, tipoSala, status,
                   capacidade, bloco, andar, recursos, obsSala
            FROM Salas
            ORDER BY nomeSala
            """
        )

    @classmethod
    def find_by_id(cls, id_sala: int) -> dict | None:
        rows = execute_query(
            "SELECT * FROM Salas WHERE idSala = %s LIMIT 1", (id_sala,)
        )
        return rows[0] if rows else None

    @classmethod
    def find_by_nome(cls, nome_sala: str) -> dict | None:
        rows = execute_query(
            "SELECT * FROM Salas WHERE nomeSala = %s LIMIT 1", (nome_sala,)
        )
        return rows[0] if rows else None

    @classmethod
    def find_by_codigo(cls, cod_sala: str) -> dict | None:
        rows = execute_query(
            "SELECT * FROM Salas WHERE codSala = %s LIMIT 1", (cod_sala,)
        )
        return rows[0] if rows else None

    @classmethod
    def create(cls, data: dict) -> int:
        import json as _json
        recursos_json = _json.dumps(data.get("recursos") or {}, ensure_ascii=False)
        status_value = data.get("status", "ativa")
        
        return execute_write(
            """
            INSERT INTO Salas
                (codSala, nomeSala, tipoSala, status, capacidade, 
                 bloco, andar, recursos, obsSala)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            """,
            (
                data["codSala"],
                data["nomeSala"],
                data.get("tipoSala"),
                status_value,
                data.get("capacidade", 0),
                data.get("bloco"),
                data.get("andar"),
                recursos_json,
                data.get("obsSala"),
            ),
        )

    @classmethod
    def update(cls, id_sala: int, data: dict) -> int:
        import json as _json
        recursos_json = _json.dumps(data.get("recursos") or {}, ensure_ascii=False)
        status_value = data.get("status", "ativa")
        
        return execute_write(
            """
            UPDATE Salas SET
                codSala = %s,
                nomeSala = %s,
                tipoSala = %s,
                status = %s,
                capacidade = %s,
                bloco = %s,
                andar = %s,
                recursos = %s,
                obsSala = %s
            WHERE idSala = %s
            """,
            (
                data["codSala"],
                data["nomeSala"],
                data.get("tipoSala"),
                status_value,
                data.get("capacidade", 0),
                data.get("bloco"),
                data.get("andar"),
                recursos_json,
                data.get("obsSala"),
                id_sala,
            ),
        )

    @classmethod
    def set_status(cls, id_sala: int, status: str) -> int:
        print(f"[DEBUG set_status] Atualizando sala {id_sala} para status '{status}'")
        result = execute_write(
            "UPDATE Salas SET status = %s WHERE idSala = %s",
            (status, id_sala),
        )
        print(f"[DEBUG set_status] Linhas afetadas: {result}")
        
        # Verificar se realmente foi atualizado
        from app.src.adapters.db_adapter import execute_query
        sala_verificacao = execute_query(
            "SELECT idSala, codSala, status FROM Salas WHERE idSala = %s",
            (id_sala,)
        )
        if sala_verificacao:
            print(f"[DEBUG set_status] Status atual no banco: '{sala_verificacao[0]['status']}'")
        
        return result

    @classmethod
    def delete(cls, id_sala: int) -> int:
        return execute_write(
            "DELETE FROM Salas WHERE idSala = %s", (id_sala,)
        )


# ── Histórico Escolar ──────────────────────────────────────────────────────────────────────────────

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
    def find_by_id_educador(cls, id_matricula: str) -> list[int]:
        """Busca IDs de disciplinas pela matrícula do educador."""
        rows = execute_query(
            "SELECT idDisciplina FROM EducadorDisciplina WHERE idMatricula = %s",
            (id_matricula,),
        )
        return [r["idDisciplina"] for r in rows]

    @classmethod
    def replace_all(cls, id_matricula: str, ids_disciplinas: list[int]) -> None:
        """Substitui todas as disciplinas de um educador."""
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
        """Lista todos os educadores com matrícula funcional."""
        return execute_query(
            """
            SELECT idMatricula, nomeCompleto, 
                   nacionalidade, genero, cor, dataNascimento, idade,
                   email, telefone, cpf, rg, orgaoEmissor, estadoEmissor,
                   cargo, departamento, tipoUsuario, idStatus
            FROM Educador 
            ORDER BY nomeCompleto
            """
        )

    @classmethod
    def find_by_matricula(cls, matricula: str) -> dict | None:
        """Busca educador pela matrícula funcional."""
        rows = execute_query(
            """
            SELECT idMatricula, nomeCompleto, 
                   nacionalidade, genero, cor, dataNascimento, idade,
                   email, telefone, cpf, rg, orgaoEmissor, estadoEmissor,
                   cargo, departamento, tipoUsuario, idStatus
            FROM Educador 
            WHERE idMatricula = %s 
            LIMIT 1
            """,
            (matricula,)
        )
        return rows[0] if rows else None

    @classmethod
    def find_by_cpf(cls, cpf: str) -> dict | None:
        """Busca educador pelo CPF."""
        rows = execute_query(
            """
            SELECT idMatricula, nomeCompleto, 
                   nacionalidade, genero, cor, dataNascimento, idade,
                   email, telefone, cpf, rg, orgaoEmissor, estadoEmissor,
                   cargo, departamento, tipoUsuario, idStatus
            FROM Educador 
            WHERE cpf = %s 
            LIMIT 1
            """,
            (cpf,)
        )
        return rows[0] if rows else None

    @classmethod
    def create(cls, data: dict) -> int:
        """Cria um novo educador com todos os campos."""
        import json as _json
        periodos_json = _json.dumps(data.get("periodos") or [], ensure_ascii=False)
        
        return execute_write(
            """
            INSERT INTO Educador (
                idMatricula, nomeCompleto, nacionalidade, genero, cor,
                dataNascimento, idade, telefone, email, cpf,
                rg, orgaoEmissor, estadoEmissor, periodos,
                tipoUsuario, cargo, departamento, idStatus
            )
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,'educador',%s,%s,'ativo')
            """,
            (
                data.get("idMatricula") or data.get("matriculaFuncional"),
                data.get("nomeCompleto"),
                data.get("nacionalidade"),
                data.get("genero"),
                data.get("cor") or data.get("corRaca"),
                data.get("dataNascimento") or None,
                data.get("idade"),
                data.get("telefone"),
                data.get("email"),
                data.get("cpf"),
                data.get("rg"),
                data.get("orgaoEmissor"),
                data.get("estadoEmissor"),
                periodos_json,
                data.get("cargo") or "Professor",
                data.get("departamento") or "Educação",
            ),
        )

    @classmethod
    def update(cls, matricula: str, data: dict) -> int:
        """Atualiza dados do educador pela matrícula funcional."""
        import json as _json
        periodos_json = _json.dumps(data.get("periodos") or [], ensure_ascii=False)
        
        return execute_write(
            """
            UPDATE Educador SET
                nomeCompleto = %s,
                nacionalidade = %s,
                genero = %s,
                cor = %s,
                dataNascimento = %s,
                idade = %s,
                telefone = %s,
                email = %s,
                cpf = %s,
                rg = %s,
                orgaoEmissor = %s,
                estadoEmissor = %s,
                cargo = %s,
                departamento = %s,
                periodos = %s
            WHERE idMatricula = %s
            """,
            (
                data.get("nomeCompleto"),
                data.get("nacionalidade"),
                data.get("genero"),
                data.get("cor") or data.get("corRaca"),
                data.get("dataNascimento") or None,
                data.get("idade"),
                data.get("telefone"),
                data.get("email"),
                data.get("cpf"),
                data.get("rg"),
                data.get("orgaoEmissor"),
                data.get("estadoEmissor"),
                data.get("cargo") or "Professor",
                data.get("departamento") or "Educação",
                periodos_json,
                matricula,
            ),
        )

    @classmethod
    def set_status(cls, matricula: str, status: str) -> int:
        """Atualiza status do educador (ativo/inativo)."""
        return execute_write(
            "UPDATE Educadores SET status = %s WHERE matricula = %s",
            (status, matricula),
        )

    @classmethod
    def delete_by_matricula(cls, matricula: str) -> int:
        """Remove educador pela matrícula funcional."""
        return execute_write(
            "DELETE FROM Educador WHERE idMatricula = %s", (matricula,)
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
            JOIN Disciplinas d ON d.id = n.disciplina_id
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
            JOIN Disciplinas d ON d.id = f.disciplina_id
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
            JOIN Disciplinas d ON d.id = n.disciplina_id
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
            JOIN Disciplinas d ON d.id = f.disciplina_id
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
    def find_all(cls, status=None):
        """Retorna todas as disciplinas, opcionalmente filtradas por status"""
        if status:
            return execute_query(
                "SELECT * FROM Disciplinas WHERE status = %s ORDER BY nomeDisciplina",
                (status,)
            )
        return execute_query(
            "SELECT * FROM Disciplinas ORDER BY nomeDisciplina"
        )

    @classmethod
    def find_by_id(cls, id_disciplina: int):
        """Retorna uma disciplina pelo ID"""
        rows = execute_query(
            "SELECT * FROM Disciplinas WHERE idDisciplina = %s LIMIT 1",
            (id_disciplina,)
        )
        return rows[0] if rows else None

    @classmethod
    def find_by_codigo(cls, codigo: str):
        """Retorna uma disciplina pelo código"""
        rows = execute_query(
            "SELECT * FROM Disciplinas WHERE codDisciplina = %s LIMIT 1",
            (codigo,)
        )
        return rows[0] if rows else None

    @classmethod
    def create(cls, cod_disciplina: str, nome_disciplina: str, 
               carga_horaria: int = 40, descricao=None,
               status: str = 'ativa') -> int:
        """Cria uma nova disciplina"""
        return execute_write(
            """INSERT INTO Disciplinas 
               (codDisciplina, nomeDisciplina, cargaHoraria, descricao, status) 
               VALUES (%s, %s, %s, %s, %s)""",
            (cod_disciplina, nome_disciplina, carga_horaria, descricao, status)
        )

    @classmethod
    def update(cls, id_disciplina: int, cod_disciplina: str, nome_disciplina: str,
               carga_horaria: int, descricao=None, 
               status: str = 'ativa') -> int:
        """Atualiza uma disciplina existente"""
        return execute_write(
            """UPDATE Disciplinas 
               SET codDisciplina = %s, nomeDisciplina = %s, cargaHoraria = %s,
                   descricao = %s, status = %s
               WHERE idDisciplina = %s""",
            (cod_disciplina, nome_disciplina, carga_horaria, descricao, status, id_disciplina)
        )

    @classmethod
    def delete(cls, id_disciplina: int) -> int:
        """Deleta uma disciplina (soft delete - muda status para inativa)"""
        return execute_write(
            "UPDATE Disciplinas SET status = 'inativa' WHERE idDisciplina = %s",
            (id_disciplina,)
        )
    
    @classmethod
    def delete_permanent(cls, id_disciplina: int) -> int:
        """Deleta uma disciplina permanentemente (hard delete)"""
        return execute_write(
            "DELETE FROM Disciplinas WHERE idDisciplina = %s",
            (id_disciplina,)
        )


# ── Educadores (novos) ───────────────────────────────────────────────────────────────

class EducadorNovoModel(BaseModel):
    """Model para a nova tabela Educadores (diferente da antiga Educador)"""
    TABLE = "Educadores"

    @classmethod
    def find_all(cls, status: str = 'ativo') -> list[dict]:
        """Retorna todos educadores, opcionalmente filtrados por status"""
        if status:
            return execute_query(
                "SELECT * FROM Educadores WHERE status = %s ORDER BY nomeCompleto",
                (status,)
            )
        return execute_query("SELECT * FROM Educadores ORDER BY nomeCompleto")

    @classmethod
    def find_by_id(cls, id_educador: int) -> dict | None:
        """Retorna um educador pelo ID"""
        rows = execute_query(
            "SELECT * FROM Educadores WHERE idEducador = %s LIMIT 1",
            (id_educador,)
        )
        return rows[0] if rows else None

    @classmethod
    def find_by_disciplina(cls, id_disciplina: int, status: str = 'ativo') -> list[dict]:
        """Retorna educadores que lecionam uma disciplina específica"""
        # EducadorDisciplina no AWS usa idMatricula (VARCHAR) em vez de idEducador
        return execute_query(
            """
            SELECT DISTINCT e.*
            FROM Educadores e
            INNER JOIN EducadorDisciplina ed ON e.matricula = ed.idMatricula
            WHERE ed.idDisciplina = %s AND e.status = %s
            ORDER BY e.nomeCompleto
            """,
            (id_disciplina, status)
        )


# ── Cronograma ───────────────────────────────────────────────────────────────────────

class CronogramaModel(BaseModel):
    """Model para tabela Cronograma (agendamento de aulas)"""
    TABLE = "Cronograma"

    @classmethod
    def find_by_turma(cls, id_turma: int) -> list[dict]:
        """Retorna todos os horários de uma turma com informações completas"""
        # A tabela Disciplinas no AWS RDS não tem cargaHoraria
        return execute_query(
            """
            SELECT c.*,
                   t.codTurma, t.nomeTurma, t.qldVagas,
                   d.codDisciplina, d.nomeDisciplina, d.areaConhecimento,
                   e.matricula AS educadorMatricula, e.nomeCompleto AS educadorNome,
                   s.codSala, s.nomeSala, s.capacidade AS salaCapacidade,
                   s.tipoSala, s.recursos AS salaRecursos
            FROM Cronograma c
            JOIN Turmas t ON c.idTurma = t.idTurma
            JOIN Disciplinas d ON c.idDisciplina = d.idDisciplina
            JOIN Educadores e ON c.idEducador = e.idEducador
            LEFT JOIN Salas s ON c.idSala = s.idSala
            WHERE c.idTurma = %s
            ORDER BY 
                FIELD(c.diaSemana, 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'),
                c.horaInicio
            """,
            (id_turma,)
        )

    @classmethod
    def find_conflitos_sala(
        cls,
        id_sala: int,
        dia_semana: str,
        hora_inicio: str,
        hora_fim: str,
        exclude_id: int | None = None
    ) -> list[dict]:
        """Verifica se há conflito de horário para uma sala"""
        query = """
            SELECT c.*, t.codTurma, t.nomeTurma
            FROM Cronograma c
            JOIN Turmas t ON c.idTurma = t.idTurma
            WHERE c.idSala = %s
              AND c.diaSemana = %s
              AND (
                  (c.horaInicio < %s AND c.horaFim > %s) OR
                  (c.horaInicio >= %s AND c.horaInicio < %s) OR
                  (c.horaFim > %s AND c.horaFim <= %s)
              )
        """
        params = [id_sala, dia_semana, hora_fim, hora_inicio, hora_inicio, hora_fim, hora_inicio, hora_fim]
        
        if exclude_id:
            query += " AND c.idCronograma != %s"
            params.append(exclude_id)
        
        return execute_query(query, tuple(params))

    @classmethod
    def find_conflitos_educador(
        cls,
        id_educador: int,
        dia_semana: str,
        hora_inicio: str,
        hora_fim: str,
        exclude_id: int | None = None
    ) -> list[dict]:
        """Verifica se há conflito de horário para um educador"""
        query = """
            SELECT c.*, t.codTurma, t.nomeTurma
            FROM Cronograma c
            JOIN Turmas t ON c.idTurma = t.idTurma
            WHERE c.idEducador = %s
              AND c.diaSemana = %s
              AND (
                  (c.horaInicio < %s AND c.horaFim > %s) OR
                  (c.horaInicio >= %s AND c.horaInicio < %s) OR
                  (c.horaFim > %s AND c.horaFim <= %s)
              )
        """
        params = [id_educador, dia_semana, hora_fim, hora_inicio, hora_inicio, hora_fim, hora_inicio, hora_fim]
        
        if exclude_id:
            query += " AND c.idCronograma != %s"
            params.append(exclude_id)
        
        return execute_query(query, tuple(params))

    @classmethod
    def create(cls, data: dict) -> int:
        """Cria um novo horário no cronograma"""
        return execute_write(
            """
            INSERT INTO Cronograma
                (idTurma, idDisciplina, idEducador, idSala, diaSemana, horaInicio, horaFim, observacoes)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """,
            (
                data["idTurma"],
                data["idDisciplina"],
                data["idEducador"],
                data.get("idSala"),
                data["diaSemana"],
                data["horaInicio"],
                data["horaFim"],
                data.get("observacoes", "")
            )
        )

    @classmethod
    def update(cls, id_cronograma: int, data: dict) -> int:
        """Atualiza um horário no cronograma"""
        return execute_write(
            """
            UPDATE Cronograma
            SET idTurma = %s, idDisciplina = %s, idEducador = %s, idSala = %s,
                diaSemana = %s, horaInicio = %s, horaFim = %s, observacoes = %s
            WHERE idCronograma = %s
            """,
            (
                data["idTurma"],
                data["idDisciplina"],
                data["idEducador"],
                data.get("idSala"),
                data["diaSemana"],
                data["horaInicio"],
                data["horaFim"],
                data.get("observacoes", ""),
                id_cronograma
            )
        )

    @classmethod
    def delete(cls, id_cronograma: int) -> int:
        """Remove um horário do cronograma"""
        return execute_write(
            "DELETE FROM Cronograma WHERE idCronograma = %s",
            (id_cronograma,)
        )
