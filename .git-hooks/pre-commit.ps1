# PowerShell pre-commit hook
Write-Host "Scanning for sensitive data..." -ForegroundColor Cyan
$patterns = @(
    '"private_key"\s*:\s*"[^"]+"',
    '"private_key_id"\s*:\s*"[^"]+"',
    'AIza[0-9A-Za-z-_]{35}',
    'AKIA[0-9A-Z]{16}',
    'sk-[a-zA-Z0-9]{48}',
    'ghp_[a-zA-Z0-9]{36}'
)
$files = git diff --cached --name-only --diff-filter=ACM
$foundSecrets = $false
foreach ($file in $files) {
    if (Test-Path $file) {
        $content = Get-Content $file -Raw -ErrorAction SilentlyContinue
        if ($content) {
            foreach ($pattern in $patterns) {
                if ($content -match $pattern) {
                    Write-Host "BLOCKED: Secret found in $file" -ForegroundColor Red
                    Write-Host "   Pattern: $pattern" -ForegroundColor Yellow
                    $foundSecrets = $true
                }
            }
        }
    }
}
if ($foundSecrets) {
    Write-Host "COMMIT BLOCKED: Sensitive data detected!" -ForegroundColor Red
    Write-Host "To bypass: git commit --no-verify" -ForegroundColor Yellow
    exit 1
}
Write-Host "No sensitive data detected" -ForegroundColor Green
exit 0
