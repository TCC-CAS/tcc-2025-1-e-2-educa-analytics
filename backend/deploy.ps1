# ============================================================
# deploy.ps1 - Deploy da Lambda educaAnalytics para AWS
# Uso: .\deploy.ps1
#
# O que este script faz:
#   1. Instala dependências Python (PyMySQL) em uma pasta local
#   2. Empacota lambda_function.py + pasta app/ + dependencias
#   3. Faz upload do ZIP para a Lambda
#   4. Valida o deploy via health check
# ============================================================

$FunctionName = "educaAnalytics"
$Region       = "sa-east-1"
$Handler      = "lambda_function.lambda_handler"
$ZipFile      = "lambda_deploy.zip"
$SourceFile   = "lambda_function.py"
$DepsDir      = "lambda_deps"
$FunctionUrl  = "https://6si36us4toxrzhc6dfaynitbyq0piech.lambda-url.sa-east-1.on.aws/"

# ─── Verificações iniciais ────────────────────────────────────
Write-Host "`n[1/5] Verificando pre-requisitos..." -ForegroundColor Cyan

if (-not (Get-Command aws -ErrorAction SilentlyContinue)) {
    Write-Host "[ERRO] AWS CLI nao encontrado." -ForegroundColor Red
    Write-Host "       Instale em: https://aws.amazon.com/cli/" -ForegroundColor Yellow
    Write-Host "       Apos instalar, execute: aws configure" -ForegroundColor Yellow
    exit 1
}

if (-not (Get-Command python -ErrorAction SilentlyContinue)) {
    Write-Host "[ERRO] Python nao encontrado no PATH." -ForegroundColor Red
    exit 1
}

$identity = aws sts get-caller-identity 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERRO] Credenciais AWS nao configuradas ou invalidas." -ForegroundColor Red
    Write-Host "       Execute: aws configure" -ForegroundColor Yellow
    Write-Host "       Informe: AWS Access Key ID, Secret Access Key, regiao (sa-east-1), formato (json)" -ForegroundColor Yellow
    exit 1
}
Write-Host "       Credenciais OK: $identity" -ForegroundColor Green

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ScriptDir

# ─── Instalar dependências Python ────────────────────────────
Write-Host "`n[2/5] Instalando dependencias Python (PyMySQL)..." -ForegroundColor Cyan

if (Test-Path $DepsDir) { Remove-Item $DepsDir -Recurse -Force }
New-Item -ItemType Directory -Path $DepsDir | Out-Null

python -m pip install -r requirements.txt --target $DepsDir --quiet
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERRO] Falha ao instalar dependencias." -ForegroundColor Red
    exit 1
}
Write-Host "       Dependencias instaladas em .\$DepsDir" -ForegroundColor Green

# ─── Empacotar ───────────────────────────────────────────────
Write-Host "`n[3/5] Empacotando codigo + dependencias em $ZipFile..." -ForegroundColor Cyan

if (-not (Test-Path $SourceFile)) {
    Write-Host "[ERRO] Arquivo $SourceFile nao encontrado em $ScriptDir" -ForegroundColor Red
    exit 1
}

if (Test-Path $ZipFile) { Remove-Item $ZipFile -Force }

# Compacta: lambda_function.py + pasta app/ + dependencias
Compress-Archive -Path $SourceFile            -DestinationPath $ZipFile -Force
Compress-Archive -Path "app"                  -DestinationPath $ZipFile -Update
Compress-Archive -Path "$DepsDir\*"           -DestinationPath $ZipFile -Update

Write-Host "       ZIP criado: $ZipFile ($([math]::Round((Get-Item $ZipFile).Length / 1KB, 2)) KB)" -ForegroundColor Green

# ─── Deploy ──────────────────────────────────────────────────
Write-Host "`n[4/5] Fazendo deploy para Lambda '$FunctionName' em '$Region'..." -ForegroundColor Cyan

$result = aws lambda update-function-code `
    --function-name $FunctionName `
    --zip-file "fileb://$ZipFile" `
    --region $Region `
    --output json 2>&1

# Configura variáveis de ambiente na Lambda (edite os valores abaixo)
# aws lambda update-function-configuration `
#     --function-name $FunctionName `
#     --environment "Variables={DB_HOST=seu-rds.amazonaws.com,DB_PORT=3306,DB_NAME=educa_analytics,DB_USER=admin,DB_PASSWORD=suasenha,JWT_SECRET=troque-em-producao,ENV=production}" `
#     --region $Region

if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERRO] Falha no deploy:" -ForegroundColor Red
    Write-Host $result -ForegroundColor Red
    exit 1
}

$json = $result | ConvertFrom-Json
Write-Host "       Deploy OK | Estado: $($json.State) | Ultima modificacao: $($json.LastModified)" -ForegroundColor Green

# Aguarda a funcao ficar Active (para evitar invocar antes do upload terminar)
Write-Host "       Aguardando funcao ficar ativa..." -ForegroundColor Yellow
aws lambda wait function-updated --function-name $FunctionName --region $Region
Write-Host "       Funcao ativa." -ForegroundColor Green

# ─── Invoke (teste rapido) ────────────────────────────────────
Write-Host "`n[5/5] Invocando funcao via URL para validar deploy..." -ForegroundColor Cyan

try {
    $response = Invoke-WebRequest -Uri $FunctionUrl -Method GET -TimeoutSec 30 -UseBasicParsing
    Write-Host "       Status HTTP: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "       Resposta: $($response.Content)" -ForegroundColor White
} catch {
    Write-Host "       Invoke retornou: $($_.Exception.Response.StatusCode.value__) - $($_.Exception.Message)" -ForegroundColor Yellow
}

# ─── Resumo ──────────────────────────────────────────────────
Write-Host "`n============================================================" -ForegroundColor Cyan
Write-Host " Deploy concluido com sucesso!" -ForegroundColor Green
Write-Host " Funcao : $FunctionName" -ForegroundColor White
Write-Host " Regiao : $Region" -ForegroundColor White
Write-Host " URL    : $FunctionUrl" -ForegroundColor White
Write-Host "============================================================`n" -ForegroundColor Cyan
