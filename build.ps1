param(
    [string]$InputPath = ".\hub.lua",
    [string]$OutputPath = ".\dist\hub.compact.lua"
)

$ErrorActionPreference = "Stop"

$resolvedInput = Resolve-Path -LiteralPath $InputPath
$outputFull = [System.IO.Path]::GetFullPath((Join-Path (Get-Location) $OutputPath))
$outputDir = Split-Path -Parent $outputFull
if (-not (Test-Path -LiteralPath $outputDir)) {
    New-Item -ItemType Directory -Path $outputDir | Out-Null
}

$lines = Get-Content -LiteralPath $resolvedInput
$out = New-Object System.Collections.Generic.List[string]

foreach ($line in $lines) {
    $trim = $line.Trim()
    if ($trim.Length -eq 0) { continue }
    if ($trim.StartsWith("--")) { continue }

    # Keep inline spacing and comments intact to avoid changing string literals.
    $out.Add($line.TrimStart())
}

[System.IO.File]::WriteAllText($outputFull, ($out -join "`n"), [System.Text.UTF8Encoding]::new($false))

$inputBytes = (Get-Item -LiteralPath $resolvedInput).Length
$outputBytes = (Get-Item -LiteralPath $outputFull).Length
$saved = $inputBytes - $outputBytes
$pct = if ($inputBytes -gt 0) { [math]::Round(($saved / $inputBytes) * 100, 1) } else { 0 }

Write-Output "Built $OutputPath"
Write-Output "Input:  $inputBytes bytes"
Write-Output "Output: $outputBytes bytes"
Write-Output "Saved:  $saved bytes ($pct%)"
