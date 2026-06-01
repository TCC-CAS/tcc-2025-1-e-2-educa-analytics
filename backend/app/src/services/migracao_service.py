"""
Endpoint especial para executar a migração UUID
USAR APENAS UMA VEZ E DEPOIS REMOVER
"""
from app.src.adapters.db_adapter import execute_query, execute_write, get_connection
import uuid
import os

def executar_comando_sql(sql: str, descricao: str = "") -> dict:
    """Executa um comando SQL e retorna resultado"""
    try:
        with get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(sql)
            conn.commit()
            cursor.close()
        return {"sucesso": True, "descricao": descricao}
    except Exception as e:
        erro = str(e)
        # Ignorar erros de "já existe"
        if 'already exists' in erro or 'Duplicate' in erro:
            return {"sucesso": True, "descricao": f"{descricao} (já existe)", "warning": True}
        return {"sucesso": False, "descricao": descricao, "erro": erro}

def executar_migracao_uuid() -> dict:
    """
    Executa a migração completa para UUID
    """
    resultados = []
    
    # 1. Criar tabela usuarios
    resultados.append(executar_comando_sql("""
        CREATE TABLE IF NOT EXISTS usuarios (
            id VARCHAR(36) PRIMARY KEY COMMENT 'UUID do usuário',
            nome VARCHAR(150) NOT NULL,
            email VARCHAR(120) UNIQUE NOT NULL,
            senha_hash VARCHAR(255) NOT NULL,
            tipo_usuario ENUM('educador','educando','responsavel','colaborador','gestor','administrativo') NOT NULL,
            ativo BOOLEAN DEFAULT TRUE,
            senha_definida BOOLEAN DEFAULT FALSE,
            ultimo_login TIMESTAMP NULL,
            ultimo_ip VARCHAR(45) NULL,
            criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_email (email),
            INDEX idx_tipo (tipo_usuario),
            INDEX idx_ativo (ativo)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    """, "Criar tabela usuarios"))
    
    # 2. Criar tabela educandos
    resultados.append(executar_comando_sql("""
        CREATE TABLE IF NOT EXISTS educandos (
            usuario_id VARCHAR(36) PRIMARY KEY,
            matricula VARCHAR(20) UNIQUE NOT NULL,
            turma_id INT NULL,
            responsavel_id VARCHAR(36) NULL,
            data_nascimento DATE NULL,
            nacionalidade VARCHAR(50),
            genero ENUM('M','F','Outro','Prefiro não informar') NULL,
            cor VARCHAR(30),
            cpf VARCHAR(14) UNIQUE,
            rg VARCHAR(20),
            status_academico ENUM('ativo','inativo','trancado','concluido') DEFAULT 'ativo',
            criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
            INDEX idx_matricula (matricula),
            INDEX idx_turma (turma_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    """, "Criar tabela educandos"))
    
    # 3. Criar tabela educadores
    resultados.append(executar_comando_sql("""
        CREATE TABLE IF NOT EXISTS educadores (
            usuario_id VARCHAR(36) PRIMARY KEY,
            registro_profissional VARCHAR(30) UNIQUE,
            formacao VARCHAR(200),
            especializacao VARCHAR(200),
            data_admissao DATE,
            status_profissional ENUM('ativo','afastado','licenca','desligado') DEFAULT 'ativo',
            criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
            INDEX idx_registro (registro_profissional)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    """, "Criar tabela educadores"))
    
    # 4. Criar tabela colaboradores
    resultados.append(executar_comando_sql("""
        CREATE TABLE IF NOT EXISTS colaboradores (
            usuario_id VARCHAR(36) PRIMARY KEY,
            matricula_funcional VARCHAR(30) UNIQUE NOT NULL,
            cargo VARCHAR(100),
            departamento VARCHAR(100),
            data_admissao DATE,
            status_profissional ENUM('ativo','afastado','licenca','desligado') DEFAULT 'ativo',
            criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
            INDEX idx_matricula (matricula_funcional)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    """, "Criar tabela colaboradores"))
    
    # 5. Criar tabela responsaveis
    resultados.append(executar_comando_sql("""
        CREATE TABLE IF NOT EXISTS responsaveis (
            usuario_id VARCHAR(36) PRIMARY KEY,
            cpf VARCHAR(14) UNIQUE,
            rg VARCHAR(20),
            telefone VARCHAR(20),
            telefone_secundario VARCHAR(20),
            parentesco VARCHAR(50),
            criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    """, "Criar tabela responsaveis"))
    
    # 6. Criar tabela tokens_recuperacao
    resultados.append(executar_comando_sql("""
        CREATE TABLE IF NOT EXISTS tokens_recuperacao (
            id VARCHAR(36) PRIMARY KEY,
            usuario_id VARCHAR(36) NOT NULL,
            token VARCHAR(255) UNIQUE NOT NULL,
            tipo_token ENUM('recuperacao_senha','criacao_senha','verificacao_email') DEFAULT 'recuperacao_senha',
            expiracao TIMESTAMP NOT NULL,
            utilizado BOOLEAN DEFAULT FALSE,
            ip_solicitacao VARCHAR(45),
            user_agent TEXT,
            criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            utilizado_em TIMESTAMP NULL,
            FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
            INDEX idx_token (token),
            INDEX idx_usuario (usuario_id),
            INDEX idx_expiracao (expiracao)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    """, "Criar tabela tokens_recuperacao"))
    
    # 7. Criar tabela enderecos
    resultados.append(executar_comando_sql("""
        CREATE TABLE IF NOT EXISTS enderecos (
            id VARCHAR(36) PRIMARY KEY,
            usuario_id VARCHAR(36) NOT NULL,
            tipo_endereco ENUM('residencial','comercial','correspondencia','outro') DEFAULT 'residencial',
            principal BOOLEAN DEFAULT TRUE,
            cep VARCHAR(9),
            logradouro VARCHAR(255),
            numero VARCHAR(20),
            complemento VARCHAR(100),
            bairro VARCHAR(100),
            cidade VARCHAR(100),
            estado VARCHAR(2),
            pais VARCHAR(50) DEFAULT 'Brasil',
            criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
            INDEX idx_usuario (usuario_id),
            INDEX idx_cep (cep)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    """, "Criar tabela enderecos"))
    
    # Contar sucessos e erros
    sucessos = sum(1 for r in resultados if r["sucesso"])
    erros = sum(1 for r in resultados if not r["sucesso"])
    warnings = sum(1 for r in resultados if r.get("warning"))
    
    # Verificar tabelas criadas
    tabelas_criadas = []
    for tabela in ['usuarios', 'educandos', 'educadores', 'colaboradores', 'responsaveis', 'tokens_recuperacao', 'enderecos']:
        rows = execute_query(f"SHOW TABLES LIKE '{tabela}'")
        if rows:
            count = execute_query(f"SELECT COUNT(*) as total FROM {tabela}")
            tabelas_criadas.append({
                "tabela": tabela,
                "existe": True,
                "registros": count[0]['total'] if count else 0
            })
    
    return {
        "sucesso": erros == 0,
        "total_comandos": len(resultados),
        "sucessos": sucessos,
        "erros": erros,
        "warnings": warnings,
        "resultados": resultados,
        "tabelas_criadas": tabelas_criadas
    }
