$file = "c:\Users\chinogs\Videos\RBZ_System\rbz-frontend\src\components\FinancialProjections.js"
$content = Get-Content $file -Raw

# Replace 2025 with 2026 and 2026 with 2027
# Use placeholder to avoid double replacement
$content = $content -replace '2025', 'YEAR2026'
$content = $content -replace '2026', '2027'
$content = $content -replace 'YEAR2026', '2026'

Set-Content $file $content -NoNewline
Write-Host "File updated successfully"
