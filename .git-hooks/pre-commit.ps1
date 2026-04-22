# PowerShell pre-commit hook
Write-Host "Scanning for sensitive data..." -ForegroundColor Cyan

# Patterns for actual secrets (not env variable references)
$patterns = @(
    # Actual private keys (not process.env references)
    '"private_key"\s*:\s*"-----BEGIN',
    '"private_key_id"\s*:\s*"[a-f0-9]{40}"',
    # API keys
    'AIza[0-9A-Za-z-_]{35}',
    'AKIA[0-9A-Z]{16}',
    'sk-[a-zA-Z0-9]{48}',
    'ghp_[a-zA-Z0-9]{36}',
    # Actual email passwords (not process.env)
    'pass\s*:\s*[''"][^''"\$][^''"]{8,}[''"]'
)

# Patterns to EXCLUDE (safe references)
$safePatterns = @(
    'process\.env\.',
    'process\.env\[',
    '\.replace\(',
    'PRIVATE_KEY\.replace'
)

$files = git diff --cached --name-only --diff-filter=ACM
$foundSecrets = $false

foreach ($file in $files) {
    if (Test-Path $file) {
        $content = Get-Content $file -Raw -ErrorAction SilentlyContinue
        if ($content) {
            foreach ($pattern in $patterns) {
                if ($content -match $pattern) {
                    # Check if this match is in a safe context
                    $matches = [regex]::Matches($content, $pattern)
                    foreach ($match in $matches) {
                        $isSafe = $false
                        $context = $content.Substring([Math]::Max(0, $match.Index - 50), [Math]::Min(100, $content.Length - [Math]::Max(0, $match.Index - 50)))
                        
                        foreach ($safePattern in $safePatterns) {
                            if ($context -match $safePattern) {
                                $isSafe = $true
                                break
                            }
                        }
                        
                        if (-not $isSafe) {
                            Write-Host "BLOCKED: Secret found in $file" -ForegroundColor Red
                            Write-Host "   Pattern: $pattern" -ForegroundColor Yellow
                            Write-Host "   Context: $($context.Substring(0, [Math]::Min(80, $context.Length)))" -ForegroundColor Yellow
                            $foundSecrets = $true
                        }
                    }
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

