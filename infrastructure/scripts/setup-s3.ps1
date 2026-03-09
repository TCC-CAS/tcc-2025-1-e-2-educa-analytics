# ============================================================
# setup-s3.ps1 - Cria e configura o bucket S3 para o frontend
# Execute APENAS UMA VEZ para configurar o bucket.
# Uso: .\setup-s3.ps1
# ============================================================

$BucketName = "educa-analytics-frontend"
$Region     = "sa-east-1"

# ─── Verificar AWS CLI ────────────────────────────────────────
if (-not (Get-Command aws -ErrorAction SilentlyContinue)) {
    Write-Host "[ERRO] AWS CLI nao encontrado." -ForegroundColor Red
    exit 1
}

Write-Host "`n[1/5] Criando bucket S3: $BucketName..." -ForegroundColor Cyan

$existing = aws s3api head-bucket --bucket $BucketName --region $Region 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "       Bucket ja existe, pulando criacao." -ForegroundColor Yellow
} else {
    aws s3api create-bucket `
        --bucket $BucketName `
        --region $Region `
        --create-bucket-configuration LocationConstraint=$Region | Out-Null
    if ($LASTEXITCODE -ne 0) { Write-Host "[ERRO] Falha ao criar bucket." -ForegroundColor Red; exit 1 }
    Write-Host "       Bucket criado." -ForegroundColor Green
}

# ─── Desabilitar bloqueio de acesso publico ───────────────────
Write-Host "`n[2/5] Desabilitando bloqueio de acesso publico..." -ForegroundColor Cyan
aws s3api put-public-access-block `
    --bucket $BucketName `
    --public-access-block-configuration "BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false" | Out-Null
Write-Host "       Feito." -ForegroundColor Green

# ─── Politica de leitura publica ─────────────────────────────
Write-Host "`n[3/5] Aplicando politica de leitura publica..." -ForegroundColor Cyan
$policy = @"
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::$BucketName/*"
    }
  ]
}
"@
$policy | aws s3api put-bucket-policy --bucket $BucketName --policy file:///dev/stdin 2>&1
if ($LASTEXITCODE -ne 0) {
    # Fallback para Windows (sem /dev/stdin)
    $policyFile = "$env:TEMP\s3policy.json"
    $policy | Out-File -FilePath $policyFile -Encoding UTF8
    aws s3api put-bucket-policy --bucket $BucketName --policy "file://$policyFile" | Out-Null
    Remove-Item $policyFile -Force
}
Write-Host "       Feito." -ForegroundColor Green

# ─── Habilitar website estático ───────────────────────────────
Write-Host "`n[4/5] Configurando hospedagem de site estatico..." -ForegroundColor Cyan
aws s3 website "s3://$BucketName/" --index-document index.html --error-document index.html | Out-Null
Write-Host "       Feito." -ForegroundColor Green

# ─── Resumo ──────────────────────────────────────────────────
Write-Host "`n[5/5] Configuracao concluida!" -ForegroundColor Green
Write-Host "`n============================================================" -ForegroundColor Cyan
Write-Host " Bucket : $BucketName" -ForegroundColor White
Write-Host " Regiao : $Region" -ForegroundColor White
Write-Host " URL    : http://$BucketName.s3-website.$Region.amazonaws.com" -ForegroundColor White
Write-Host "============================================================`n" -ForegroundColor Cyan
Write-Host "Proximo passo: execute .\deploy-s3.ps1 para fazer o primeiro deploy." -ForegroundColor Yellow
