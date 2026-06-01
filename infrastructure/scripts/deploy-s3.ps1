# ============================================================
# deploy-s3.ps1 - Build + Deploy do frontend para S3
# Uso: .\deploy-s3.ps1
# ============================================================

$BucketName = "educa-analytics-frontend"
$Region     = "sa-east-1"
$DistPath   = ".\dist\educa-analytics"

# ─── Build Angular ───────────────────────────────────────────
Write-Host "`n[1/3] Executando build de producao do Angular..." -ForegroundColor Cyan
npm run build:prod
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERRO] Build falhou." -ForegroundColor Red
    exit 1
}
Write-Host "       Build concluido." -ForegroundColor Green

# ─── Sync para S3 ────────────────────────────────────────────
Write-Host "`n[2/3] Enviando arquivos para S3..." -ForegroundColor Cyan
aws s3 sync $DistPath "s3://$BucketName/" --delete --region $Region
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERRO] Falha ao sincronizar com S3." -ForegroundColor Red
    exit 1
}
Write-Host "       Sincronizacao concluida." -ForegroundColor Green

# ─── Resumo ──────────────────────────────────────────────────
Write-Host "`n[3/3] Deploy concluido!" -ForegroundColor Green
Write-Host "`n============================================================" -ForegroundColor Cyan
Write-Host " Bucket : $BucketName" -ForegroundColor White
Write-Host " URL    : http://$BucketName.s3-website.$Region.amazonaws.com" -ForegroundColor White
Write-Host "============================================================`n" -ForegroundColor Cyan
