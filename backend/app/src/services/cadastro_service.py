"""
Serviço para cadastro de usuários no sistema UUID.
Gerencia criação de contas em usuarios + tabelas específicas (educandos, educadores, colaboradores).
"""
from typing import Dict, Optional
import secrets
from datetime import datetime, timedelta
from app.src.models.usuario_uuid import (
    UsuarioModel, EducandoModel, EducadorModel, 
    ColaboradorModel, EnderecoModel, TokenRecuperacaoModel
)
from app.src.services.auth_service import _hash_senha
from app.src.adapters.db_adapter import execute_query


def gerar_token_seguro(tamanho: int = 32) -> str:
    """Gera um token seguro para recuperação de senha"""
    return secrets.token_urlsafe(tamanho)


def cadastrar_educando(dados: Dict) -> Dict:
    """
    Cadastra um novo educando no sistema UUID.
    
    Campos esperados:
    - nome (str): Nome completo
    - email (str): Email único
    - senha (str, opcional): Senha (se não fornecida, senha_definida=False)
    - matricula (str): Matrícula única (ex: ALU-12345)
    - turma_id (int, opcional): ID da turma
    - data_nascimento (str, opcional): Data de nascimento (YYYY-MM-DD)
    - genero (str, opcional): M, F, Outro
    - cpf (str, opcional): CPF do educando
    - endereco (dict, opcional): Dados do endereço
    
    Returns:
        dict com usuario_id, matricula e mensagem de sucesso
    """
    # Validar campos obrigatórios
    if not dados.get('nome'):
        raise ValueError("Campo 'nome' é obrigatório")
    if not dados.get('email'):
        raise ValueError("Campo 'email' é obrigatório")
    if not dados.get('matricula'):
        raise ValueError("Campo 'matricula' é obrigatório")
    
    # Verificar se email já existe
    usuario_existente = UsuarioModel.buscar_por_email(dados['email'])
    if usuario_existente:
        raise ValueError(f"Email {dados['email']} já está em uso")
    
    # Verificar se matrícula já existe
    educando_existente = EducandoModel.buscar_por_matricula(dados['matricula'])
    if educando_existente:
        raise ValueError(f"Matrícula {dados['matricula']} já está em uso")
    
    # Criar senha hash (se fornecida)
    senha_hash = None
    senha_definida = False
    token_criacao = None
    
    if dados.get('senha'):
        senha_hash = _hash_senha(dados['senha'])
        senha_definida = True
    else:
        # Se não tem senha, gerar token para criação posterior
        token_criacao = gerar_token_seguro()
        print(f"[cadastro_service] Token de criação gerado para: {dados['email']}")
    
    # Criar usuário
    usuario_id = UsuarioModel.criar(
        nome=dados['nome'],
        email=dados['email'],
        senha_hash=senha_hash or '',
        tipo_usuario='educando',
        ativo=True
    )
    
    # Se senha não foi definida, atualizar flag e criar token
    if not senha_definida:
        execute_query(
            "UPDATE usuarios SET senha_definida = FALSE WHERE id = %s",
            (usuario_id,)
        )
        
        # Criar token de recuperação com validade de 7 dias
        expiracao = datetime.utcnow() + timedelta(days=7)
        TokenRecuperacaoModel.criar(
            usuario_id=usuario_id,
            token=token_criacao,
            expiracao_timestamp=expiracao.strftime("%Y-%m-%d %H:%M:%S"),
            tipo_token='criacao_senha'
        )
    
    # Criar registro de educando
    EducandoModel.criar(
        usuario_id=usuario_id,
        matricula=dados['matricula'],
        turma_id=dados.get('turma_id'),
        data_nascimento=dados.get('data_nascimento'),
        genero=dados.get('genero'),
        cpf=dados.get('cpf'),
        status_academico='ativo'
    )
    
    # Criar endereço (se fornecido)
    if dados.get('endereco'):
        EnderecoModel.criar(
            usuario_id=usuario_id,
            tipo_endereco='residencial',
            principal=True,
            **dados['endereco']
        )
    
    print(f"[cadastro_service] ✅ Educando cadastrado: {usuario_id} - {dados['matricula']}")
    
    resultado = {
        "usuario_id": usuario_id,
        "matricula": dados['matricula'],
        "email": dados['email'],
        "mensagem": "Educando cadastrado com sucesso"
    }
    
    # Se foi gerado token, incluir no resultado
    if token_criacao:
        resultado["token_criacao_senha"] = token_criacao
        resultado["senha_definida"] = False
    
    return resultado


def cadastrar_educador(dados: Dict) -> Dict:
    """
    Cadastra um novo educador no sistema UUID.
    
    Campos esperados:
    - nome (str): Nome completo
    - email (str): Email único
    - senha (str, opcional): Senha
    - registro_profissional (str, opcional): Registro único (ex: EDU-12345)
    - formacao (str, opcional): Formação acadêmica
    - especializacao (str, opcional): Área de especialização
    
    Returns:
        dict com usuario_id e mensagem
    """
    if not dados.get('nome'):
        raise ValueError("Campo 'nome' é obrigatório")
    if not dados.get('email'):
        raise ValueError("Campo 'email' é obrigatório")
    
    # Verificar se email já existe
    usuario_existente = UsuarioModel.buscar_por_email(dados['email'])
    if usuario_existente:
        raise ValueError(f"Email {dados['email']} já está em uso")
    
    # Verificar se registro já existe (se fornecido)
    if dados.get('registro_profissional'):
        educador_existente = EducadorModel.buscar_por_registro(dados['registro_profissional'])
        if educador_existente:
            raise ValueError(f"Registro {dados['registro_profissional']} já está em uso")
    
    # Criar senha hash (se fornecida)
    senha_hash = None
    senha_definida = False
    token_criacao = None
    
    if dados.get('senha'):
        senha_hash = _hash_senha(dados['senha'])
        senha_definida = True
    else:
        token_criacao = gerar_token_seguro()
        print(f"[cadastro_service] Token de criação gerado para educador: {dados['email']}")
    
    # Criar usuário
    usuario_id = UsuarioModel.criar(
        nome=dados['nome'],
        email=dados['email'],
        senha_hash=senha_hash or '',
        tipo_usuario='educador',
        ativo=True
    )
    
    if not senha_definida:
        execute_query(
            "UPDATE usuarios SET senha_definida = FALSE WHERE id = %s",
            (usuario_id,)
        )
        
        expiracao = datetime.utcnow() + timedelta(days=7)
        TokenRecuperacaoModel.criar(
            usuario_id=usuario_id,
            token=token_criacao,
            expiracao_timestamp=expiracao.strftime("%Y-%m-%d %H:%M:%S"),
            tipo_token='criacao_senha'
        )
    
    # Criar registro de educador
    EducadorModel.criar(
        usuario_id=usuario_id,
        registro_profissional=dados.get('registro_profissional'),
        formacao=dados.get('formacao'),
        especializacao=dados.get('especializacao'),
        status_profissional='ativo'
    )
    
    print(f"[cadastro_service] ✅ Educador cadastrado: {usuario_id}")
    
    resultado = {
        "usuario_id": usuario_id,
        "email": dados['email'],
        "registro_profissional": dados.get('registro_profissional'),
        "mensagem": "Educador cadastrado com sucesso"
    }
    
    if token_criacao:
        resultado["token_criacao_senha"] = token_criacao
        resultado["senha_definida"] = False
    
    return resultado


def cadastrar_colaborador(dados: Dict) -> Dict:
    """
    Cadastra um novo colaborador no sistema UUID.
    
    Campos esperados:
    - nome (str): Nome completo
    - email (str): Email único
    - senha (str, opcional): Senha
    - matricula_funcional (str): Matrícula única (ex: COL-12345)
    - cargo (str, opcional): Cargo
    - departamento (str, opcional): Departamento
    
    Returns:
        dict com usuario_id e mensagem
    """
    if not dados.get('nome'):
        raise ValueError("Campo 'nome' é obrigatório")
    if not dados.get('email'):
        raise ValueError("Campo 'email' é obrigatório")
    if not dados.get('matricula_funcional'):
        raise ValueError("Campo 'matricula_funcional' é obrigatório")
    
    # Verificar se email já existe
    usuario_existente = UsuarioModel.buscar_por_email(dados['email'])
    if usuario_existente:
        raise ValueError(f"Email {dados['email']} já está em uso")
    
    # Verificar se matrícula já existe
    colab_existente = ColaboradorModel.buscar_por_matricula(dados['matricula_funcional'])
    if colab_existente:
        raise ValueError(f"Matrícula {dados['matricula_funcional']} já está em uso")
    
    # Criar senha hash (se fornecida)
    senha_hash = None
    senha_definida = False
    token_criacao = None
    
    if dados.get('senha'):
        senha_hash = _hash_senha(dados['senha'])
        senha_definida = True
    else:
        token_criacao = gerar_token_seguro()
        print(f"[cadastro_service] Token de criação gerado para colaborador: {dados['email']}")
    
    # Criar usuário
    usuario_id = UsuarioModel.criar(
        nome=dados['nome'],
        email=dados['email'],
        senha_hash=senha_hash or '',
        tipo_usuario='colaborador',
        ativo=True
    )
    
    if not senha_definida:
        execute_query(
            "UPDATE usuarios SET senha_definida = FALSE WHERE id = %s",
            (usuario_id,)
        )
        
        expiracao = datetime.utcnow() + timedelta(days=7)
        TokenRecuperacaoModel.criar(
            usuario_id=usuario_id,
            token=token_criacao,
            expiracao_timestamp=expiracao.strftime("%Y-%m-%d %H:%M:%S"),
            tipo_token='criacao_senha'
        )
    
    # Criar registro de colaborador
    ColaboradorModel.criar(
        usuario_id=usuario_id,
        matricula_funcional=dados['matricula_funcional'],
        cargo=dados.get('cargo'),
        departamento=dados.get('departamento'),
        status_profissional='ativo'
    )
    
    print(f"[cadastro_service] ✅ Colaborador cadastrado: {usuario_id} - {dados['matricula_funcional']}")
    
    resultado = {
        "usuario_id": usuario_id,
        "email": dados['email'],
        "matricula_funcional": dados['matricula_funcional'],
        "mensagem": "Colaborador cadastrado com sucesso"
    }
    
    if token_criacao:
        resultado["token_criacao_senha"] = token_criacao
        resultado["senha_definida"] = False
    
    return resultado


def gerar_proxima_matricula(prefixo: str = 'ALU') -> str:
    """
    Gera a próxima matrícula disponível com base nas existentes.
    
    Args:
        prefixo: Prefixo da matrícula (ALU, EDU, COL, etc.)
    
    Returns:
        str: Nova matrícula no formato PREFIXO-XXXXX
    """
    # Buscar última matrícula com esse prefixo
    query = """
        SELECT matricula FROM educandos 
        WHERE matricula LIKE %s 
        ORDER BY matricula DESC 
        LIMIT 1
    """
    resultado = execute_query(query, (f"{prefixo}-%",))
    
    if resultado:
        ultima = resultado[0]['matricula']
        # Extrair número da última matrícula
        try:
            numero = int(ultima.split('-')[1])
            proximo_numero = numero + 1
        except:
            proximo_numero = 1
    else:
        proximo_numero = 1
    
    return f"{prefixo}-{proximo_numero:05d}"
