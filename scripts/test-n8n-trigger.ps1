# Test analyze API with n8n trigger (test mode).
# Usage: .\scripts\test-n8n-trigger.ps1 [path-to-file]
# Example: .\scripts\test-n8n-trigger.ps1 demo-data\csv\critical_waste.csv
param([string]$File = "demo-data/csv/critical_waste.csv")
if (-not (Test-Path $File)) {
  Write-Host "Run: npm run seed"
  Write-Host "Then: .\scripts\test-n8n-trigger.ps1 demo-data\csv\critical_waste.csv"
  exit 1
}
$response = Invoke-RestMethod -Uri "http://localhost:3000/api/analyze" -Method Post -Form @{
  files = Get-Item -Path $File
  envMode = "test"
  allowTrigger = "true"
}
$response | ConvertTo-Json -Depth 10
