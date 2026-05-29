## Simulador ESP32 para pruebas de telemetria AQUORA
## Envia datos aleatorios cada 15 segundos via POST, igual que el firmware real

param(
    [string]$DeviceKey = "aq_api_0cfcc1652f6f943e",
    [string]$ServerUrl = "http://127.0.0.1:8000/api/v1/readings",
    [int]$IntervalSec = 15
)

Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "   AQUORA TELEMETRY SIMULATOR" -ForegroundColor Cyan
Write-Host "   Simula ESP32 + Sensores (Wokwi bypass)" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "[CONFIG] Device Key: $DeviceKey" -ForegroundColor Yellow
Write-Host "[CONFIG] Server: $ServerUrl" -ForegroundColor Yellow
Write-Host "[CONFIG] Intervalo: ${IntervalSec}s" -ForegroundColor Yellow
Write-Host ""
Write-Host "Presiona Ctrl+C para detener." -ForegroundColor DarkGray
Write-Host ""

$count = 0
while ($true) {
    $count++
    
    # Valores aleatorios realistas
    $tds   = [math]::Round((Get-Random -Minimum 180.0 -Maximum 520.0), 2)
    $turb  = [math]::Round((Get-Random -Minimum 2.0 -Maximum 45.0), 2)
    $level = [math]::Round((Get-Random -Minimum 15.0 -Maximum 95.0), 2)
    
    $body = @{
        device_key      = $DeviceKey
        tds_ppm         = $tds
        turbidity_ntu   = $turb
        water_level_pct = $level
    } | ConvertTo-Json -Compress

    Write-Host "=== LECTURA #$count ===" -ForegroundColor White
    Write-Host "  TDS:      $tds ppm"
    Write-Host "  Turbidez: $turb NTU"
    Write-Host "  Nivel:    $level %"
    Write-Host ""
    
    try {
        $r = Invoke-WebRequest -Uri $ServerUrl -Method POST -Body $body -ContentType "application/json" -Headers @{"ngrok-skip-browser-warning"="69420"} -UseBasicParsing -TimeoutSec 10
        Write-Host "[OK] Respuesta $($r.StatusCode): $($r.Content)" -ForegroundColor Green
    } catch {
        Write-Host "[ERROR] $($_.Exception.Message)" -ForegroundColor Red
    }
    
    Write-Host "--- Esperando ${IntervalSec}s... ---" -ForegroundColor DarkGray
    Write-Host ""
    Start-Sleep -Seconds $IntervalSec
}
