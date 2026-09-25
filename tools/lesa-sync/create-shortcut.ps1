$desktop = [Environment]::GetFolderPath("Desktop")
$shortcutPath = Join-Path $desktop "LeSa Sync.lnk"
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$vbsLauncher = Join-Path $scriptDir "LeSa-Sync.vbs"
$iconFile = Join-Path $scriptDir "app.ico"
$workDir = (Get-Item $scriptDir).Parent.Parent.FullName

$wsh = New-Object -ComObject WScript.Shell
$sc = $wsh.CreateShortcut($shortcutPath)
$sc.TargetPath = "wscript.exe"
$sc.Arguments = "`"$vbsLauncher`""
$sc.WorkingDirectory = $workDir
$sc.IconLocation = "$iconFile,0"
$sc.Description = "LeSa Sync - Natychmiastowa synchronizacja z SeoHost"
$sc.Save()

Write-Host "[LeSa Sync] Utworzono skrót na Pulpicie: $shortcutPath" -ForegroundColor Green
