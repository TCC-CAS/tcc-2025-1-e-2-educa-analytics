# ============================================================
# setup-api-gateway.ps1 - Cria HTTP API Gateway para educaAnalytics
# Execute APENAS UMA VEZ para criar o gateway.
# Uso: .\setup-api-gateway.ps1
# ============================================================

$ApiName      = "educaAnalytics-api"
$LambdaArn    = "arn:aws:lambda:sa-east-1:655431895518:function:educaAnalytics"
$Region       = "sa-east-1"
$AccountId    = "655431895518"
$StageName    = "prod"

# ─── Verificar AWS CLI ────────────────────────────────────────
if (-not (Get-Command aws -ErrorAction SilentlyContinue)) {
    Write-Host "[ERRO] AWS CLI nao encontrado." -ForegroundColor Red; exit 1
}

Write-Host "`n[1/5] Verificando se API ja existe..." -ForegroundColor Cyan
$existing = aws apigatewayv2 get-apis --region $Region --output json | ConvertFrom-Json
$api = $existing.Items | Where-Object { $_.Name -eq $ApiName }

if ($api) {
    Write-Host "       API ja existe: $($api.ApiId)" -ForegroundColor Yellow
    $ApiId = $api.ApiId
} else {
    Write-Host "`n[1/5] Criando HTTP API '$ApiName'..." -ForegroundColor Cyan
    $result = aws apigatewayv2 create-api `
        --name $ApiName `
        --protocol-type HTTP `
        --cors-configuration "AllowOrigins=*,AllowMethods=*,AllowHeaders=*" `
        --region $Region `
        --output json | ConvertFrom-Json
    $ApiId = $result.ApiId
    Write-Host "       API criada: $ApiId" -ForegroundColor Green
}

# ─── Integracao com Lambda ────────────────────────────────────
Write-Host "`n[2/5] Criando integracao com Lambda..." -ForegroundColor Cyan
$integration = aws apigatewayv2 create-integration `
    --api-id $ApiId `
    --integration-type AWS_PROXY `
    --integration-uri "arn:aws:apigateway:${Region}:lambda:path/2015-03-31/functions/${LambdaArn}/invocations" `
    --payload-format-version "2.0" `
    --region $Region `
    --output json | ConvertFrom-Json
$IntegrationId = $integration.IntegrationId
Write-Host "       Integracao criada: $IntegrationId" -ForegroundColor Green

# ─── Rotas (proxy catch-all) ──────────────────────────────────
Write-Host "`n[3/5] Criando rotas..." -ForegroundColor Cyan

# Rota default (captura tudo)
aws apigatewayv2 create-route `
    --api-id $ApiId `
    --route-key '$default' `
    --target "integrations/$IntegrationId" `
    --region $Region `
    --output json | Out-Null

# Rota explicita para /api/{proxy+}
aws apigatewayv2 create-route `
    --api-id $ApiId `
    --route-key 'ANY /api/{proxy+}' `
    --target "integrations/$IntegrationId" `
    --region $Region `
    --output json | Out-Null

Write-Host "       Rotas criadas." -ForegroundColor Green

# ─── Stage com auto-deploy ────────────────────────────────────
Write-Host "`n[4/5] Criando stage '$StageName' com auto-deploy..." -ForegroundColor Cyan
aws apigatewayv2 create-stage `
    --api-id $ApiId `
    --stage-name $StageName `
    --auto-deploy `
    --region $Region `
    --output json | Out-Null
Write-Host "       Stage criado." -ForegroundColor Green

# ─── Permissao para Lambda ────────────────────────────────────
Write-Host "`n[5/5] Concedendo permissao ao API Gateway para invocar Lambda..." -ForegroundColor Cyan
aws lambda add-permission `
    --function-name educaAnalytics `
    --statement-id apigateway-invoke `
    --action lambda:InvokeFunction `
    --principal apigateway.amazonaws.com `
    --source-arn "arn:aws:execute-api:${Region}:${AccountId}:${ApiId}/*" `
    --region $Region `
    --output json 2>&1 | Out-Null
Write-Host "       Permissao concedida." -ForegroundColor Green

# ─── URL final ───────────────────────────────────────────────
$ApiUrl = "https://$ApiId.execute-api.$Region.amazonaws.com/$StageName"

Write-Host "`n============================================================" -ForegroundColor Cyan
Write-Host " API Gateway criado com sucesso!" -ForegroundColor Green
Write-Host " API ID  : $ApiId" -ForegroundColor White
Write-Host " URL Base: $ApiUrl" -ForegroundColor Yellow
Write-Host " Teste   : $ApiUrl/api" -ForegroundColor White
Write-Host "============================================================`n" -ForegroundColor Cyan
Write-Host "IMPORTANTE: Atualize o environment.prod.ts com a URL acima!" -ForegroundColor Yellow
Write-Host "  apiUrl: '$ApiUrl/api'" -ForegroundColor Yellow
