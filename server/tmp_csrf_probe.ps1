Set-Location "d:\School Management System Cambodia (SMS-CAM)\server"
Remove-Item Env:MONGODB_URI -ErrorAction SilentlyContinue
$env:NODE_ENV='production'
$env:JWT_SECRET='audit-secret'
$env:CLIENT_URL='https://konpuk.com'

$session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$csrfResp = Invoke-WebRequest -Uri 'http://127.0.0.1:5000/api/csrf-token' -WebSession $session -UseBasicParsing
$csrfToken = ($csrfResp.Content | ConvertFrom-Json).csrfToken
Write-Host "csrf-token=$csrfToken"
$cookies = $session.Cookies.GetCookies('http://127.0.0.1:5000') | ForEach-Object { $_.Name + '=' + $_.Value }
Write-Host "cookies=$($cookies -join '; ')"
$body = @{ identifier='admin@local.test'; password='AdminPass1!' } | ConvertTo-Json
try {
  $loginResp = Invoke-WebRequest -Uri 'http://127.0.0.1:5000/api/auth/login' -Method Post -ContentType 'application/json' -Body $body -Headers @{ 'X-CSRF-Token' = $csrfToken } -WebSession $session -UseBasicParsing -ErrorAction Stop
  Write-Host "login-status=$($loginResp.StatusCode)"
  Write-Host $loginResp.Content
} catch {
  Write-Host "login-error=$($_.Exception.Response.StatusCode.value__)"
  if ($_.Exception.Response -and $_.Exception.Response.Content) {
    $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
    $text = $reader.ReadToEnd()
    $reader.Dispose()
    Write-Host $text
  }
}
