"""
Modelos para o sistema UUID (nova arquitetura)
"""
from app.src.adapters.db_adapter import execute_query, execute_write
import uuid
from typing import Optional, List, Dict


class UsuarioModel:
    """Modelo para a tabela central 'usuarios'"""
    TABLE = "usuarios"
    
    @staticmethod
    def gerar_uuid() -> str:
        """Gera um UUID v4"""
        return str(uuid.uuid4())
    
    @classmethod
    def criar(cls, nome: str, email: str, senha_hash: str, tipo_usuario: str, ativo: bool = True) -> str:
        """
        Cria um novo usuário e retorna o UUID
        
        Args:
            nome: Nome completo do usuário
            email: Email único
            senha_hash: Hash Argon2 da senha
            tipo_usuario: educador|educando|responsavel|colaborador|gestor|administrativo
            ativo: Se o usuário está ativo (padrão: True)
        
        Returns:
            str: UUID do usuário criado
        """
        usuario_id = cls.gerar_uuid()
        
        execute_write(
            """INSERT INTO usuarios 
               (id, nome, email, senha_hash, tipo_usuario, ativo, senha_definida)
               VALUES (%s, %s, %s, %s, %s, %s, TRUE)""",
            (usuario_id, nome, email, senha_hash, tipo_usuario, ativo)
        )
        
        return usuario_id
    
    @classmethod
    def buscar_por_id(cls, usuario_id: str) -> Optional[Dict]:
        """Busca usuário por UUID"""
        rows = execute_query(
            "SELECT * FROM usuarios WHERE id = %s LIMIT 1",
            (usuario_id,)
        )
        return rows[0] if rows else None
    
    @classmethod
    def buscar_por_email(cls, email: str) -> Optional[Dict]:
        """Busca usuário por email"""
        rows = execute_query(
            "SELECT * FROM usuarios WHERE email = %s LIMIT 1",
            (email,)
        )
        return rows[0] if rows else None
    
    @classmethod
    def atualizar_ultimo_login(cls, usuario_id: str, ip_address: str = None):
        """Atualiza data e IP do último login"""
        execute_write(
            """UPDATE usuarios 
               SET ultimo_login = NOW(), ultimo_ip = %s 
               WHERE id = %s""",
            (ip_address, usuario_id)
        )
    
    @classmethod
    def atualizar_senha(cls, usuario_id: str, nova_senha_hash: str):
        """Atualiza a senha do usuário"""
        execute_write(
            """UPDATE usuarios 
               SET senha_hash = %s, senha_definida = TRUE, atualizado_em = NOW()
               WHERE id = %s""",
            (nova_senha_hash, usuario_id)
        )
    
    @classmethod
    def ativar(cls, usuario_id: str):
        """Ativa um usuário"""
        execute_write(
            "UPDATE usuarios SET ativo = TRUE WHERE id = %s",
            (usuario_id,)
        )
    
    @classmethod
    def desativar(cls, usuario_id: str):
        """Desativa um usuário"""
        execute_write(
            "UPDATE usuarios SET ativo = FALSE WHERE id = %s",
            (usuario_id,)
        )
    
    @classmethod
    def listar_por_tipo(cls, tipo_usuario: str, apenas_ativos: bool = True) -> List[Dict]:
        """Lista usuários por tipo"""
        sql = "SELECT * FROM usuarios WHERE tipo_usuario = %s"
        params = [tipo_usuario]
        
        if apenas_ativos:
            sql += " AND ativo = TRUE"
        
        sql += " ORDER BY nome"
        
        return execute_query(sql, tuple(params))


class EducandoModel:
    """Modelo para a tabela 'educandos'"""
    TABLE = "educandos"
    
    @classmethod
    def criar(cls, usuario_id: str, matricula: str, **kwargs) -> str:
        """
        Cria um registro de educando
        
        Args:
            usuario_id: UUID do usuário
            matricula: Matrícula única do educando
            **kwargs: Campos opcionais (turma_id, data_nascimento, etc.)
        
        Returns:
            str: usuario_id
        """
        campos = ['usuario_id', 'matricula']
        valores = [usuario_id, matricula]
        placeholders = ['%s', '%s']
        
        # Adicionar campos opcionais
        for campo in ['turma_id', 'responsavel_id', 'data_nascimento', 'nacionalidade', 
                      'genero', 'cor', 'cpf', 'rg', 'status_academico']:
            if campo in kwargs and kwargs[campo] is not None:
                campos.append(campo)
                valores.append(kwargs[campo])
                placeholders.append('%s')
        
        sql = f"INSERT INTO educandos ({', '.join(campos)}) VALUES ({', '.join(placeholders)})"
        execute_write(sql, tuple(valores))
        
        return usuario_id
    
    @classmethod
    def buscar_por_usuario_id(cls, usuario_id: str) -> Optional[Dict]:
        """Busca educando por usuario_id"""
        rows = execute_query(
            "SELECT * FROM educandos WHERE usuario_id = %s LIMIT 1",
            (usuario_id,)
        )
        return rows[0] if rows else None
    
    @classmethod
    def buscar_por_matricula(cls, matricula: str) -> Optional[Dict]:
        """Busca educando por matrícula"""
        rows = execute_query(
            "SELECT * FROM educandos WHERE matricula = %s LIMIT 1",
            (matricula,)
        )
        return rows[0] if rows else None
    
    @classmethod
    def listar_todos(cls) -> List[Dict]:
        """Lista todos os educandos com informações do usuário"""
        return execute_query("""
            SELECT e.*, u.nome, u.email, u.ativo, u.criado_em
            FROM educandos e
            INNER JOIN usuarios u ON u.id = e.usuario_id
            ORDER BY u.nome
        """)


class EducadorModel:
    """Modelo para a tabela 'educadores'"""
    TABLE = "educadores"
    
    @classmethod
    def criar(cls, usuario_id: str, registro_profissional: str = None, **kwargs) -> str:
        """Cria um registro de educador"""
        campos = ['usuario_id']
        valores = [usuario_id]
        placeholders = ['%s']
        
        if registro_profissional:
            campos.append('registro_profissional')
            valores.append(registro_profissional)
            placeholders.append('%s')
        
        for campo in ['formacao', 'especializacao', 'data_admissao', 'status_profissional']:
            if campo in kwargs and kwargs[campo] is not None:
                campos.append(campo)
                valores.append(kwargs[campo])
                placeholders.append('%s')
        
        sql = f"INSERT INTO educadores ({', '.join(campos)}) VALUES ({', '.join(placeholders)})"
        execute_write(sql, tuple(valores))
        
        return usuario_id
    
    @classmethod
    def buscar_por_usuario_id(cls, usuario_id: str) -> Optional[Dict]:
        """Busca educador por usuario_id"""
        rows = execute_query(
            "SELECT * FROM educadores WHERE usuario_id = %s LIMIT 1",
            (usuario_id,)
        )
        return rows[0] if rows else None
    
    @classmethod
    def buscar_por_registro(cls, registro_profissional: str) -> Optional[Dict]:
        """Busca educador por registro profissional"""
        rows = execute_query(
            "SELECT * FROM educadores WHERE registro_profissional = %s LIMIT 1",
            (registro_profissional,)
        )
        return rows[0] if rows else None
    
    @classmethod
    def listar_todos(cls) -> List[Dict]:
        """Lista todos os educadores com informações do usuário"""
        return execute_query("""
            SELECT e.*, u.nome, u.email, u.ativo, u.criado_em
            FROM educadores e
            INNER JOIN usuarios u ON u.id = e.usuario_id
            ORDER BY u.nome
        """)


class ColaboradorModel:
    """Modelo para a tabela 'colaboradores'"""
    TABLE = "colaboradores"
    
    @classmethod
    def criar(cls, usuario_id: str, matricula_funcional: str, **kwargs) -> str:
        """Cria um registro de colaborador"""
        campos = ['usuario_id', 'matricula_funcional']
        valores = [usuario_id, matricula_funcional]
        placeholders = ['%s', '%s']
        
        for campo in ['cargo', 'departamento', 'data_admissao', 'status_profissional']:
            if campo in kwargs and kwargs[campo] is not None:
                campos.append(campo)
                valores.append(kwargs[campo])
                placeholders.append('%s')
        
        sql = f"INSERT INTO colaboradores ({', '.join(campos)}) VALUES ({', '.join(placeholders)})"
        execute_write(sql, tuple(valores))
        
        return usuario_id
    
    @classmethod
    def buscar_por_usuario_id(cls, usuario_id: str) -> Optional[Dict]:
        """Busca colaborador por usuario_id"""
        rows = execute_query(
            "SELECT * FROM colaboradores WHERE usuario_id = %s LIMIT 1",
            (usuario_id,)
        )
        return rows[0] if rows else None
    
    @classmethod
    def buscar_por_matricula(cls, matricula_funcional: str) -> Optional[Dict]:
        """Busca colaborador por matrícula funcional"""
        rows = execute_query(
            "SELECT * FROM colaboradores WHERE matricula_funcional = %s LIMIT 1",
            (matricula_funcional,)
        )
        return rows[0] if rows else None
    
    @classmethod
    def listar_todos(cls) -> List[Dict]:
        """Lista todos os colaboradores com informações do usuário"""
        return execute_query("""
            SELECT c.*, u.nome, u.email, u.ativo, u.criado_em
            FROM colaboradores c
            INNER JOIN usuarios u ON u.id = c.usuario_id
            ORDER BY u.nome
        """)


class TokenRecuperacaoModel:
    """Modelo para a tabela 'tokens_recuperacao'"""
    TABLE = "tokens_recuperacao"
    
    @classmethod
    def criar(cls, usuario_id: str, token: str, expiracao_timestamp: str,
              tipo_token: str = 'recuperacao_senha', ip_solicitacao: str = None,
              user_agent: str = None) -> str:
        """Cria um token de recuperação"""
        token_id = str(uuid.uuid4())
        
        execute_write(
            """INSERT INTO tokens_recuperacao 
               (id, usuario_id, token, tipo_token, expiracao, ip_solicitacao, user_agent)
               VALUES (%s, %s, %s, %s, %s, %s, %s)""",
            (token_id, usuario_id, token, tipo_token, expiracao_timestamp, ip_solicitacao, user_agent)
        )
        
        return token_id
    
    @classmethod
    def buscar_por_token(cls, token: str) -> Optional[Dict]:
        """Busca token por valor"""
        rows = execute_query(
            """SELECT * FROM tokens_recuperacao 
               WHERE token = %s AND utilizado = FALSE
               LIMIT 1""",
            (token,)
        )
        return rows[0] if rows else None
    
    @classmethod
    def marcar_como_utilizado(cls, token_id: str):
        """Marca um token como utilizado"""
        execute_write(
            """UPDATE tokens_recuperacao 
               SET utilizado = TRUE, utilizado_em = NOW()
               WHERE id = %s""",
            (token_id,)
        )


class EnderecoModel:
    """Modelo para a tabela 'enderecos'"""
    TABLE = "enderecos"
    
    @classmethod
    def criar(cls, usuario_id: str, **kwargs) -> str:
        """Cria um endereço"""
        endereco_id = str(uuid.uuid4())
        
        campos = ['id', 'usuario_id']
        valores = [endereco_id, usuario_id]
        placeholders = ['%s', '%s']
        
        for campo in ['tipo_endereco', 'principal', 'cep', 'logradouro', 'numero',
                      'complemento', 'bairro', 'cidade', 'estado', 'pais']:
            if campo in kwargs and kwargs[campo] is not None:
                campos.append(campo)
                valores.append(kwargs[campo])
                placeholders.append('%s')
        
        sql = f"INSERT INTO enderecos ({', '.join(campos)}) VALUES ({', '.join(placeholders)})"
        execute_write(sql, tuple(valores))
        
        return endereco_id
    
    @classmethod
    def buscar_por_usuario(cls, usuario_id: str) -> List[Dict]:
        """Lista endereços de um usuário"""
        return execute_query(
            "SELECT * FROM enderecos WHERE usuario_id = %s ORDER BY principal DESC, criado_em",
            (usuario_id,)
        )
    
    @classmethod
    def buscar_principal(cls, usuario_id: str) -> Optional[Dict]:
        """Busca o endereço principal do usuário"""
        rows = execute_query(
            "SELECT * FROM enderecos WHERE usuario_id = %s AND principal = TRUE LIMIT 1",
            (usuario_id,)
        )
        return rows[0] if rows else None
