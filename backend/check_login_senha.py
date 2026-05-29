"""Script para verificar registros de login e senhas"""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app', 'src'))

from adapters.db_adapter import execute_query
import hashlib

email = "alineelainedasilva@gmail.com"

def _hash_senha(senha: str) -> str:
    """SHA-256 da senha (mesma função do auth_service.py)"""
    return hashlib.sha256(senha.encode()).hexdigest()

print(f"\n=== Verificando registros de login para {email} ===\n")

# Buscar todos os registros de login
query = """
    SELECT 
        idMatricula,
        email,
        senha,
        senha_definida,
        token_criacao_senha,
        token_expiracao
    FROM Login
    WHERE email = %s
"""

registros = execute_query(query, (email,))

if not registros:
    print(f"❌ Nenhum registro encontrado para {email}")
    sys.exit(1)

print(f"✅ Encontrados {len(registros)} registro(s):\n")

for i, reg in enumerate(registros, 1):
    print(f"--- Registro {i} ---")
    print(f"ID Matrícula: {reg['idMatricula']}")
    print(f"Email: {reg['email']}")
    print(f"Senha Hash: {reg['senha'][:50] if reg['senha'] else None}...")
    print(f"Senha Definida: {reg['senha_definida']}")
    print(f"Token Criação: {reg['token_criacao_senha'][:30] if reg['token_criacao_senha'] else None}...")
    print(f"Token Expiração: {reg['token_expiracao']}")
    
    # Testar senha
    if reg['senha']:
        senha_teste = "Melao01@"
        senha_hash_teste = _hash_senha(senha_teste)
        
        if reg['senha'] == senha_hash_teste:
            print(f"✅ Senha '{senha_teste}' VÁLIDA para {reg['idMatricula']}")
        else:
            print(f"❌ Senha '{senha_teste}' INVÁLIDA para {reg['idMatricula']}")
            print(f"   Hash esperado: {senha_hash_teste}")
            print(f"   Hash no banco: {reg['senha']}")
    else:
        print("⚠️  Sem senha definida")
    
    print()
