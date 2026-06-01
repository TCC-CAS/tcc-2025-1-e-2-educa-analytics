-- =====================================================================
-- SCRIPT DE MIGRAÇÃO: UUID + Sistema de Autenticação Centralizado
-- Data: 23/05/2026
-- Versão: 1.0.0
-- Autor: GitHub Copilot
-- =====================================================================

-- ⚠️  ATENÇÃO: FAÇA BACKUP COMPLETO DO BANCO ANTES DE EXECUTAR!
-- ⚠️  Este script cria novas tabelas E migra dados existentes

SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='TRADITIONAL,ALLOW_INVALID_DATES';

-- =====================================================================
-- PASSO 1: CRIAR TABELA CENTRAL DE USUÁRIOS
-- =====================================================================

CREATE TABLE IF NOT EXISTS usuarios (
    id VARCHAR(36) PRIMARY KEY COMMENT 'UUID do usuário',
    
    -- Dados básicos
    nome VARCHAR(150) NOT NULL COMMENT 'Nome completo do usuário',
    email VARCHAR(120) UNIQUE NOT NULL COMMENT 'Email único do usuário',
    senha_hash VARCHAR(255) NOT NULL COMMENT 'Hash Argon2 da senha',
    
    -- Tipo de usuário
    tipo_usuario ENUM(
        'educador',
        'educando',
        'responsavel',
        'colaborador',
        'gestor',
        'administrativo'
    ) NOT NULL COMMENT 'Tipo/perfil do usuário',
    
    -- Status e controle
    ativo BOOLEAN DEFAULT TRUE COMMENT 'Usuário ativo no sistema',
    senha_definida BOOLEAN DEFAULT FALSE COMMENT 'Senha foi definida pelo usuário',
    
    -- Auditoria de acesso
    ultimo_login TIMESTAMP NULL COMMENT 'Data/hora do último login',
    ultimo_ip VARCHAR(45) NULL COMMENT 'IP do último acesso',
    
    -- Timestamps
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Índices para performance
    INDEX idx_email (email),
    INDEX idx_tipo (tipo_usuario),
    INDEX idx_ativo (ativo),
    INDEX idx_ultimo_login (ultimo_login)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci 
COMMENT='Tabela central de autenticação e identidade';

-- =====================================================================
-- PASSO 2: CRIAR TABELAS ESPECÍFICAS DE DOMÍNIO
-- =====================================================================

-- Tabela: educandos
CREATE TABLE IF NOT EXISTS educandos (
    usuario_id VARCHAR(36) PRIMARY KEY COMMENT 'FK para usuarios.id',
    matricula VARCHAR(20) UNIQUE NOT NULL COMMENT 'Matrícula única do educando',
    
    -- Relacionamentos
    turma_id INT NULL COMMENT 'FK para Turmas (legado)',
    responsavel_id VARCHAR(36) NULL COMMENT 'FK para usuarios.id (responsável)',
    
    -- Dados pessoais
    data_nascimento DATE NULL,
    nacionalidade VARCHAR(50),
    genero ENUM('M', 'F', 'Outro', 'Prefiro não informar') NULL,
    cor VARCHAR(30),
    cpf VARCHAR(14) UNIQUE,
    rg VARCHAR(20),
    
    -- Status acadêmico
    status_academico ENUM('ativo', 'inativo', 'trancado', 'concluido') DEFAULT 'ativo',
    
    -- Timestamps
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (responsavel_id) REFERENCES usuarios(id) ON DELETE SET NULL,
    
    INDEX idx_matricula (matricula),
    INDEX idx_turma (turma_id),
    INDEX idx_responsavel (responsavel_id),
    INDEX idx_status (status_academico)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Dados específicos de educandos/alunos';

-- Tabela: educadores
CREATE TABLE IF NOT EXISTS educadores (
    usuario_id VARCHAR(36) PRIMARY KEY COMMENT 'FK para usuarios.id',
    registro_profissional VARCHAR(30) UNIQUE COMMENT 'Matrícula funcional/registro',
    
    -- Dados profissionais
    formacao VARCHAR(200) COMMENT 'Formação acadêmica',
    especializacao VARCHAR(200) COMMENT 'Especializações e cursos',
    data_admissao DATE COMMENT 'Data de admissão',
    
    -- Status
    status_profissional ENUM('ativo', 'afastado', 'licenca', 'desligado') DEFAULT 'ativo',
    
    -- Timestamps
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    
    INDEX idx_registro (registro_profissional),
    INDEX idx_status (status_profissional)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Dados específicos de educadores/professores';

-- Tabela: colaboradores
CREATE TABLE IF NOT EXISTS colaboradores (
    usuario_id VARCHAR(36) PRIMARY KEY COMMENT 'FK para usuarios.id',
    matricula_funcional VARCHAR(30) UNIQUE NOT NULL COMMENT 'Matrícula funcional única',
    
    -- Dados profissionais
    cargo VARCHAR(100) COMMENT 'Cargo/função',
    departamento VARCHAR(100) COMMENT 'Departamento/setor',
    data_admissao DATE COMMENT 'Data de admissão',
    
    -- Status
    status_profissional ENUM('ativo', 'afastado', 'licenca', 'desligado') DEFAULT 'ativo',
    
    -- Timestamps
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    
    INDEX idx_matricula (matricula_funcional),
    INDEX idx_cargo (cargo),
    INDEX idx_departamento (departamento),
    INDEX idx_status (status_profissional)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Dados específicos de colaboradores';

-- Tabela: responsaveis
CREATE TABLE IF NOT EXISTS responsaveis (
    usuario_id VARCHAR(36) PRIMARY KEY COMMENT 'FK para usuarios.id',
    
    -- Dados pessoais
    cpf VARCHAR(14) UNIQUE COMMENT 'CPF do responsável',
    rg VARCHAR(20) COMMENT 'RG do responsável',
    telefone VARCHAR(20) COMMENT 'Telefone de contato',
    telefone_secundario VARCHAR(20) COMMENT 'Telefone alternativo',
    
    -- Relacionamento com educando
    parentesco VARCHAR(50) COMMENT 'Grau de parentesco (pai, mãe, avô, etc.)',
    
    -- Timestamps
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    
    INDEX idx_cpf (cpf)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Dados específicos de responsáveis/pais';

-- Tabela: gestores
CREATE TABLE IF NOT EXISTS gestores (
    usuario_id VARCHAR(36) PRIMARY KEY COMMENT 'FK para usuarios.id',
    
    -- Dados específicos
    cargo VARCHAR(100) COMMENT 'Cargo de gestão',
    nivel_acesso ENUM('basico', 'intermediario', 'total') DEFAULT 'total',
    
    -- Timestamps
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Dados específicos de gestores';

-- Tabela: administrativos
CREATE TABLE IF NOT EXISTS administrativos (
    usuario_id VARCHAR(36) PRIMARY KEY COMMENT 'FK para usuarios.id',
    
    -- Dados específicos
    cargo VARCHAR(100) COMMENT 'Cargo administrativo',
    departamento VARCHAR(100) COMMENT 'Departamento',
    
    -- Timestamps
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Dados específicos de usuários administrativos';

-- =====================================================================
-- PASSO 3: CRIAR TABELA DE TOKENS DE RECUPERAÇÃO
-- =====================================================================

CREATE TABLE IF NOT EXISTS tokens_recuperacao (
    id VARCHAR(36) PRIMARY KEY COMMENT 'UUID do token',
    usuario_id VARCHAR(36) NOT NULL COMMENT 'FK para usuarios.id',
    
    -- Dados do token
    token VARCHAR(255) UNIQUE NOT NULL COMMENT 'Token único de recuperação',
    tipo_token ENUM('recuperacao_senha', 'criacao_senha', 'verificacao_email') DEFAULT 'recuperacao_senha',
    expiracao TIMESTAMP NOT NULL COMMENT 'Data/hora de expiração',
    utilizado BOOLEAN DEFAULT FALSE COMMENT 'Token já foi usado',
    
    -- Auditoria
    ip_solicitacao VARCHAR(45) COMMENT 'IP que solicitou o token',
    user_agent TEXT COMMENT 'User-Agent do navegador',
    
    -- Timestamps
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    utilizado_em TIMESTAMP NULL COMMENT 'Quando o token foi utilizado',
    
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    
    INDEX idx_token (token),
    INDEX idx_usuario (usuario_id),
    INDEX idx_expiracao (expiracao),
    INDEX idx_utilizado (utilizado),
    INDEX idx_tipo (tipo_token)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Tokens de recuperação e criação de senha';

-- =====================================================================
-- PASSO 4: CRIAR TABELA DE ENDEREÇOS
-- =====================================================================

CREATE TABLE IF NOT EXISTS enderecos (
    id VARCHAR(36) PRIMARY KEY COMMENT 'UUID do endereço',
    usuario_id VARCHAR(36) NOT NULL COMMENT 'FK para usuarios.id',
    
    -- Tipo de endereço
    tipo_endereco ENUM('residencial', 'comercial', 'correspondencia', 'outro') DEFAULT 'residencial',
    principal BOOLEAN DEFAULT TRUE COMMENT 'Endereço principal',
    
    -- Dados do endereço
    cep VARCHAR(9),
    logradouro VARCHAR(255),
    numero VARCHAR(20),
    complemento VARCHAR(100),
    bairro VARCHAR(100),
    cidade VARCHAR(100),
    estado VARCHAR(2),
    pais VARCHAR(50) DEFAULT 'Brasil',
    
    -- Timestamps
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    
    INDEX idx_usuario (usuario_id),
    INDEX idx_cep (cep),
    INDEX idx_cidade (cidade),
    INDEX idx_estado (estado),
    INDEX idx_principal (principal)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Endereços dos usuários';

-- =====================================================================
-- PASSO 5: CRIAR FUNÇÃO PARA GERAR UUID
-- =====================================================================

DELIMITER //

CREATE FUNCTION IF NOT EXISTS gerar_uuid()
RETURNS VARCHAR(36)
DETERMINISTIC
NO SQL
BEGIN
    RETURN LOWER(CONCAT(
        LPAD(HEX(FLOOR(RAND() * 0xFFFFFFFF)), 8, '0'), '-',
        LPAD(HEX(FLOOR(RAND() * 0xFFFF)), 4, '0'), '-',
        '4', LPAD(HEX(FLOOR(RAND() * 0xFFF)), 3, '0'), '-',
        HEX(FLOOR(RAND() * 4 + 8)), LPAD(HEX(FLOOR(RAND() * 0xFFF)), 3, '0'), '-',
        LPAD(HEX(FLOOR(RAND() * 0xFFFFFFFFFFFF)), 12, '0')
    ));
END //

DELIMITER ;

-- =====================================================================
-- PASSO 6: MIGRAR DADOS EXISTENTES
-- =====================================================================

-- 6.1: Migrar dados da tabela Login para usuarios
INSERT INTO usuarios (id, nome, email, senha_hash, tipo_usuario, ativo, senha_definida, ultimo_login, ultimo_ip)
SELECT 
    gerar_uuid() as id,
    COALESCE(
        (SELECT nomeCompleto FROM EducandoResponsavel WHERE idMatricula = Login.idMatricula LIMIT 1),
        'Usuário' -- Nome padrão caso não encontre
    ) as nome,
    Login.email,
    Login.senha as senha_hash,
    'educando' as tipo_usuario, -- Assumindo educando como padrão
    TRUE as ativo,
    (Login.senha_definida = 1) as senha_definida,
    Login.ultimo_login,
    Login.ultimo_ip
FROM Login
WHERE NOT EXISTS (
    SELECT 1 FROM usuarios WHERE usuarios.email = Login.email
);

-- 6.2: Criar tabela temporária para mapear IDs antigos para novos UUIDs
CREATE TEMPORARY TABLE IF NOT EXISTS temp_id_mapping (
    old_id VARCHAR(50),
    new_uuid VARCHAR(36),
    email VARCHAR(120),
    tipo VARCHAR(30),
    PRIMARY KEY (old_id),
    INDEX idx_email (email)
);

-- Preencher mapeamento de IDs
INSERT INTO temp_id_mapping (old_id, new_uuid, email, tipo)
SELECT 
    Login.idMatricula as old_id,
    usuarios.id as new_uuid,
    usuarios.email,
    usuarios.tipo_usuario as tipo
FROM Login
INNER JOIN usuarios ON usuarios.email = Login.email;

-- 6.3: Migrar educandos
INSERT INTO educandos (usuario_id, matricula, data_nascimento, nacionalidade, genero, cor, cpf, rg)
SELECT 
    mapping.new_uuid,
    er.idMatricula as matricula,
    er.dataNascimento,
    er.nacionalidade,
    er.genero,
    er.cor,
    er.cpf,
    er.rg
FROM EducandoResponsavel er
INNER JOIN temp_id_mapping mapping ON mapping.old_id = er.idMatricula
WHERE mapping.tipo = 'educando'
ON DUPLICATE KEY UPDATE
    matricula = VALUES(matricula);

-- 6.4: Migrar endereços
INSERT INTO enderecos (id, usuario_id, tipo_endereco, principal, cep, logradouro, numero, complemento, bairro, cidade, estado)
SELECT 
    gerar_uuid() as id,
    mapping.new_uuid as usuario_id,
    'residencial' as tipo_endereco,
    TRUE as principal,
    e.cep,
    e.logradouro,
    e.numero,
    e.complemento,
    e.bairro,
    e.cidade,
    e.estado
FROM Endereco e
INNER JOIN temp_id_mapping mapping ON mapping.old_id = e.idMatricula
WHERE e.cep IS NOT NULL OR e.logradouro IS NOT NULL
ON DUPLICATE KEY UPDATE
    cep = VALUES(cep);

-- =====================================================================
-- PASSO 7: CRIAR VIEWS DE COMPATIBILIDADE (TEMPORÁRIAS)
-- =====================================================================

-- View para manter compatibilidade com consultas antigas
CREATE OR REPLACE VIEW vw_login_legacy AS
SELECT 
    u.id as usuario_id,
    CASE 
        WHEN e.matricula IS NOT NULL THEN e.matricula
        WHEN ed.registro_profissional IS NOT NULL THEN ed.registro_profissional
        WHEN c.matricula_funcional IS NOT NULL THEN c.matricula_funcional
        ELSE SUBSTRING(u.id, 1, 8)
    END as idMatricula,
    u.email,
    u.senha_hash as senha,
    u.senha_definida,
    u.ultimo_login,
    u.ultimo_ip
FROM usuarios u
LEFT JOIN educandos e ON e.usuario_id = u.id
LEFT JOIN educadores ed ON ed.usuario_id = u.id
LEFT JOIN colaboradores c ON c.usuario_id = u.id;

-- =====================================================================
-- PASSO 8: CRIAR TRIGGERS PARA AUDITORIA
-- =====================================================================

DELIMITER //

-- Trigger para atualizar timestamp de atualização
CREATE TRIGGER IF NOT EXISTS trg_usuarios_updated
BEFORE UPDATE ON usuarios
FOR EACH ROW
BEGIN
    SET NEW.atualizado_em = CURRENT_TIMESTAMP;
END //

-- Trigger para validar email
CREATE TRIGGER IF NOT EXISTS trg_usuarios_validate_email
BEFORE INSERT ON usuarios
FOR EACH ROW
BEGIN
    IF NEW.email NOT REGEXP '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Email inválido';
    END IF;
END //

DELIMITER ;

-- =====================================================================
-- PASSO 9: RESTAURAR CONFIGURAÇÕES
-- =====================================================================

SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;

-- =====================================================================
-- PASSO 10: VERIFICAÇÃO
-- =====================================================================

-- Verificar quantos usuários foram criados
SELECT 'VERIFICAÇÃO: Usuários criados' as etapa, COUNT(*) as total FROM usuarios;
SELECT 'VERIFICAÇÃO: Educandos criados' as etapa, COUNT(*) as total FROM educandos;
SELECT 'VERIFICAÇÃO: Endereços criados' as etapa, COUNT(*) as total FROM enderecos;

-- Verificar integridade referencial
SELECT 
    'VERIFICAÇÃO: Educandos sem usuário' as problema,
    COUNT(*) as total
FROM educandos e
LEFT JOIN usuarios u ON u.id = e.usuario_id
WHERE u.id IS NULL;

-- =====================================================================
-- NOTAS IMPORTANTES
-- =====================================================================

/*
✅ APÓS EXECUTAR ESTE SCRIPT:

1. Verifique os resultados das consultas de verificação
2. Teste o login com usuários existentes
3. Valide que todos os dados foram migrados corretamente
4. Atualize o código do backend para usar as novas tabelas
5. Atualize o código do frontend para usar UUIDs
6. Execute testes completos do sistema
7. Após validação completa, remova as tabelas antigas:
   - DROP TABLE IF EXISTS Login;
   - DROP TABLE IF EXISTS EducandoResponsavel;
   - DROP TABLE IF EXISTS Endereco;

⚠️  MANTENHA AS TABELAS ANTIGAS POR PELO MENOS 30 DIAS

❌ ANTES DE REMOVER TABELAS ANTIGAS:
   - Garanta que TODO o código está usando as novas tabelas
   - Faça backup completo
   - Valide que não há referências no código
*/

-- =====================================================================
-- FIM DO SCRIPT DE MIGRAÇÃO
-- =====================================================================
