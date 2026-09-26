param(
    [string]$OutputPath = "c:\LeSa.start\dokumenty na START\Zalacznik_nr_2_Klauzula_informacyjna_RODO_interaktywny.pdf",
    [string]$ContractNo = "",
    [string]$ClientName = "",
    [string]$ClientCity = "Warszawa"
)

$ErrorActionPreference = "Stop"

$toolsDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$binDir = Join-Path $toolsDir "bin"
$bouncyDll = Join-Path $binDir "BouncyCastle.Crypto.dll"
$itextDll = Join-Path $binDir "itextsharp.dll"
$csFile = Join-Path $toolsDir "RodoPdfGenerator.cs"

if (-not (Test-Path $bouncyDll) -or -not (Test-Path $itextDll)) {
    Write-Error "Required libraries not found in $binDir"
}

$csCode = [System.IO.File]::ReadAllText($csFile, [System.Text.Encoding]::UTF8)

[System.Reflection.Assembly]::LoadFrom($bouncyDll) | Out-Null
[System.Reflection.Assembly]::LoadFrom($itextDll) | Out-Null

if (-not ([System.Management.Automation.PSTypeName]'LeSaRodo.Generator').Type) {
    try {
        Add-Type -TypeDefinition $csCode -ReferencedAssemblies @($bouncyDll, $itextDll, "System.Drawing")
    } catch {
        Write-Host "Exception: $($_.Exception.Message)" -ForegroundColor Red
        if ($_.Exception.LoaderExceptions) {
            $_.Exception.LoaderExceptions | ForEach-Object { Write-Host "LoaderException: $($_.Message)" -ForegroundColor Red }
        }
        throw $_
    }
}

# Ensure destination directory exists
$dir = Split-Path -Parent $OutputPath
if (-not (Test-Path $dir)) {
    New-Item -ItemType Directory -Path $dir -Force | Out-Null
}

Write-Host "Generowanie interaktywnego PDF: $OutputPath" -ForegroundColor Cyan
[LeSaRodo.Generator]::CreateRodoPdf($OutputPath, $ContractNo, $ClientName, $ClientCity)

# Also generate a copy in project root for easy access
$rootCopy = "c:\LeSa.start\Zalacznik_nr_2_Klauzula_informacyjna_RODO.pdf"
Copy-Item -Path $OutputPath -Destination $rootCopy -Force
Write-Host "Kopia utworzona w: $rootCopy" -ForegroundColor Green

Write-Host "Sukces! Plik PDF z aktywnymi polami formularza i podpisem gotowy." -ForegroundColor Green
