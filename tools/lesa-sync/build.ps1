$csc = "C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe"
if (-not (Test-Path $csc)) {
    $csc = "C:\Windows\Microsoft.NET\Framework\v4.0.30319\csc.exe"
}
$wpf = "C:\Windows\Microsoft.NET\Framework64\v4.0.30319\WPF"
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$outputExe = Join-Path $scriptDir "LeSaSync.exe"
$sourceFile = Join-Path $scriptDir "Program.cs"

Write-Host "[LeSa Sync] Kompilacja $outputExe..." -ForegroundColor Cyan

& $csc /nologo /target:winexe /optimize /out:"$outputExe" /lib:"$wpf" `
    /r:PresentationFramework.dll `
    /r:PresentationCore.dll `
    /r:WindowsBase.dll `
    /r:System.dll `
    /r:System.Core.dll `
    /r:System.Xaml.dll `
    /r:System.Xml.dll `
    /r:System.Drawing.dll `
    /r:System.Web.Extensions.dll `
    "$sourceFile"

if ($LASTEXITCODE -eq 0) {
    Write-Host "[LeSa Sync] Sukces! Zbudowano: $outputExe" -ForegroundColor Green
} else {
    Write-Host "[LeSa Sync] Błąd kompilacji!" -ForegroundColor Red
}
