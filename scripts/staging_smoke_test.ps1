# Simple smoke test for local staging
Write-Output "Waiting 8 seconds for services to start..."
Start-Sleep -Seconds 8

function Check-Url($url) {
    try {
        $resp = Invoke-WebRequest -UseBasicParsing -Uri $url -TimeoutSec 10 -ErrorAction Stop
        if ($resp.StatusCode -ge 200 -and $resp.StatusCode -lt 400) {
            Write-Output "$url -> OK ($($resp.StatusCode))"
            return $true
        } else {
            Write-Error "$url -> Unexpected status $($resp.StatusCode)"
            return $false
        }
    } catch {
        Write-Error "$url -> FAILED ($($_.Exception.Message))"
        return $false
    }
}

$ok = $true
$ok = $ok -and (Check-Url "http://localhost:3000")
$ok = $ok -and (Check-Url "http://localhost:5000/api/health")

if ($ok) { Write-Output "Smoke tests passed."; exit 0 } else { Write-Error "Smoke tests failed."; exit 1 }
