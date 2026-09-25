Add-Type -AssemblyName PresentationFramework, PresentationCore, WindowsBase, System.Drawing, System.Web.Extensions

[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.SecurityProtocolType]::Tls12

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$projectRoot = (Get-Item $scriptDir).Parent.Parent.FullName
if (-not (Test-Path (Join-Path $projectRoot "index.html"))) {
    $projectRoot = "c:\LeSa.start"
}

$configPath = Join-Path $projectRoot ".lesa-sync.config.json"
$cachePath = Join-Path $projectRoot ".lesa-sync.cache.json"
$xamlPath = Join-Path $scriptDir "MainWindow.xaml"

# Load or init config
$global:config = @{
    Host = ""
    Port = 21
    User = ""
    Pass = ""
    RemotePath = "/public_html"
    UseSsl = $true
}

if (Test-Path $configPath) {
    try {
        $json = [System.IO.File]::ReadAllText($configPath, [System.Text.Encoding]::UTF8)
        $jss = New-Object System.Web.Script.Serialization.JavaScriptSerializer
        $parsed = $jss.DeserializeObject($json)
        if ($parsed["Host"]) { $global:config.Host = $parsed["Host"] }
        if ($parsed["Port"]) { $global:config.Port = [int]$parsed["Port"] }
        if ($parsed["User"]) { $global:config.User = $parsed["User"] }
        if ($parsed["Pass"]) { $global:config.Pass = $parsed["Pass"] }
        if ($parsed["RemotePath"]) { $global:config.RemotePath = $parsed["RemotePath"] }
        if ($null -ne $parsed["UseSsl"]) { $global:config.UseSsl = [bool]$parsed["UseSsl"] }
    } catch {}
}

# Load or init cache
$global:cache = @{}
if (Test-Path $cachePath) {
    try {
        $json = [System.IO.File]::ReadAllText($cachePath, [System.Text.Encoding]::UTF8)
        $jss = New-Object System.Web.Script.Serialization.JavaScriptSerializer
        $parsed = $jss.DeserializeObject($json)
        if ($parsed) {
            foreach ($k in $parsed.Keys) {
                $global:cache[$k] = [long]$parsed[$k]
            }
        }
    } catch {}
}

function Save-SyncConfig {
    try {
        $jss = New-Object System.Web.Script.Serialization.JavaScriptSerializer
        $json = $jss.Serialize($global:config)
        [System.IO.File]::WriteAllText($configPath, $json, [System.Text.Encoding]::UTF8)
        Append-Log "[INFO] Konfiguracja została zapisana pomyślnie."
    } catch {
        Append-Log "[BŁĄD] Zapis konfiguracji: $_"
    }
}

function Save-SyncCache {
    try {
        $jss = New-Object System.Web.Script.Serialization.JavaScriptSerializer
        $json = $jss.Serialize($global:cache)
        [System.IO.File]::WriteAllText($cachePath, $json, [System.Text.Encoding]::UTF8)
    } catch {}
}

# Model item wrapper classes
$classDef = @'
using System.ComponentModel;

public class FolderItem : INotifyPropertyChanged {
    private string _itemBg = "Transparent";
    private string _itemBorder = "Transparent";

    public string DisplayName { get; set; }
    public string FolderPath { get; set; }
    public string IconGlyph { get; set; }
    public string FileCountText { get; set; }
    public int TotalCount { get; set; }
    public int ChangedCount { get; set; }
    public string BadgeText { get; set; }
    public string BadgeBg { get; set; }
    public string BadgeFg { get; set; }
    public string BadgeVisibility { get; set; }
    public bool IsSpecialAll { get; set; }

    public string ItemBg {
        get { return _itemBg; }
        set { _itemBg = value; if (PropertyChanged != null) PropertyChanged(this, new PropertyChangedEventArgs("ItemBg")); }
    }
    public string ItemBorder {
        get { return _itemBorder; }
        set { _itemBorder = value; if (PropertyChanged != null) PropertyChanged(this, new PropertyChangedEventArgs("ItemBorder")); }
    }

    public event PropertyChangedEventHandler PropertyChanged;
}

public class LeSaFileItem : INotifyPropertyChanged {
    private bool _isSelected = true;
    private string _statusText = "Oczekuje";
    private string _statusColor = "#94A3B8";

    public bool IsSelected {
        get { return _isSelected; }
        set { _isSelected = value; if (PropertyChanged != null) PropertyChanged(this, new PropertyChangedEventArgs("IsSelected")); }
    }
    public string FileName { get; set; }
    public string RelativePath { get; set; }
    public string FolderPath { get; set; }
    public string FullPath { get; set; }
    public string FileSizeText { get; set; }
    public string ChangeTypeText { get; set; }
    public string ChangeTypeBg { get; set; }
    public string ChangeTypeFg { get; set; }
    public bool IsChanged { get; set; }
    public string ModifiedTimeText { get; set; }
    public string ExtBadge { get; set; }
    public string ExtBg { get; set; }
    public string ExtFg { get; set; }

    public string StatusText {
        get { return _statusText; }
        set { _statusText = value; if (PropertyChanged != null) PropertyChanged(this, new PropertyChangedEventArgs("StatusText")); }
    }
    public string StatusColor {
        get { return _statusColor; }
        set { _statusColor = value; if (PropertyChanged != null) PropertyChanged(this, new PropertyChangedEventArgs("StatusColor")); }
    }

    public event PropertyChangedEventHandler PropertyChanged;
}
'@

Add-Type -TypeDefinition $classDef

# Load XAML Window
$xmlReader = [System.Xml.XmlReader]::Create($xamlPath)
$win = [System.Windows.Markup.XamlReader]::Load($xmlReader)
$xmlReader.Close()

# Named UI Elements
$txtProjectSub = $win.FindName("txtProjectSub")
$borderStatusPill = $win.FindName("borderStatusPill")
$dotStatus = $win.FindName("dotStatus")
$txtStatusPill = $win.FindName("txtStatusPill")
$btnRefresh = $win.FindName("btnRefresh")
$btnToggleLog = $win.FindName("btnToggleLog")
$btnSettings = $win.FindName("btnSettings")
$gridMainView = $win.FindName("gridMainView")
$listFolders = $win.FindName("listFolders")
$txtSearch = $win.FindName("txtSearch")
$btnClearSearch = $win.FindName("btnClearSearch")
$rbOnlyChanged = $win.FindName("rbOnlyChanged")
$rbAllFiles = $win.FindName("rbAllFiles")
$chkSelectAll = $win.FindName("chkSelectAll")
$txtFolderTitle = $win.FindName("txtFolderTitle")
$txtSummary = $win.FindName("txtSummary")
$btnSendSelected = $win.FindName("btnSendSelected")
$btnResetState = $win.FindName("btnResetState")
$panelProgress = $win.FindName("panelProgress")
$pbUpload = $win.FindName("pbUpload")
$txtProgressInfo = $win.FindName("txtProgressInfo")
$bannerNotification = $win.FindName("bannerNotification")
$iconNotification = $win.FindName("iconNotification")
$txtNotification = $win.FindName("txtNotification")
$btnCloseNotification = $win.FindName("btnCloseNotification")
$listFiles = $win.FindName("listFiles")
$gridSettingsView = $win.FindName("gridSettingsView")
$txtSetHost = $win.FindName("txtSetHost")
$txtSetPort = $win.FindName("txtSetPort")
$cmbProtocol = $win.FindName("cmbProtocol")
$txtSetUser = $win.FindName("txtSetUser")
$txtSetPass = $win.FindName("txtSetPass")
$txtSetRemote = $win.FindName("txtSetRemote")
$bannerTestResult = $win.FindName("bannerTestResult")
$txtTestBanner = $win.FindName("txtTestBanner")
$btnTestConnection = $win.FindName("btnTestConnection")
$btnSaveSettings = $win.FindName("btnSaveSettings")
$btnCancelSettings = $win.FindName("btnCancelSettings")
$drawerLogs = $win.FindName("drawerLogs")
$btnClearLog = $win.FindName("btnClearLog")
$btnCloseLog = $win.FindName("btnCloseLog")
$txtLogBox = $win.FindName("txtLogBox")

$txtProjectSub.Text = "SeoHost Live Deploy • $projectRoot"

# Collections
$global:allFilesMaster = New-Object System.Collections.Generic.List[LeSaFileItem]
$global:folderCollection = New-Object System.Collections.ObjectModel.ObservableCollection[FolderItem]
$global:filteredFiles = New-Object System.Collections.ObjectModel.ObservableCollection[LeSaFileItem]

$listFolders.ItemsSource = $global:folderCollection
$listFiles.ItemsSource = $global:filteredFiles

$global:currentFolder = "__ALL_CHANGED__"

function Append-Log([string]$msg) {
    $time = (Get-Date).ToString("HH:mm:ss")
    $line = "[$time] $msg`r`n"
    $txtLogBox.Dispatcher.Invoke([Action]{
        $txtLogBox.AppendText($line)
        $txtLogBox.ScrollToEnd()
    })
}

function Format-Bytes([long]$bytes) {
    if ($bytes -lt 1024) { return "$bytes B" }
    if ($bytes -lt 1048576) { return [string]::Format("{0:0.0} KB", ($bytes / 1024.0)) }
    return [string]::Format("{0:0.0} MB", ($bytes / 1048576.0))
}

$notifyTimer = New-Object System.Windows.Threading.DispatcherTimer
$notifyTimer.Interval = [TimeSpan]::FromSeconds(7)
$notifyTimer.Add_Tick({
    $notifyTimer.Stop()
    $bannerNotification.Visibility = [System.Windows.Visibility]::Collapsed
})

function Show-Notification([string]$msg, [bool]$isSuccess = $true) {
    $win.Dispatcher.Invoke([Action]{
        $notifyTimer.Stop()
        $txtNotification.Text = $msg
        if ($isSuccess) {
            $bannerNotification.Background = [System.Windows.Media.BrushConverter]::new().ConvertFromString("#064E3B")
            $bannerNotification.BorderBrush = [System.Windows.Media.BrushConverter]::new().ConvertFromString("#059669")
            $iconNotification.Text = [char]0x2714
            $iconNotification.Foreground = [System.Windows.Media.BrushConverter]::new().ConvertFromString("#34D399")
            $txtNotification.Foreground = [System.Windows.Media.BrushConverter]::new().ConvertFromString("#E6FFFA")
            $btnCloseNotification.Foreground = [System.Windows.Media.BrushConverter]::new().ConvertFromString("#6EE7B7")
        } else {
            $bannerNotification.Background = [System.Windows.Media.BrushConverter]::new().ConvertFromString("#7F1D1D")
            $bannerNotification.BorderBrush = [System.Windows.Media.BrushConverter]::new().ConvertFromString("#DC2626")
            $iconNotification.Text = [char]0x2716
            $iconNotification.Foreground = [System.Windows.Media.BrushConverter]::new().ConvertFromString("#F87171")
            $txtNotification.Foreground = [System.Windows.Media.BrushConverter]::new().ConvertFromString("#FEF2F2")
            $btnCloseNotification.Foreground = [System.Windows.Media.BrushConverter]::new().ConvertFromString("#FCA5A5")
        }
        $bannerNotification.Visibility = [System.Windows.Visibility]::Visible
        $notifyTimer.Start()
    })
}

$btnCloseNotification.Add_Click({
    $notifyTimer.Stop()
    $bannerNotification.Visibility = [System.Windows.Visibility]::Collapsed
})

function Update-StatusPill {
    if ([string]::IsNullOrWhiteSpace($global:config.Host) -or [string]::IsNullOrWhiteSpace($global:config.User)) {
        $txtStatusPill.Text = "Wymagana konfiguracja SeoHost"
        $txtStatusPill.Foreground = [System.Windows.Media.BrushConverter]::new().ConvertFromString("#FBBF24")
        $dotStatus.Fill = [System.Windows.Media.BrushConverter]::new().ConvertFromString("#F59E0B")
    } else {
        $proto = if ($global:config.UseSsl) { "FTPS" } else { "FTP" }
        $txtStatusPill.Text = "SeoHost: $($global:config.Host) ($proto)"
        $txtStatusPill.Foreground = [System.Windows.Media.BrushConverter]::new().ConvertFromString("#34D399")
        $dotStatus.Fill = [System.Windows.Media.BrushConverter]::new().ConvertFromString("#10B981")
    }
}

function Get-RelativePath([string]$path) {
    if ([string]::IsNullOrWhiteSpace($path)) { return "" }
    $p = $path.Trim()
    $root = $projectRoot.TrimEnd('\', '/')
    if ($p.Length -ge $root.Length -and $p.Substring(0, $root.Length).Equals($root, [System.StringComparison]::OrdinalIgnoreCase)) {
        $p = $p.Substring($root.Length)
    }
    return $p.TrimStart('\', '/').Replace('\', '/')
}

function Should-Ignore([string]$fullPath) {
    if (-not $fullPath) { return $true }
    $rel = Get-RelativePath $fullPath
    if ($rel -like ".git*" -or $rel -like ".agents*" -or $rel -like "tools*" -or $rel -like "scratch*" -or $rel -like ".lesa-sync*") { return $true }
    if ($rel -like "*.tmp" -or $rel -like "*.log" -or $rel -like "*.zip" -or $rel -like "*.exe" -or $rel -like "*.pdb" -or $rel -like "*.cs" -or $rel -like "*.vbs") { return $true }
    return $false
}

function Create-FileItem([string]$fullPath, [string]$changeType, [bool]$isChanged) {
    $fi = New-Object System.IO.FileInfo($fullPath)
    $rel = Get-RelativePath $fullPath
    $fileName = $fi.Name

    $dirName = $rel.Replace("/$fileName", "")
    if ($dirName -eq $fileName -or $dirName -eq $rel) { $dirName = "" }

    $ext = $fi.Extension.TrimStart('.').ToUpper()

    $extBg = "#1E293B"
    $extFg = "#94A3B8"
    switch ($ext) {
        "PHP"  { $extBg = "#312E81"; $extFg = "#A5B4FC" }
        "HTML" { $extBg = "#7C2D12"; $extFg = "#FDBA74" }
        "HTM"  { $extBg = "#7C2D12"; $extFg = "#FDBA74" }
        "JS"   { $extBg = "#713F12"; $extFg = "#FDE047" }
        "JSON" { $extBg = "#713F12"; $extFg = "#FDE047" }
        "CSS"  { $extBg = "#0C4A6E"; $extFg = "#7DD3FC" }
        "SVG"  { $extBg = "#4C1D95"; $extFg = "#C4B5FD" }
        "PNG"  { $extBg = "#4C1D95"; $extFg = "#C4B5FD" }
        "JPG"  { $extBg = "#4C1D95"; $extFg = "#C4B5FD" }
    }

    $chgBg = "#1E293B"
    $chgFg = "#94A3B8"
    if ($changeType -eq "NOWY") {
        $chgBg = "#064E3B"
        $chgFg = "#6EE7B7"
    } elseif ($changeType -eq "ZMIENIONY") {
        $chgBg = "#78350F"
        $chgFg = "#FDE68A"
    }

    $item = New-Object LeSaFileItem
    $item.IsSelected = $isChanged
    $item.FileName = $fileName
    $item.RelativePath = $rel
    $item.FolderPath = $dirName
    $item.FullPath = $fullPath
    $item.FileSizeText = Format-Bytes $fi.Length
    $item.ChangeTypeText = $changeType
    $item.ChangeTypeBg = $chgBg
    $item.ChangeTypeFg = $chgFg
    $item.IsChanged = $isChanged
    $item.ModifiedTimeText = $fi.LastWriteTime.ToString("HH:mm:ss  (dd.MM)")
    $item.ExtBadge = if ($ext) { $ext } else { "PLIK" }
    $item.ExtBg = $extBg
    $item.ExtFg = $extFg
    $item.StatusText = if ($isChanged) { "Oczekuje" } else { "Zsynchronizowany" }
    $item.StatusColor = if ($isChanged) { "#94A3B8" } else { "#475569" }
    return $item
}

function Refresh-FileList {
    $changedDict = @{}

    # 1. Main repo Git
    try {
        $psi = New-Object System.Diagnostics.ProcessStartInfo
        $psi.FileName = "git"
        $psi.Arguments = "status --porcelain"
        $psi.WorkingDirectory = $projectRoot
        $psi.RedirectStandardOutput = $true
        $psi.UseShellExecute = $false
        $psi.CreateNoWindow = $true
        $p = [System.Diagnostics.Process]::Start($psi)
        $out = $p.StandardOutput.ReadToEnd()
        $p.WaitForExit()

        $lines = $out -split "`r?`n"
        foreach ($l in $lines) {
            if ($l.Length -ge 4) {
                $code = $l.Substring(0, 2).Trim()
                $path = $l.Substring(3).Trim().Replace('\', '/')
                if ($path.StartsWith('"') -and $path.EndsWith('"')) { $path = $path.Substring(1, $path.Length - 2) }
                $full = Join-Path $projectRoot ($path.Replace('/', '\'))
                if ((Test-Path $full -PathType Leaf) -and -not (Should-Ignore $full)) {
                    $type = if ($code -like "*?*") { "NOWY" } else { "ZMIENIONY" }
                    $changedDict[$path] = $type
                }
            }
        }
    } catch {}

    # 2. Submodules Git (e.g. lesa-cad-v2)
    Get-ChildItem -Path $projectRoot -Directory | ForEach-Object {
        $subDir = $_.FullName
        $subGit = Join-Path $subDir ".git"
        if (Test-Path $subGit) {
            $subName = $_.Name
            $psi.WorkingDirectory = $subDir
            $p = [System.Diagnostics.Process]::Start($psi)
            $subOut = $p.StandardOutput.ReadToEnd()
            $p.WaitForExit()
            $subLines = $subOut -split "`r?`n"
            foreach ($sl in $subLines) {
                if ($sl.Length -ge 4) {
                    $code = $sl.Substring(0, 2).Trim()
                    $path = $sl.Substring(3).Trim().Replace('\', '/')
                    if ($path.StartsWith('"') -and $path.EndsWith('"')) { $path = $path.Substring(1, $path.Length - 2) }
                    $subRel = "$subName/$path"
                    $full = Join-Path $projectRoot ($subRel.Replace('/', '\'))
                    if ((Test-Path $full -PathType Leaf) -and -not (Should-Ignore $full)) {
                        $type = if ($code -like "*?*") { "NOWY" } else { "ZMIENIONY" }
                        $changedDict[$subRel] = $type
                    }
                }
            }
        }
    }

    # 3. Scan all valid files in project
    $allFilesList = New-Object System.Collections.Generic.List[LeSaFileItem]
    $foldersMap = @{}

    function Scan-DirRecursive([string]$dir) {
        try {
            foreach ($f in [System.IO.Directory]::GetFiles($dir)) {
                if (Should-Ignore $f) { continue }
                $rel = Get-RelativePath $f

                $fi = New-Object System.IO.FileInfo($f)
                $ticks = $fi.LastWriteTimeUtc.Ticks

                $isChanged = $false
                $changeType = "AKTUALNY"

                if ($global:cache.ContainsKey($rel)) {
                    # Plik był już synchronizowany/wysyłany
                    if ($global:cache[$rel] -ne $ticks) {
                        # Zmieniono od ostatniej wysyłki
                        $isChanged = $true
                        $changeType = "ZMIENIONY"
                    } else {
                        # Plik zgodny z wysłanym na serwer
                        $isChanged = $false
                        $changeType = "AKTUALNY"
                    }
                } else {
                    # Plik jeszcze nie był w cache
                    if ($changedDict.ContainsKey($rel)) {
                        $isChanged = $true
                        $changeType = $changedDict[$rel]
                    } else {
                        # Istniejący czysty plik projektu -> oznacz jako aktualny i zapisz w cache
                        $global:cache[$rel] = $ticks
                        $isChanged = $false
                        $changeType = "AKTUALNY"
                    }
                }

                $item = Create-FileItem $f $changeType $isChanged
                $allFilesList.Add($item)

                $folderKey = $item.FolderPath
                if (-not $folderKey) { $folderKey = "" }
                if (-not $foldersMap.ContainsKey($folderKey)) {
                    $foldersMap[$folderKey] = @{ Total = 0; Changed = 0 }
                }
                $foldersMap[$folderKey].Total++
                if ($isChanged) {
                    $foldersMap[$folderKey].Changed++
                }
            }

            foreach ($d in [System.IO.Directory]::GetDirectories($dir)) {
                $name = [System.IO.Path]::GetFileName($d)
                if ($name.StartsWith(".") -or $name -eq "tools" -or $name -eq "scratch") { continue }
                Scan-DirRecursive $d
            }
        } catch {}
    }

    Scan-DirRecursive $projectRoot

    $global:allFilesMaster = $allFilesList

    # 4. Rebuild Folders List
    $global:folderCollection.Clear()

    # Total changed count
    $totalChangedCount = 0
    foreach ($f in $allFilesList) {
        if ($f.IsChanged) { $totalChangedCount++ }
    }

    # Item 1: Special All Changed
    $allChangedFolder = New-Object FolderItem
    $allChangedFolder.DisplayName = "Wszystkie zmienione"
    $allChangedFolder.FolderPath = "__ALL_CHANGED__"
    $allChangedFolder.IconGlyph = [char]0x26A1
    $allChangedFolder.FileCountText = "$totalChangedCount plików do wysyłki"
    $allChangedFolder.TotalCount = $allFilesList.Count
    $allChangedFolder.ChangedCount = $totalChangedCount
    $allChangedFolder.BadgeText = "$totalChangedCount nowe/zm."
    $allChangedFolder.BadgeBg = if ($totalChangedCount -gt 0) { "#78350F" } else { "Transparent" }
    $allChangedFolder.BadgeFg = if ($totalChangedCount -gt 0) { "#FDE68A" } else { "#64748B" }
    $allChangedFolder.BadgeVisibility = if ($totalChangedCount -gt 0) { "Visible" } else { "Collapsed" }
    $allChangedFolder.IsSpecialAll = $true
    $allChangedFolder.ItemBg = if ($global:currentFolder -eq "__ALL_CHANGED__") { "#1E293B" } else { "Transparent" }
    $allChangedFolder.ItemBorder = if ($global:currentFolder -eq "__ALL_CHANGED__") { "#10B981" } else { "Transparent" }
    $global:folderCollection.Add($allChangedFolder)

    # Sort and add other folders
    $sortedKeys = $foldersMap.Keys | Sort-Object { if ($_ -eq "") { "000" } else { $_ } }
    foreach ($k in $sortedKeys) {
        $folderInfo = $foldersMap[$k]
        $fItem = New-Object FolderItem
        $fItem.DisplayName = if ($k -eq "") { "Główny katalog (/)" } else { $k }
        $fItem.FolderPath = $k
        $fItem.IconGlyph = if ($k -eq "") { [char]::ConvertFromUtf32(0x1F3E0) } else { [char]::ConvertFromUtf32(0x1F4C1) }
        $fItem.FileCountText = "$($folderInfo.Total) plików ($($folderInfo.Changed) zmienionych)"
        $fItem.TotalCount = $folderInfo.Total
        $fItem.ChangedCount = $folderInfo.Changed
        $fItem.BadgeText = "$($folderInfo.Changed) zm."
        $fItem.BadgeBg = if ($folderInfo.Changed -gt 0) { "#78350F" } else { "Transparent" }
        $fItem.BadgeFg = if ($folderInfo.Changed -gt 0) { "#FDE68A" } else { "#64748B" }
        $fItem.BadgeVisibility = if ($folderInfo.Changed -gt 0) { "Visible" } else { "Collapsed" }
        $fItem.IsSpecialAll = $false
        $fItem.ItemBg = if ($global:currentFolder -eq $k) { "#1E293B" } else { "Transparent" }
        $fItem.ItemBorder = if ($global:currentFolder -eq $k) { "#38BDF8" } else { "Transparent" }
        $global:folderCollection.Add($fItem)
    }

    Apply-FileFilter
    Update-StatusPill
}

function Apply-FileFilter {
    $searchQuery = if ($txtSearch.Text) { $txtSearch.Text.Trim().ToLower() } else { "" }
    $onlyChanged = [bool]$rbOnlyChanged.IsChecked

    $global:filteredFiles.Clear()

    foreach ($it in $global:allFilesMaster) {
        # Check folder match
        $folderMatch = $false
        if ($global:currentFolder -eq "__ALL_CHANGED__") {
            $folderMatch = $it.IsChanged
        } elseif ($global:currentFolder -eq "") {
            $folderMatch = ($it.FolderPath -eq "")
        } else {
            $folderMatch = ($it.FolderPath -eq $global:currentFolder)
        }

        # Check search match (search matches file name or full relative path)
        $searchMatch = $true
        if ($searchQuery) {
            $searchMatch = ($it.FileName.ToLower().Contains($searchQuery) -or $it.RelativePath.ToLower().Contains($searchQuery))
        }

        # Check only changed filter (if in normal folder view)
        $changeMatch = $true
        if ($global:currentFolder -ne "__ALL_CHANGED__" -and $onlyChanged) {
            $changeMatch = $it.IsChanged
        }

        if ($folderMatch -and $searchMatch -and $changeMatch) {
            $global:filteredFiles.Add($it)
        }
    }

    # Update Folder Title
    $titleText = "Katalog: "
    if ($global:currentFolder -eq "__ALL_CHANGED__") {
        $titleText += "Wszystkie zmienione pliki"
    } elseif ($global:currentFolder -eq "") {
        $titleText += "Główny katalog (/)"
    } else {
        $titleText += $global:currentFolder
    }
    $txtFolderTitle.Text = "$titleText ($($global:filteredFiles.Count))"

    Update-Summary
}

function Update-Summary {
    $sel = 0
    foreach ($it in $global:filteredFiles) {
        if ($it.IsSelected) { $sel++ }
    }
    $txtSummary.Text = "| Zaznaczono: $sel z $($global:filteredFiles.Count)"
    $btnSendSelected.IsEnabled = ($sel -gt 0)
    $btnSendSelected.Content = "$([char]0x26A1) WYŚLIJ ZAZNACZONE ($sel) NA SEOHOST"
}

function Upload-SingleFile([string]$fullPath, [string]$relPath) {
    try {
        $cleanRel = Get-RelativePath $relPath
        if (-not $cleanRel -and (Test-Path $fullPath)) {
            $cleanRel = Get-RelativePath $fullPath
        }

        if (-not (Test-Path $fullPath -PathType Leaf)) {
            Append-Log "[BŁĄD] Plik lokalny nie istnieje: $fullPath"
            return $false
        }

        $fi = New-Object System.IO.FileInfo($fullPath)
        $fileSize = Format-Bytes $fi.Length

        $rPath = $global:config.RemotePath.TrimEnd('/') + "/" + $cleanRel
        if (-not $rPath.StartsWith("/")) { $rPath = "/" + $rPath }

        # FTPS on SeoHost (ProFTPD): --ftp-ssl-control protects credentials over TLS
        # while preventing ProFTPD data channel TLS renegotiation 426 abort
        $ssl = if ($global:config.UseSsl) { "--ftp-ssl-control --insecure" } else { "" }
        $url = "ftp://$($global:config.Host):$($global:config.Port)$rPath"

        $psi = New-Object System.Diagnostics.ProcessStartInfo
        $psi.FileName = "curl.exe"
        $psi.Arguments = [string]::Format("-s -S --connect-timeout 15 --ftp-create-dirs {0} -u ""{1}:{2}"" -T ""{3}"" ""{4}""", $ssl, $global:config.User, $global:config.Pass, $fullPath, $url)
        $psi.RedirectStandardOutput = $true
        $psi.RedirectStandardError = $true
        $psi.UseShellExecute = $false
        $psi.CreateNoWindow = $true

        $p = [System.Diagnostics.Process]::Start($psi)
        $err = $p.StandardError.ReadToEnd()
        $p.WaitForExit()

        if ($p.ExitCode -eq 0) {
            Append-Log "[OK] $cleanRel ($fileSize) -> $rPath"
            return $true
        } else {
            Append-Log "[BŁĄD CURL $($p.ExitCode)] $cleanRel : $err"
            return $false
        }
    } catch {
        Append-Log "[BŁĄD WYJĄTKU] $cleanRel : $_"
        return $false
    }
}

# Event Handlers
$listFolders.Add_SelectionChanged({
    $selFolder = $listFolders.SelectedItem -as [FolderItem]
    if ($selFolder) {
        $global:currentFolder = $selFolder.FolderPath
        foreach ($f in $global:folderCollection) {
            $f.ItemBg = if ($f.FolderPath -eq $global:currentFolder) { "#1E293B" } else { "Transparent" }
            $f.ItemBorder = if ($f.FolderPath -eq $global:currentFolder) { "#38BDF8" } else { "Transparent" }
        }
        Apply-FileFilter
    }
})

$txtSearch.Add_TextChanged({
    $btnClearSearch.Visibility = if ($txtSearch.Text) { [System.Windows.Visibility]::Visible } else { [System.Windows.Visibility]::Collapsed }
    Apply-FileFilter
})

$btnClearSearch.Add_Click({
    $txtSearch.Text = ""
    Apply-FileFilter
})

$rbOnlyChanged.Add_Checked({ Apply-FileFilter })
$rbAllFiles.Add_Checked({ Apply-FileFilter })

$btnRefresh.Add_Click({
    Refresh-FileList
    Append-Log "[INFO] Ręczne odświeżenie listy plików i katalogów."
})

$btnToggleLog.Add_Click({
    $drawerLogs.Visibility = if ($drawerLogs.Visibility -eq [System.Windows.Visibility]::Visible) { [System.Windows.Visibility]::Collapsed } else { [System.Windows.Visibility]::Visible }
})

$btnSettings.Add_Click({
    if ($gridSettingsView.Visibility -eq [System.Windows.Visibility]::Visible) {
        $gridSettingsView.Visibility = [System.Windows.Visibility]::Collapsed
        $gridMainView.Visibility = [System.Windows.Visibility]::Visible
    } else {
        $txtSetHost.Text = $global:config.Host
        $txtSetPort.Text = "$($global:config.Port)"
        $txtSetUser.Text = $global:config.User
        $txtSetPass.Password = $global:config.Pass
        $txtSetRemote.Text = $global:config.RemotePath
        $cmbProtocol.SelectedIndex = if ($global:config.UseSsl) { 0 } else { 1 }
        $bannerTestResult.Visibility = [System.Windows.Visibility]::Collapsed

        $gridMainView.Visibility = [System.Windows.Visibility]::Collapsed
        $gridSettingsView.Visibility = [System.Windows.Visibility]::Visible
    }
})

$chkSelectAll.Add_Click({
    $val = [bool]$chkSelectAll.IsChecked
    foreach ($it in $global:filteredFiles) { $it.IsSelected = $val }
    Update-Summary
})

$btnResetState.Add_Click({
    $count = 0
    foreach ($it in $global:allFilesMaster) {
        if (Test-Path $it.FullPath -PathType Leaf) {
            $fi = New-Object System.IO.FileInfo($it.FullPath)
            $cleanRel = Get-RelativePath $it.RelativePath
            if (-not $cleanRel) { $cleanRel = Get-RelativePath $it.FullPath }
            $global:cache[$cleanRel] = $fi.LastWriteTimeUtc.Ticks
            $count++
        }
    }
    Save-SyncCache
    Refresh-FileList
    Append-Log "[RESET] Oznaczono $count plików jako zsynchronizowane (stan zresetowany)."
    [System.Windows.MessageBox]::Show("Wszystkie pliki zostały oznaczone jako aktualne i zsynchronizowane!`n`nOd teraz w sekcji 'Wszystkie zmienione' będą się pojawiać wyłącznie nowo edytowane pliki.", "LeSa Sync", [System.Windows.MessageBoxButton]::OK, [System.Windows.MessageBoxImage]::Information)
})

$btnClearLog.Add_Click({ $txtLogBox.Clear() })
$btnCloseLog.Add_Click({ $drawerLogs.Visibility = [System.Windows.Visibility]::Collapsed })
$btnCancelSettings.Add_Click({
    $gridSettingsView.Visibility = [System.Windows.Visibility]::Collapsed
    $gridMainView.Visibility = [System.Windows.Visibility]::Visible
})

$btnSaveSettings.Add_Click({
    $global:config.Host = $txtSetHost.Text.Trim()
    $p = 21
    if ([int]::TryParse($txtSetPort.Text.Trim(), [ref]$p)) { $global:config.Port = $p }
    $global:config.User = $txtSetUser.Text.Trim()
    $global:config.Pass = $txtSetPass.Password
    $global:config.RemotePath = $txtSetRemote.Text.Trim()
    $global:config.UseSsl = ($cmbProtocol.SelectedIndex -eq 0)

    Save-SyncConfig
    Update-StatusPill
    $gridSettingsView.Visibility = [System.Windows.Visibility]::Collapsed
    $gridMainView.Visibility = [System.Windows.Visibility]::Visible
    [System.Windows.MessageBox]::Show("Ustawienia SeoHost zostały pomyślnie zapisane!", "LeSa Sync", [System.Windows.MessageBoxButton]::OK, [System.Windows.MessageBoxImage]::Information)
    Refresh-FileList
})

$btnTestConnection.Add_Click({
    $hostVal = $txtSetHost.Text.Trim()
    $userVal = $txtSetUser.Text.Trim()
    $passVal = $txtSetPass.Password
    $pVal = 21
    [int]::TryParse($txtSetPort.Text.Trim(), [ref]$pVal) | Out-Null
    $rPathVal = $txtSetRemote.Text.Trim()
    $sslVal = ($cmbProtocol.SelectedIndex -eq 0)

    if (-not $hostVal -or -not $userVal) {
        $bannerTestResult.Background = [System.Windows.Media.BrushConverter]::new().ConvertFromString("#7F1D1D")
        $txtTestBanner.Foreground = [System.Windows.Media.BrushConverter]::new().ConvertFromString("#FCA5A5")
        $txtTestBanner.Text = "$([char]0x2716) Wypelnij Host oraz Login FTP!"
        $bannerTestResult.Visibility = [System.Windows.Visibility]::Visible
        return
    }

    $bannerTestResult.Background = [System.Windows.Media.BrushConverter]::new().ConvertFromString("#1E293B")
    $txtTestBanner.Foreground = [System.Windows.Media.BrushConverter]::new().ConvertFromString("#94A3B8")
    $txtTestBanner.Text = "$([char]0x23F3) Trwa testowanie polaczenia z SeoHost..."
    $bannerTestResult.Visibility = [System.Windows.Visibility]::Visible
    Append-Log "[TEST] Rozpoczeto test polaczenia z $($hostVal):$($pVal) jako $userVal..."

    $sslFlags = if ($sslVal) { "--ftp-ssl-control --insecure" } else { "" }
    $rPath = $rPathVal.TrimEnd('/') + "/"
    if (-not $rPath.StartsWith("/")) { $rPath = "/" + $rPath }
    $url = "ftp://$($hostVal):$($pVal)$($rPath)"

    $psi = New-Object System.Diagnostics.ProcessStartInfo
    $psi.FileName = "curl.exe"
    $psi.Arguments = [string]::Format("-s -S --connect-timeout 10 --list-only {0} -u ""{1}:{2}"" ""{3}""", $sslFlags, $userVal, $passVal, $url)
    $psi.RedirectStandardOutput = $true
    $psi.RedirectStandardError = $true
    $psi.UseShellExecute = $false
    $psi.CreateNoWindow = $true

    $proc = [System.Diagnostics.Process]::Start($psi)
    $err = $proc.StandardError.ReadToEnd()
    $proc.WaitForExit()

    if ($proc.ExitCode -eq 0) {
        $bannerTestResult.Background = [System.Windows.Media.BrushConverter]::new().ConvertFromString("#064E3B")
        $txtTestBanner.Foreground = [System.Windows.Media.BrushConverter]::new().ConvertFromString("#34D399")
        $txtTestBanner.Text = "$([char]0x2714) Polaczenie udane! Katalog na SeoHost jest w pelni dostepny."
        Append-Log "[TEST SUKCES] Polaczenie z SeoHost dziala idealnie!"
    } else {
        $bannerTestResult.Background = [System.Windows.Media.BrushConverter]::new().ConvertFromString("#7F1D1D")
        $txtTestBanner.Foreground = [System.Windows.Media.BrushConverter]::new().ConvertFromString("#FCA5A5")
        $txtTestBanner.Text = "$([char]0x2716) Blad polaczenia (Kod $($proc.ExitCode)): $err"
        Append-Log "[TEST BLAD] Kod $($proc.ExitCode): $err"
    }
})

$btnSendSelected.Add_Click({
    $toSend = @()
    foreach ($it in $global:filteredFiles) {
        if ($it.IsSelected) { $toSend += $it }
    }

    if ($toSend.Count -eq 0) { return }

    if (-not $global:config.Host -or -not $global:config.User) {
        [System.Windows.MessageBox]::Show("Przed pierwszą wysyłką skonfiguruj dane dostępowe do SeoHost w zakładce Ustawienia!", "LeSa Sync", [System.Windows.MessageBoxButton]::OK, [System.Windows.MessageBoxImage]::Warning)
        $btnSettings.RaiseEvent((New-Object System.Windows.RoutedEventArgs([System.Windows.Controls.Button]::ClickEvent)))
        return
    }

    $btnSendSelected.IsEnabled = $false
    $panelProgress.Visibility = [System.Windows.Visibility]::Visible
    $pbUpload.Maximum = $toSend.Count
    $pbUpload.Value = 0

    Append-Log "[TRANSFER] Rozpoczęto wysyłkę $($toSend.Count) plików na SeoHost..."
    $success = 0
    $errors = 0

    for ($i = 0; $i -lt $toSend.Count; $i++) {
        $item = $toSend[$i]
        $item.StatusText = "Wysyłanie..."
        $item.StatusColor = "#38BDF8"
        $txtProgressInfo.Text = "Wysyłanie: $($item.RelativePath) ($($i+1)/$($toSend.Count))..."

        $ok = Upload-SingleFile $item.FullPath $item.RelativePath

        if ($ok) {
            $success++
            $item.StatusText = "Wysłano"
            $item.StatusColor = "#10B981"
            $item.IsChanged = $false
            $item.ChangeTypeText = "AKTUALNY"
            $item.ChangeTypeBg = "#1E293B"
            $item.ChangeTypeFg = "#94A3B8"

            $fi = New-Object System.IO.FileInfo($item.FullPath)
            $cleanRel = Get-RelativePath $item.RelativePath
            if (-not $cleanRel) { $cleanRel = Get-RelativePath $item.FullPath }
            $global:cache[$cleanRel] = $fi.LastWriteTimeUtc.Ticks
        } else {
            $errors++
            $item.StatusText = "Błąd"
            $item.StatusColor = "#EF4444"
        }

        $pbUpload.Value = ($i + 1)
        [System.Windows.Forms.Application]::DoEvents()
    }

    Save-SyncCache
    $txtProgressInfo.Text = "Zakończono! Wysłano: $success | Błędy: $errors"
    Append-Log "[TRANSFER] Zakończono wysyłkę. Udane: $success, Błędy: $errors"

    try { [System.Media.SystemSounds]::Asterisk.Play() } catch {}

    Start-Sleep -Milliseconds 800
    $panelProgress.Visibility = [System.Windows.Visibility]::Collapsed
    Refresh-FileList

    if ($errors -eq 0) {
        Show-Notification "Pomyślnie wysłano wszystkie zaznaczone pliki ($success) na SeoHost!" $true
    } else {
        Show-Notification "Wysłano: $success plików, ale wystąpiły błędy przy $errors plikach. Sprawdź Dziennik!" $false
    }
})

$listFiles.AddHandler([System.Windows.Controls.Button]::ClickEvent, [System.Windows.RoutedEventHandler]{
    param($s, $e)
    $b = $e.Source -as [System.Windows.Controls.Button]
    if (-not $b) {
        $dep = $e.OriginalSource -as [System.Windows.DependencyObject]
        while ($dep -and -not ($dep -is [System.Windows.Controls.Button])) {
            $dep = [System.Windows.Media.VisualTreeHelper]::GetParent($dep)
        }
        $b = $dep -as [System.Windows.Controls.Button]
    }

    if ($b) {
        $item = if ($b.Tag -is [LeSaFileItem]) { $b.Tag } else { $b.DataContext -as [LeSaFileItem] }
        if ($item) {
            if (-not $global:config.Host -or -not $global:config.User) {
                [System.Windows.MessageBox]::Show("Uzupełnij konfigurację FTP przed wysyłką!", "LeSa Sync", [System.Windows.MessageBoxButton]::OK, [System.Windows.MessageBoxImage]::Warning)
                $btnSettings.RaiseEvent((New-Object System.Windows.RoutedEventArgs([System.Windows.Controls.Button]::ClickEvent)))
                return
            }

            $origContent = $b.Content
            $b.IsEnabled = $false
            $b.Content = "⏳ Wysyłanie..."
            $item.StatusText = "Wysyłanie..."
            $item.StatusColor = "#38BDF8"
            Append-Log "[TRANSFER] Wysyłanie pojedynczego pliku: $($item.RelativePath)"

            $ok = Upload-SingleFile $item.FullPath $item.RelativePath
            if ($ok) {
                $item.StatusText = "Wysłano"
                $item.StatusColor = "#10B981"
                $item.IsChanged = $false
                $item.ChangeTypeText = "AKTUALNY"
                $item.ChangeTypeBg = "#1E293B"
                $item.ChangeTypeFg = "#94A3B8"

                $fi = New-Object System.IO.FileInfo($item.FullPath)
                $cleanRel = Get-RelativePath $item.RelativePath
                if (-not $cleanRel) { $cleanRel = Get-RelativePath $item.FullPath }
                $global:cache[$cleanRel] = $fi.LastWriteTimeUtc.Ticks
                Save-SyncCache
                Append-Log "[OK] Plik $cleanRel wysłany pomyślnie!"
                try { [System.Media.SystemSounds]::Asterisk.Play() } catch {}
                Refresh-FileList
                Show-Notification "Pomyślnie wysłano plik: $cleanRel ($(Format-Bytes $fi.Length)) na SeoHost!" $true
            } else {
                $item.StatusText = "Błąd"
                $item.StatusColor = "#EF4444"
                Show-Notification "Błąd podczas wysyłania pliku: $($item.RelativePath). Sprawdź Dziennik!" $false
            }
            $b.IsEnabled = $true
            $b.Content = $origContent
        }
    }
})

# FileSystemWatcher on Root
$watcher = New-Object System.IO.FileSystemWatcher $projectRoot
$watcher.IncludeSubdirectories = $true
$watcher.NotifyFilter = [System.IO.NotifyFilters]'LastWrite, FileName, DirectoryName, Size'

# Also FileSystemWatcher on lesa-cad-v2 (submodule)
$cadDir = Join-Path $projectRoot "lesa-cad-v2"
$watchers = @($watcher)
if (Test-Path $cadDir) {
    $watcherCad = New-Object System.IO.FileSystemWatcher $cadDir
    $watcherCad.IncludeSubdirectories = $true
    $watcherCad.NotifyFilter = [System.IO.NotifyFilters]'LastWrite, FileName, DirectoryName, Size'
    $watchers += $watcherCad
}

$timer = New-Object System.Windows.Threading.DispatcherTimer
$timer.Interval = [TimeSpan]::FromMilliseconds(500)
$timer.Add_Tick({
    $timer.Stop()
    Refresh-FileList
})

$onFileEvent = {
    param($sender, $e)
    if (-not (Should-Ignore $e.FullPath)) {
        $win.Dispatcher.Invoke([Action]{
            $timer.Stop()
            $timer.Start()
        })
    }
}

foreach ($w in $watchers) {
    Register-ObjectEvent $w "Changed" -Action $onFileEvent | Out-Null
    Register-ObjectEvent $w "Created" -Action $onFileEvent | Out-Null
    Register-ObjectEvent $w "Renamed" -Action $onFileEvent | Out-Null
    $w.EnableRaisingEvents = $true
}

Append-Log "[START] Uruchomiono LeSa Sync z widokiem katalogowym dla projektu $projectRoot"
Update-StatusPill
Refresh-FileList

$win.ShowDialog() | Out-Null
