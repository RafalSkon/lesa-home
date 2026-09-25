using System;
using System.IO;
using Path = System.IO.Path;
using System.Text;
using System.Text.RegularExpressions;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.ComponentModel;
using System.Diagnostics;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Data;
using System.Windows.Media;
using System.Windows.Shapes;
using System.Windows.Threading;
using System.Windows.Markup;
using System.Web.Script.Serialization;

namespace LeSaSync
{
    public class SyncItem : INotifyPropertyChanged
    {
        private bool _isSelected;
        private string _statusText = "Oczekuje";
        private string _statusColor = "#94A3B8";

        public bool IsSelected
        {
            get { return _isSelected; }
            set { _isSelected = value; OnPropertyChanged("IsSelected"); }
        }

        public string RelativePath { get; set; }
        public string FullPath { get; set; }
        public string FileSizeText { get; set; }
        public string ChangeTypeText { get; set; }
        public string ChangeTypeBg { get; set; }
        public string ChangeTypeFg { get; set; }
        public string ModifiedTimeText { get; set; }
        public string ExtBadge { get; set; }
        public string ExtBg { get; set; }
        public string ExtFg { get; set; }

        public string StatusText
        {
            get { return _statusText; }
            set { _statusText = value; OnPropertyChanged("StatusText"); }
        }

        public string StatusColor
        {
            get { return _statusColor; }
            set { _statusColor = value; OnPropertyChanged("StatusColor"); }
        }

        public event PropertyChangedEventHandler PropertyChanged;
        protected void OnPropertyChanged(string propName)
        {
            if (PropertyChanged != null)
                PropertyChanged(this, new PropertyChangedEventArgs(propName));
        }
    }

    public class AppConfig
    {
        public string Host { get; set; }
        public int Port { get; set; }
        public string User { get; set; }
        public string Pass { get; set; }
        public string RemotePath { get; set; }
        public bool UseSsl { get; set; }

        public AppConfig()
        {
            Host = "";
            Port = 21;
            User = "";
            Pass = "";
            RemotePath = "/public_html";
            UseSsl = true;
        }
    }

    public class MainWindow : Window
    {
        private AppConfig _config;
        private string _projectRoot;
        private string _configPath;
        private string _cachePath;
        private Dictionary<string, long> _cache;
        private FileSystemWatcher _watcher;
        private DispatcherTimer _debounceTimer;
        private JavaScriptSerializer _serializer;

        // UI Controls
        private ObservableCollection<SyncItem> _items;
        private ListView _fileListView;
        private Grid _mainView;
        private Grid _settingsView;
        private Border _logDrawer;
        private TextBox _logBox;
        private ProgressBar _progressBar;
        private TextBlock _progressText;
        private Button _btnSendSelected;
        private TextBlock _txtSummary;
        private Border _statusPill;
        private TextBlock _statusPillText;
        private Ellipse _statusDot;
        private CheckBox _chkSelectAll;

        // Settings inputs
        private TextBox _txtHost;
        private TextBox _txtPort;
        private TextBox _txtUser;
        private PasswordBox _txtPass;
        private TextBox _txtRemotePath;
        private ComboBox _cmbProtocol;
        private Border _bannerTest;
        private TextBlock _txtTestResult;

        public MainWindow()
        {
            _serializer = new JavaScriptSerializer();
            _items = new ObservableCollection<SyncItem>();
            _cache = new Dictionary<string, long>();

            // Determine project root directory
            string appDir = AppDomain.CurrentDomain.BaseDirectory;
            DirectoryInfo current = new DirectoryInfo(appDir);
            if (current.Parent != null && current.Parent.Parent != null && File.Exists(Path.Combine(current.Parent.Parent.FullName, "index.html")))
            {
                _projectRoot = current.Parent.Parent.FullName;
            }
            else if (File.Exists(Path.Combine(Directory.GetCurrentDirectory(), "index.html")))
            {
                _projectRoot = Directory.GetCurrentDirectory();
            }
            else
            {
                _projectRoot = @"c:\LeSa.start";
            }

            _configPath = Path.Combine(_projectRoot, ".lesa-sync.config.json");
            _cachePath = Path.Combine(_projectRoot, ".lesa-sync.cache.json");

            LoadConfig();
            LoadCache();
            BuildUi();
            InitWatcher();

            RefreshFiles();
        }

        private void LoadConfig()
        {
            try
            {
                if (File.Exists(_configPath))
                {
                    string json = File.ReadAllText(_configPath, Encoding.UTF8);
                    _config = _serializer.Deserialize<AppConfig>(json);
                }
            }
            catch (Exception ex)
            {
                AppendLog("Błąd wczytywania konfiguracji: " + ex.Message);
            }

            if (_config == null)
            {
                _config = new AppConfig();
            }
        }

        private void SaveConfig()
        {
            try
            {
                string json = _serializer.Serialize(_config);
                File.WriteAllText(_configPath, json, Encoding.UTF8);
                AppendLog("[INFO] Konfiguracja została zapisana do pliku.");
            }
            catch (Exception ex)
            {
                AppendLog("[BŁĄD] Zapis konfiguracji nie powiódł się: " + ex.Message);
            }
        }

        private void LoadCache()
        {
            try
            {
                if (File.Exists(_cachePath))
                {
                    string json = File.ReadAllText(_cachePath, Encoding.UTF8);
                    _cache = _serializer.Deserialize<Dictionary<string, long>>(json);
                }
            }
            catch { }

            if (_cache == null)
                _cache = new Dictionary<string, long>();
        }

        private void SaveCache()
        {
            try
            {
                string json = _serializer.Serialize(_cache);
                File.WriteAllText(_cachePath, json, Encoding.UTF8);
            }
            catch { }
        }

        private void InitWatcher()
        {
            try
            {
                _debounceTimer = new DispatcherTimer();
                _debounceTimer.Interval = TimeSpan.FromMilliseconds(400);
                _debounceTimer.Tick += (s, e) =>
                {
                    _debounceTimer.Stop();
                    RefreshFiles();
                };

                _watcher = new FileSystemWatcher(_projectRoot);
                _watcher.IncludeSubdirectories = true;
                _watcher.NotifyFilter = NotifyFilters.LastWrite | NotifyFilters.FileName | NotifyFilters.DirectoryName | NotifyFilters.Size;
                _watcher.Changed += OnFileSystemEvent;
                _watcher.Created += OnFileSystemEvent;
                _watcher.Renamed += (s, e) => OnFileSystemEvent(s, e);
                _watcher.EnableRaisingEvents = true;

                AppendLog("[WATCHER] Aktywne monitorowanie folderu: " + _projectRoot);
            }
            catch (Exception ex)
            {
                AppendLog("[BŁĄD] Nie udało się uruchomić FileWatcher: " + ex.Message);
            }
        }

        private void OnFileSystemEvent(object sender, FileSystemEventArgs e)
        {
            if (ShouldIgnore(e.FullPath))
                return;

            Dispatcher.BeginInvoke(new Action(() =>
            {
                if (_debounceTimer != null)
                {
                    _debounceTimer.Stop();
                    _debounceTimer.Start();
                }
            }));
        }

        private bool ShouldIgnore(string fullPath)
        {
            if (string.IsNullOrEmpty(fullPath)) return true;
            string rel = fullPath.Replace(_projectRoot, "").TrimStart('\\', '/').Replace('\\', '/');

            if (rel.StartsWith(".git", StringComparison.OrdinalIgnoreCase)) return true;
            if (rel.StartsWith(".agents", StringComparison.OrdinalIgnoreCase)) return true;
            if (rel.StartsWith("tools", StringComparison.OrdinalIgnoreCase)) return true;
            if (rel.StartsWith("scratch", StringComparison.OrdinalIgnoreCase)) return true;
            if (rel.StartsWith(".lesa-sync", StringComparison.OrdinalIgnoreCase)) return true;
            if (rel.EndsWith(".tmp", StringComparison.OrdinalIgnoreCase)) return true;
            if (rel.EndsWith(".log", StringComparison.OrdinalIgnoreCase)) return true;
            if (rel.EndsWith(".zip", StringComparison.OrdinalIgnoreCase)) return true;
            if (rel.EndsWith(".cs", StringComparison.OrdinalIgnoreCase)) return true;
            if (rel.EndsWith(".vbs", StringComparison.OrdinalIgnoreCase)) return true;
            if (rel.EndsWith(".exe", StringComparison.OrdinalIgnoreCase)) return true;
            if (rel.EndsWith(".pdb", StringComparison.OrdinalIgnoreCase)) return true;

            return false;
        }

        private void RefreshFiles()
        {
            var detected = new Dictionary<string, SyncItem>(StringComparer.OrdinalIgnoreCase);

            try
            {
                // 1. Scan git status if available
                var gitFiles = GetGitModifiedFiles();
                foreach (var g in gitFiles)
                {
                    string fullPath = Path.Combine(_projectRoot, g.Key.Replace('/', '\\'));
                    if (File.Exists(fullPath) && !ShouldIgnore(fullPath))
                    {
                        var item = CreateSyncItem(fullPath, g.Value);
                        detected[item.RelativePath] = item;
                    }
                }

                // 2. Scan file system timestamps against cache
                ScanDirectoryRecursively(_projectRoot, detected);

                // 3. Update ObservableCollection
                _items.Clear();
                foreach (var item in detected.Values)
                {
                    _items.Add(item);
                }

                UpdateSummary();
                UpdateConnectionStatusPill();
            }
            catch (Exception ex)
            {
                AppendLog("[BŁĄD] Błąd skanowania plików: " + ex.Message);
            }
        }

        private void ScanDirectoryRecursively(string dir, Dictionary<string, SyncItem> detected)
        {
            try
            {
                foreach (string file in Directory.GetFiles(dir))
                {
                    if (ShouldIgnore(file)) continue;

                    string rel = file.Replace(_projectRoot, "").TrimStart('\\', '/').Replace('\\', '/');
                    if (detected.ContainsKey(rel)) continue;

                    FileInfo fi = new FileInfo(file);
                    long lastWriteTicks = fi.LastWriteTimeUtc.Ticks;

                    if (!_cache.ContainsKey(rel))
                    {
                        // File not seen in cache -> check if created recently or unverified
                        detected[rel] = CreateSyncItem(file, "NOWY");
                    }
                    else if (_cache[rel] != lastWriteTicks)
                    {
                        // File modified since last upload
                        detected[rel] = CreateSyncItem(file, "ZMIENIONY");
                    }
                }

                foreach (string subDir in Directory.GetDirectories(dir))
                {
                    string name = Path.GetFileName(subDir);
                    if (name.StartsWith(".") || name.Equals("tools", StringComparison.OrdinalIgnoreCase) || name.Equals("scratch", StringComparison.OrdinalIgnoreCase))
                        continue;

                    ScanDirectoryRecursively(subDir, detected);
                }
            }
            catch { }
        }

        private SyncItem CreateSyncItem(string fullPath, string changeType)
        {
            FileInfo fi = new FileInfo(fullPath);
            string rel = fullPath.Replace(_projectRoot, "").TrimStart('\\', '/').Replace('\\', '/');
            string ext = Path.GetExtension(fullPath).TrimStart('.').ToUpper();

            string extBg = "#1E293B";
            string extFg = "#94A3B8";

            if (ext == "PHP") { extBg = "#312E81"; extFg = "#A5B4FC"; }
            else if (ext == "HTML" || ext == "HTM") { extBg = "#7C2D12"; extFg = "#FDBA74"; }
            else if (ext == "JS" || ext == "JSON") { extBg = "#713F12"; extFg = "#FDE047"; }
            else if (ext == "CSS") { extBg = "#0C4A6E"; extFg = "#7DD3FC"; }
            else if (ext == "SVG" || ext == "PNG" || ext == "JPG") { extBg = "#4C1D95"; extFg = "#C4B5FD"; }

            string chgBg = "#78350F";
            string chgFg = "#FDE68A";
            if (changeType == "NOWY")
            {
                chgBg = "#064E3B";
                chgFg = "#6EE7B7";
            }

            return new SyncItem
            {
                IsSelected = true,
                RelativePath = rel,
                FullPath = fullPath,
                FileSizeText = FormatBytes(fi.Length),
                ChangeTypeText = changeType,
                ChangeTypeBg = chgBg,
                ChangeTypeFg = chgFg,
                ModifiedTimeText = fi.LastWriteTime.ToString("HH:mm:ss (dd.MM)"),
                ExtBadge = string.IsNullOrEmpty(ext) ? "PLIK" : ext,
                ExtBg = extBg,
                ExtFg = extFg,
                StatusText = "Oczekuje",
                StatusColor = "#94A3B8"
            };
        }

        private Dictionary<string, string> GetGitModifiedFiles()
        {
            var res = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
            try
            {
                ProcessStartInfo psi = new ProcessStartInfo
                {
                    FileName = "git",
                    Arguments = "status --porcelain",
                    WorkingDirectory = _projectRoot,
                    RedirectStandardOutput = true,
                    UseShellExecute = false,
                    CreateNoWindow = true
                };

                using (Process p = Process.Start(psi))
                {
                    string output = p.StandardOutput.ReadToEnd();
                    p.WaitForExit();

                    string[] lines = output.Split(new[] { '\r', '\n' }, StringSplitOptions.RemoveEmptyEntries);
                    foreach (string line in lines)
                    {
                        if (line.Length >= 4)
                        {
                            string code = line.Substring(0, 2).Trim();
                            string path = line.Substring(3).Trim().Replace('\\', '/');

                            if (path.StartsWith("\"") && path.EndsWith("\""))
                                path = path.Substring(1, path.Length - 2);

                            string status = "ZMIENIONY";
                            if (code.Contains("?")) status = "NOWY";

                            res[path] = status;
                        }
                    }
                }
            }
            catch { }
            return res;
        }

        private string FormatBytes(long bytes)
        {
            if (bytes < 1024) return bytes + " B";
            if (bytes < 1024 * 1024) return string.Format("{0:0.0} KB", bytes / 1024.0);
            return string.Format("{0:0.0} MB", bytes / (1024.0 * 1024.0));
        }

        private void UpdateSummary()
        {
            int selected = 0;
            foreach (var it in _items)
            {
                if (it.IsSelected) selected++;
            }

            if (_txtSummary != null)
            {
                _txtSummary.Text = string.Format("Wykryte zmiany: {0} | Zaznaczono do wysyłki: {1}", _items.Count, selected);
            }

            if (_btnSendSelected != null)
            {
                _btnSendSelected.IsEnabled = selected > 0;
                _btnSendSelected.Content = string.Format("⚡ WYŚLIJ ZAZNACZONE NA SEOHOST ({0})", selected);
            }
        }

        private void UpdateConnectionStatusPill()
        {
            if (_statusPillText == null || _statusDot == null) return;

            if (string.IsNullOrEmpty(_config.Host) || string.IsNullOrEmpty(_config.User))
            {
                _statusPillText.Text = "Wymagana konfiguracja SeoHost";
                _statusPillText.Foreground = new SolidColorBrush((Color)ColorConverter.ConvertFromString("#FBBF24"));
                _statusDot.Fill = new SolidColorBrush((Color)ColorConverter.ConvertFromString("#F59E0B"));
            }
            else
            {
                _statusPillText.Text = string.Format("SeoHost: {0} ({1})", _config.Host, _config.UseSsl ? "FTPS" : "FTP");
                _statusPillText.Foreground = new SolidColorBrush((Color)ColorConverter.ConvertFromString("#34D399"));
                _statusDot.Fill = new SolidColorBrush((Color)ColorConverter.ConvertFromString("#10B981"));
            }
        }

        private async void BtnSendSelected_Click(object sender, RoutedEventArgs e)
        {
            var toSend = new List<SyncItem>();
            foreach (var it in _items)
            {
                if (it.IsSelected) toSend.Add(it);
            }

            if (toSend.Count == 0) return;

            if (string.IsNullOrEmpty(_config.Host) || string.IsNullOrEmpty(_config.User))
            {
                MessageBox.Show("Przed pierwszą wysyłką skonfiguruj dane dostępowe do SeoHost w zakładce Ustawienia!", "LeSa Sync", MessageBoxButton.OK, MessageBoxImage.Warning);
                ShowSettingsView();
                return;
            }

            _btnSendSelected.IsEnabled = false;
            _progressBar.Visibility = Visibility.Visible;
            _progressText.Visibility = Visibility.Visible;
            _progressBar.Maximum = toSend.Count;
            _progressBar.Value = 0;

            AppendLog(string.Format("[TRANSFER] Rozpoczęto wysyłanie {0} plików na SeoHost...", toSend.Count));

            int successCount = 0;
            int errorCount = 0;

            for (int i = 0; i < toSend.Count; i++)
            {
                var item = toSend[i];
                item.StatusText = "Wysyłanie...";
                item.StatusColor = "#38BDF8";
                _progressText.Text = string.Format("Wysyłanie: {0} ({1}/{2})...", item.RelativePath, i + 1, toSend.Count);

                bool ok = await Task.Run(() => UploadSingleFile(item.FullPath, item.RelativePath));

                if (ok)
                {
                    successCount++;
                    item.StatusText = "Wysłano";
                    item.StatusColor = "#10B981";

                    // Update cache
                    FileInfo fi = new FileInfo(item.FullPath);
                    _cache[item.RelativePath] = fi.LastWriteTimeUtc.Ticks;

                    AppendLog(string.Format("[OK] {0} -> {1}/{0}", item.RelativePath, _config.RemotePath.TrimEnd('/')));
                }
                else
                {
                    errorCount++;
                    item.StatusText = "Błąd";
                    item.StatusColor = "#EF4444";
                }

                _progressBar.Value = i + 1;
            }

            SaveCache();

            _progressText.Text = string.Format("Zakończono! Wysłano: {0}, Błędów: {1}", successCount, errorCount);
            AppendLog(string.Format("[TRANSFER] Zakończono wysyłkę. Udane: {0}, Błędy: {1}", successCount, errorCount));

            await Task.Delay(1000);
            _progressBar.Visibility = Visibility.Collapsed;
            _progressText.Visibility = Visibility.Collapsed;

            // Clean up successfully uploaded items
            RefreshFiles();

            try { System.Media.SystemSounds.Asterisk.Play(); } catch { }
        }

        private async void UploadItemDirect(SyncItem item)
        {
            if (string.IsNullOrEmpty(_config.Host) || string.IsNullOrEmpty(_config.User))
            {
                MessageBox.Show("Uzupełnij konfigurację FTP przed wysyłką!", "LeSa Sync", MessageBoxButton.OK, MessageBoxImage.Warning);
                ShowSettingsView();
                return;
            }

            item.StatusText = "Wysyłanie...";
            item.StatusColor = "#38BDF8";
            AppendLog("[TRANSFER] Wysyłanie pojedynczego pliku: " + item.RelativePath);

            bool ok = await Task.Run(() => UploadSingleFile(item.FullPath, item.RelativePath));

            if (ok)
            {
                item.StatusText = "Wysłano";
                item.StatusColor = "#10B981";

                FileInfo fi = new FileInfo(item.FullPath);
                _cache[item.RelativePath] = fi.LastWriteTimeUtc.Ticks;
                SaveCache();

                AppendLog(string.Format("[OK] Plik {0} wysłany pomyślnie!", item.RelativePath));
                try { System.Media.SystemSounds.Asterisk.Play(); } catch { }

                await Task.Delay(800);
                RefreshFiles();
            }
            else
            {
                item.StatusText = "Błąd";
                item.StatusColor = "#EF4444";
            }
        }

        private bool UploadSingleFile(string localFullPath, string relativePath)
        {
            try
            {
                string rPath = _config.RemotePath.TrimEnd('/') + "/" + relativePath.Replace('\\', '/');
                if (!rPath.StartsWith("/")) rPath = "/" + rPath;

                string proto = "ftp";
                string sslFlags = _config.UseSsl ? "--ssl-reqd --insecure" : "";

                // Construct curl URL
                string url = string.Format("{0}://{1}:{2}{3}", proto, _config.Host, _config.Port, rPath);

                ProcessStartInfo psi = new ProcessStartInfo
                {
                    FileName = "curl.exe",
                    Arguments = string.Format("-s -S --connect-timeout 15 --ftp-create-dirs --ftp-pasv {0} -u \"{1}:{2}\" -T \"{3}\" \"{4}\"",
                                sslFlags, _config.User, _config.Pass, localFullPath, url),
                    RedirectStandardOutput = true,
                    RedirectStandardError = true,
                    UseShellExecute = false,
                    CreateNoWindow = true
                };

                using (Process p = Process.Start(psi))
                {
                    string err = p.StandardError.ReadToEnd();
                    p.WaitForExit();

                    if (p.ExitCode == 0)
                    {
                        return true;
                    }
                    else
                    {
                        Dispatcher.Invoke(new Action(() =>
                        {
                            AppendLog(string.Format("[BŁĄD CURL {0}] {1}: {2}", p.ExitCode, relativePath, err));
                        }));
                        return false;
                    }
                }
            }
            catch (Exception ex)
            {
                Dispatcher.Invoke(new Action(() =>
                {
                    AppendLog(string.Format("[BŁĄD WYJĄTKU] {0}: {1}", relativePath, ex.Message));
                }));
                return false;
            }
        }

        private async void BtnTestConnection_Click(object sender, RoutedEventArgs e)
        {
            _bannerTest.Visibility = Visibility.Visible;
            _txtTestResult.Text = "⏳ Trwa testowanie połączenia z SeoHost...";
            _bannerTest.Background = new SolidColorBrush((Color)ColorConverter.ConvertFromString("#1E293B"));
            _txtTestResult.Foreground = new SolidColorBrush((Color)ColorConverter.ConvertFromString("#94A3B8"));

            string host = _txtHost.Text.Trim();
            int port = 21;
            int.TryParse(_txtPort.Text.Trim(), out port);
            string user = _txtUser.Text.Trim();
            string pass = _txtPass.Password;
            string remotePath = _txtRemotePath.Text.Trim();
            bool useSsl = _cmbProtocol.SelectedIndex == 0;

            if (string.IsNullOrEmpty(host) || string.IsNullOrEmpty(user))
            {
                _bannerTest.Background = new SolidColorBrush((Color)ColorConverter.ConvertFromString("#7F1D1D"));
                _txtTestResult.Foreground = new SolidColorBrush((Color)ColorConverter.ConvertFromString("#FCA5A5"));
                _txtTestResult.Text = "❌ Wypełnij Host i Użytkownika FTP!";
                return;
            }

            AppendLog(string.Format("[TEST] Testowanie połączenia z {0}:{1} jako {2}...", host, port, user));

            string resultMsg = "";
            bool ok = await Task.Run(() =>
            {
                try
                {
                    string rPath = remotePath.TrimEnd('/') + "/";
                    if (!rPath.StartsWith("/")) rPath = "/" + rPath;

                    string sslFlags = useSsl ? "--ssl-reqd --insecure" : "";
                    string url = string.Format("ftp://{0}:{1}{2}", host, port, rPath);

                    ProcessStartInfo psi = new ProcessStartInfo
                    {
                        FileName = "curl.exe",
                        Arguments = string.Format("-s -S --connect-timeout 10 --list-only --ftp-pasv {0} -u \"{1}:{2}\" \"{3}\"",
                                    sslFlags, user, pass, url),
                        RedirectStandardOutput = true,
                        RedirectStandardError = true,
                        UseShellExecute = false,
                        CreateNoWindow = true
                    };

                    using (Process p = Process.Start(psi))
                    {
                        string err = p.StandardError.ReadToEnd();
                        p.WaitForExit();

                        if (p.ExitCode == 0)
                        {
                            resultMsg = "Połączenie udane! Katalog na SeoHost jest w pełni dostępny.";
                            return true;
                        }
                        else
                        {
                            resultMsg = "Błąd połączenia (Kod " + p.ExitCode + "): " + err.Trim();
                            return false;
                        }
                    }
                }
                catch (Exception ex)
                {
                    resultMsg = "Wyjątek: " + ex.Message;
                    return false;
                }
            });

            if (ok)
            {
                _bannerTest.Background = new SolidColorBrush((Color)ColorConverter.ConvertFromString("#064E3B"));
                _txtTestResult.Foreground = new SolidColorBrush((Color)ColorConverter.ConvertFromString("#34D399"));
                _txtTestResult.Text = "✔ " + resultMsg;
                AppendLog("[TEST] " + resultMsg);
            }
            else
            {
                _bannerTest.Background = new SolidColorBrush((Color)ColorConverter.ConvertFromString("#7F1D1D"));
                _txtTestResult.Foreground = new SolidColorBrush((Color)ColorConverter.ConvertFromString("#FCA5A5"));
                _txtTestResult.Text = "✖ " + resultMsg;
                AppendLog("[TEST BŁĄD] " + resultMsg);
            }
        }

        private void BtnSaveSettings_Click(object sender, RoutedEventArgs e)
        {
            _config.Host = _txtHost.Text.Trim();
            int port = 21;
            if (int.TryParse(_txtPort.Text.Trim(), out port)) _config.Port = port;
            _config.User = _txtUser.Text.Trim();
            _config.Pass = _txtPass.Password;
            _config.RemotePath = _txtRemotePath.Text.Trim();
            _config.UseSsl = _cmbProtocol.SelectedIndex == 0;

            SaveConfig();
            UpdateConnectionStatusPill();
            ShowMainView();

            MessageBox.Show("Ustawienia SeoHost zostały pomyślnie zapisane!", "LeSa Sync", MessageBoxButton.OK, MessageBoxImage.Information);
        }

        private void ShowMainView()
        {
            _mainView.Visibility = Visibility.Visible;
            _settingsView.Visibility = Visibility.Collapsed;
            RefreshFiles();
        }

        private void ShowSettingsView()
        {
            _txtHost.Text = _config.Host;
            _txtPort.Text = _config.Port.ToString();
            _txtUser.Text = _config.User;
            _txtPass.Password = _config.Pass;
            _txtRemotePath.Text = _config.RemotePath;
            _cmbProtocol.SelectedIndex = _config.UseSsl ? 0 : 1;
            _bannerTest.Visibility = Visibility.Collapsed;

            _mainView.Visibility = Visibility.Collapsed;
            _settingsView.Visibility = Visibility.Visible;
        }

        private void AppendLog(string message)
        {
            Dispatcher.Invoke(new Action(() =>
            {
                string line = string.Format("[{0}] {1}\r\n", DateTime.Now.ToString("HH:mm:ss"), message);
                if (_logBox != null)
                {
                    _logBox.AppendText(line);
                    _logBox.ScrollToEnd();
                }
            }));
        }

        private void BuildUi()
        {
            Title = "LeSa Sync — SeoHost Synchronizer";
            Width = 1000;
            Height = 700;
            MinWidth = 850;
            MinHeight = 580;
            WindowStartupLocation = WindowStartupLocation.CenterScreen;
            Background = new SolidColorBrush((Color)ColorConverter.ConvertFromString("#0B0F19"));
            Foreground = new SolidColorBrush((Color)ColorConverter.ConvertFromString("#F1F5F9"));
            FontFamily = new FontFamily("Segoe UI Variable Display, Segoe UI, sans-serif");

            Grid root = new Grid();
            root.RowDefinitions.Add(new RowDefinition { Height = new GridLength(68) }); // Header
            root.RowDefinitions.Add(new RowDefinition { Height = new GridLength(1, GridUnitType.Star) }); // Content
            root.RowDefinitions.Add(new RowDefinition { Height = GridLength.Auto }); // Log Drawer

            // ================= HEADER =================
            Border header = new Border
            {
                Background = new SolidColorBrush((Color)ColorConverter.ConvertFromString("#111827")),
                BorderBrush = new SolidColorBrush((Color)ColorConverter.ConvertFromString("#1F2937")),
                BorderThickness = new Thickness(0, 0, 0, 1),
                Padding = new Thickness(24, 0, 24, 0)
            };
            Grid.SetRow(header, 0);

            Grid headerGrid = new Grid();
            headerGrid.ColumnDefinitions.Add(new ColumnDefinition { Width = GridLength.Auto });
            headerGrid.ColumnDefinitions.Add(new ColumnDefinition { Width = new GridLength(1, GridUnitType.Star) });
            headerGrid.ColumnDefinitions.Add(new ColumnDefinition { Width = GridLength.Auto });

            // Brand Logo & Title
            StackPanel brand = new StackPanel { Orientation = Orientation.Horizontal, VerticalAlignment = VerticalAlignment.Center };
            
            // Custom LeSa Vector Logo Icon
            Border logoBox = new Border
            {
                Width = 38,
                Height = 38,
                CornerRadius = new CornerRadius(10),
                Background = new SolidColorBrush((Color)ColorConverter.ConvertFromString("#0F172A")),
                BorderBrush = new SolidColorBrush((Color)ColorConverter.ConvertFromString("#EA580C")),
                BorderThickness = new Thickness(1.5),
                Margin = new Thickness(0, 0, 14, 0)
            };
            TextBlock logoText = new TextBlock
            {
                Text = "⚡",
                FontSize = 18,
                HorizontalAlignment = HorizontalAlignment.Center,
                VerticalAlignment = VerticalAlignment.Center
            };
            logoBox.Child = logoText;
            brand.Children.Add(logoBox);

            StackPanel titleStack = new StackPanel { VerticalAlignment = VerticalAlignment.Center };
            TextBlock titleText = new TextBlock
            {
                Text = "LeSa Sync",
                FontSize = 19,
                FontWeight = FontWeights.Bold,
                Foreground = Brushes.White
            };
            TextBlock subTitleText = new TextBlock
            {
                Text = "SeoHost Live Deploy • " + _projectRoot,
                FontSize = 11,
                Foreground = new SolidColorBrush((Color)ColorConverter.ConvertFromString("#64748B")),
                Margin = new Thickness(0, 2, 0, 0)
            };
            titleStack.Children.Add(titleText);
            titleStack.Children.Add(subTitleText);
            brand.Children.Add(titleStack);
            Grid.SetColumn(brand, 0);
            headerGrid.Children.Add(brand);

            // Center Status Pill
            _statusPill = new Border
            {
                Background = new SolidColorBrush((Color)ColorConverter.ConvertFromString("#0F172A")),
                BorderBrush = new SolidColorBrush((Color)ColorConverter.ConvertFromString("#1E293B")),
                BorderThickness = new Thickness(1),
                CornerRadius = new CornerRadius(14),
                Padding = new Thickness(14, 6, 14, 6),
                HorizontalAlignment = HorizontalAlignment.Center,
                VerticalAlignment = VerticalAlignment.Center
            };
            StackPanel pillStack = new StackPanel { Orientation = Orientation.Horizontal };
            _statusDot = new Ellipse
            {
                Width = 8,
                Height = 8,
                Fill = new SolidColorBrush((Color)ColorConverter.ConvertFromString("#10B981")),
                Margin = new Thickness(0, 0, 8, 0),
                VerticalAlignment = VerticalAlignment.Center
            };
            _statusPillText = new TextBlock
            {
                Text = "Połączono z SeoHost",
                FontSize = 12,
                FontWeight = FontWeights.SemiBold,
                Foreground = new SolidColorBrush((Color)ColorConverter.ConvertFromString("#34D399")),
                VerticalAlignment = VerticalAlignment.Center
            };
            pillStack.Children.Add(_statusDot);
            pillStack.Children.Add(_statusPillText);
            _statusPill.Child = pillStack;
            Grid.SetColumn(_statusPill, 1);
            headerGrid.Children.Add(_statusPill);

            // Header Action Buttons
            StackPanel navButtons = new StackPanel { Orientation = Orientation.Horizontal, VerticalAlignment = VerticalAlignment.Center };

            Button btnRefresh = CreateNavButton("🔄 Odśwież (F5)", "#1E293B", "#F1F5F9");
            btnRefresh.Click += (s, e) => { RefreshFiles(); AppendLog("[INFO] Ręczne odświeżenie listy plików."); };
            navButtons.Children.Add(btnRefresh);

            Button btnLogsToggle = CreateNavButton("📋 Dziennik", "#1E293B", "#94A3B8");
            btnLogsToggle.Click += (s, e) =>
            {
                _logDrawer.Visibility = _logDrawer.Visibility == Visibility.Visible ? Visibility.Collapsed : Visibility.Visible;
            };
            navButtons.Children.Add(btnLogsToggle);

            Button btnSettings = CreateNavButton("⚙ Ustawienia", "#1E293B", "#38BDF8");
            btnSettings.Click += (s, e) =>
            {
                if (_settingsView.Visibility == Visibility.Visible) ShowMainView();
                else ShowSettingsView();
            };
            navButtons.Children.Add(btnSettings);

            Grid.SetColumn(navButtons, 2);
            headerGrid.Children.Add(navButtons);
            header.Child = headerGrid;
            root.Children.Add(header);

            // ================= MAIN VIEW =================
            _mainView = new Grid { Margin = new Thickness(24) };
            _mainView.RowDefinitions.Add(new RowDefinition { Height = GridLength.Auto }); // Action Bar
            _mainView.RowDefinitions.Add(new RowDefinition { Height = GridLength.Auto }); // Progress
            _mainView.RowDefinitions.Add(new RowDefinition { Height = new GridLength(1, GridUnitType.Star) }); // File List
            Grid.SetRow(_mainView, 1);

            // Action Bar
            Grid actionBar = new Grid { Margin = new Thickness(0, 0, 0, 16) };
            actionBar.ColumnDefinitions.Add(new ColumnDefinition { Width = new GridLength(1, GridUnitType.Star) });
            actionBar.ColumnDefinitions.Add(new ColumnDefinition { Width = GridLength.Auto });

            StackPanel actionLeft = new StackPanel { Orientation = Orientation.Horizontal, VerticalAlignment = VerticalAlignment.Center };
            _chkSelectAll = new CheckBox
            {
                Content = "Zaznacz wszystkie",
                IsChecked = true,
                Foreground = new SolidColorBrush((Color)ColorConverter.ConvertFromString("#E2E8F0")),
                FontSize = 13,
                VerticalAlignment = VerticalAlignment.Center,
                Margin = new Thickness(0, 0, 20, 0)
            };
            _chkSelectAll.Click += (s, e) =>
            {
                bool val = _chkSelectAll.IsChecked == true;
                foreach (var it in _items) it.IsSelected = val;
                UpdateSummary();
            };
            actionLeft.Children.Add(_chkSelectAll);

            _txtSummary = new TextBlock
            {
                Text = "Wykryte zmiany: 0 | Zaznaczono: 0",
                Foreground = new SolidColorBrush((Color)ColorConverter.ConvertFromString("#94A3B8")),
                FontSize = 13,
                VerticalAlignment = VerticalAlignment.Center
            };
            actionLeft.Children.Add(_txtSummary);
            Grid.SetColumn(actionLeft, 0);
            actionBar.Children.Add(actionLeft);

            _btnSendSelected = new Button
            {
                Content = "⚡ WYŚLIJ ZAZNACZONE NA SEOHOST",
                FontSize = 14,
                FontWeight = FontWeights.Bold,
                Padding = new Thickness(24, 12, 24, 12),
                Background = new LinearGradientBrush(
                    (Color)ColorConverter.ConvertFromString("#10B981"),
                    (Color)ColorConverter.ConvertFromString("#059669"),
                    45.0),
                Foreground = Brushes.White,
                BorderThickness = new Thickness(0),
                Cursor = System.Windows.Input.Cursors.Hand
            };
            _btnSendSelected.Click += BtnSendSelected_Click;
            Grid.SetColumn(_btnSendSelected, 1);
            actionBar.Children.Add(_btnSendSelected);
            Grid.SetRow(actionBar, 0);
            _mainView.Children.Add(actionBar);

            // Progress Bar Bar
            StackPanel progressPanel = new StackPanel { Margin = new Thickness(0, 0, 0, 16) };
            _progressBar = new ProgressBar
            {
                Height = 8,
                Background = new SolidColorBrush((Color)ColorConverter.ConvertFromString("#1E293B")),
                Foreground = new SolidColorBrush((Color)ColorConverter.ConvertFromString("#10B981")),
                BorderThickness = new Thickness(0),
                Visibility = Visibility.Collapsed
            };
            _progressText = new TextBlock
            {
                Text = "Trwa wysyłanie...",
                FontSize = 12,
                Foreground = new SolidColorBrush((Color)ColorConverter.ConvertFromString("#38BDF8")),
                Margin = new Thickness(0, 6, 0, 0),
                Visibility = Visibility.Collapsed
            };
            progressPanel.Children.Add(_progressBar);
            progressPanel.Children.Add(_progressText);
            Grid.SetRow(progressPanel, 1);
            _mainView.Children.Add(progressPanel);

            // Files ListView
            _fileListView = new ListView
            {
                ItemsSource = _items,
                Background = new SolidColorBrush((Color)ColorConverter.ConvertFromString("#111827")),
                BorderBrush = new SolidColorBrush((Color)ColorConverter.ConvertFromString("#1F2937")),
                BorderThickness = new Thickness(1),
                Foreground = Brushes.White
            };

            // Custom ItemTemplate via XamlReader
            string itemTemplateXaml = @"
                <DataTemplate xmlns=""http://schemas.microsoft.com/winfx/2006/xaml/presentation"">
                    <Border Background=""#161F30"" BorderBrush=""#1E293B"" BorderThickness=""1"" CornerRadius=""8"" Margin=""0,3,0,3"" Padding=""14,10,14,10"">
                        <Grid>
                            <Grid.ColumnDefinitions>
                                <ColumnDefinition Width=""Auto"" />
                                <ColumnDefinition Width=""Auto"" />
                                <ColumnDefinition Width=""*"" />
                                <ColumnDefinition Width=""Auto"" />
                                <ColumnDefinition Width=""Auto"" />
                                <ColumnDefinition Width=""Auto"" />
                                <ColumnDefinition Width=""Auto"" />
                            </Grid.ColumnDefinitions>

                            <!-- Checkbox -->
                            <CheckBox Grid.Column=""0"" IsChecked=""{Binding IsSelected, Mode=TwoWay}"" VerticalAlignment=""Center"" Margin=""0,0,14,0"" />

                            <!-- Ext Badge -->
                            <Border Grid.Column=""1"" Background=""{Binding ExtBg}"" CornerRadius=""4"" Padding=""7,3,7,3"" Margin=""0,0,14,0"" VerticalAlignment=""Center"">
                                <TextBlock Text=""{Binding ExtBadge}"" Foreground=""{Binding ExtFg}"" FontSize=""11"" FontWeight=""Bold"" />
                            </Border>

                            <!-- Relative Path -->
                            <StackPanel Grid.Column=""2"" VerticalAlignment=""Center"">
                                <TextBlock Text=""{Binding RelativePath}"" Foreground=""#F8FAFC"" FontSize=""14"" FontWeight=""SemiBold"" />
                                <TextBlock Text=""{Binding FullPath}"" Foreground=""#64748B"" FontSize=""10"" Margin=""0,2,0,0"" />
                            </StackPanel>

                            <!-- Change Type Pill -->
                            <Border Grid.Column=""3"" Background=""{Binding ChangeTypeBg}"" CornerRadius=""10"" Padding=""10,3,10,3"" Margin=""0,0,16,0"" VerticalAlignment=""Center"">
                                <TextBlock Text=""{Binding ChangeTypeText}"" Foreground=""{Binding ChangeTypeFg}"" FontSize=""11"" FontWeight=""Bold"" />
                            </Border>

                            <!-- Size & Time -->
                            <StackPanel Grid.Column=""4"" VerticalAlignment=""Center"" Margin=""0,0,20,0"" HorizontalAlignment=""Right"">
                                <TextBlock Text=""{Binding FileSizeText}"" Foreground=""#CBD5E1"" FontSize=""12"" FontWeight=""SemiBold"" HorizontalAlignment=""Right"" />
                                <TextBlock Text=""{Binding ModifiedTimeText}"" Foreground=""#64748B"" FontSize=""10"" HorizontalAlignment=""Right"" />
                            </StackPanel>

                            <!-- Status -->
                            <TextBlock Grid.Column=""5"" Text=""{Binding StatusText}"" Foreground=""{Binding StatusColor}"" FontSize=""12"" FontWeight=""SemiBold"" VerticalAlignment=""Center"" Margin=""0,0,16,0"" />

                            <!-- Single Upload Button -->
                            <Button Grid.Column=""6"" Content=""Wyslij"" Tag=""{Binding}"" Background=""#1E293B"" Foreground=""#38BDF8"" BorderThickness=""0"" Padding=""12,5,12,5"" Cursor=""Hand"" VerticalAlignment=""Center"" />
                        </Grid>
                    </Border>
                </DataTemplate>";

            using (MemoryStream ms = new MemoryStream(Encoding.UTF8.GetBytes(itemTemplateXaml)))
            {
                ParserContext pc = new ParserContext();
                pc.XmlnsDictionary.Add("", "http://schemas.microsoft.com/winfx/2006/xaml/presentation");
                _fileListView.ItemTemplate = (DataTemplate)XamlReader.Load(ms, pc);
            }
            _fileListView.AddHandler(Button.ClickEvent, new RoutedEventHandler((s, e) =>
            {
                Button btn = e.OriginalSource as Button;
                if (btn != null && btn.Tag is SyncItem)
                {
                    UploadItemDirect((SyncItem)btn.Tag);
                }
            }));

            Grid.SetRow(_fileListView, 2);
            _mainView.Children.Add(_fileListView);
            root.Children.Add(_mainView);

            // ================= SETTINGS VIEW =================
            _settingsView = new Grid
            {
                Margin = new Thickness(32),
                Visibility = Visibility.Collapsed
            };
            Grid.SetRow(_settingsView, 1);

            Border settingsCard = new Border
            {
                Background = new SolidColorBrush((Color)ColorConverter.ConvertFromString("#111827")),
                BorderBrush = new SolidColorBrush((Color)ColorConverter.ConvertFromString("#1F2937")),
                BorderThickness = new Thickness(1),
                CornerRadius = new CornerRadius(12),
                Padding = new Thickness(32),
                MaxWidth = 720,
                HorizontalAlignment = HorizontalAlignment.Center,
                VerticalAlignment = VerticalAlignment.Top
            };

            StackPanel setPanel = new StackPanel();

            TextBlock setHeader = new TextBlock
            {
                Text = "⚙ Konfiguracja połączenia z SeoHost",
                FontSize = 18,
                FontWeight = FontWeights.Bold,
                Foreground = Brushes.White,
                Margin = new Thickness(0, 0, 0, 6)
            };
            TextBlock setSub = new TextBlock
            {
                Text = "Wprowadź dane dostępowe do FTP/FTPS ze swojego panelu hostingu w SeoHost.",
                FontSize = 13,
                Foreground = new SolidColorBrush((Color)ColorConverter.ConvertFromString("#94A3B8")),
                Margin = new Thickness(0, 0, 0, 24)
            };
            setPanel.Children.Add(setHeader);
            setPanel.Children.Add(setSub);

            // Form inputs
            setPanel.Children.Add(CreateFormLabel("Serwer / Host FTP (np. sXX.seohost.pl lub twojadomena.pl):"));
            _txtHost = CreateFormInput();
            setPanel.Children.Add(_txtHost);

            Grid portProtoGrid = new Grid { Margin = new Thickness(0, 0, 0, 16) };
            portProtoGrid.ColumnDefinitions.Add(new ColumnDefinition { Width = new GridLength(1, GridUnitType.Star) });
            portProtoGrid.ColumnDefinitions.Add(new ColumnDefinition { Width = new GridLength(16) });
            portProtoGrid.ColumnDefinitions.Add(new ColumnDefinition { Width = new GridLength(1, GridUnitType.Star) });

            StackPanel portPanel = new StackPanel();
            portPanel.Children.Add(CreateFormLabel("Port (Domyślnie 21):"));
            _txtPort = CreateFormInput();
            _txtPort.Text = "21";
            portPanel.Children.Add(_txtPort);
            Grid.SetColumn(portPanel, 0);
            portProtoGrid.Children.Add(portPanel);

            StackPanel protoPanel = new StackPanel();
            protoPanel.Children.Add(CreateFormLabel("Protokół:"));
            _cmbProtocol = new ComboBox
            {
                Background = new SolidColorBrush((Color)ColorConverter.ConvertFromString("#1E293B")),
                Foreground = Brushes.White,
                Height = 36,
                Padding = new Thickness(8, 6, 8, 6)
            };
            _cmbProtocol.Items.Add("FTPS (FTP over TLS/SSL - Bezpieczny, Zalecany)");
            _cmbProtocol.Items.Add("FTP (Standardowy bez szyfrowania)");
            _cmbProtocol.SelectedIndex = 0;
            protoPanel.Children.Add(_cmbProtocol);
            Grid.SetColumn(protoPanel, 2);
            portProtoGrid.Children.Add(protoPanel);

            setPanel.Children.Add(portProtoGrid);

            setPanel.Children.Add(CreateFormLabel("Użytkownik / Login FTP:"));
            _txtUser = CreateFormInput();
            setPanel.Children.Add(_txtUser);

            setPanel.Children.Add(CreateFormLabel("Hasło FTP:"));
            _txtPass = new PasswordBox
            {
                Background = new SolidColorBrush((Color)ColorConverter.ConvertFromString("#1E293B")),
                Foreground = Brushes.White,
                BorderBrush = new SolidColorBrush((Color)ColorConverter.ConvertFromString("#334155")),
                BorderThickness = new Thickness(1),
                Height = 36,
                Padding = new Thickness(10, 6, 10, 6),
                Margin = new Thickness(0, 0, 0, 16)
            };
            setPanel.Children.Add(_txtPass);

            setPanel.Children.Add(CreateFormLabel("Katalog zdalny na serwerze (np. /public_html lub /domains/twojadomena.pl/public_html):"));
            _txtRemotePath = CreateFormInput();
            _txtRemotePath.Text = "/public_html";
            setPanel.Children.Add(_txtRemotePath);

            // Test connection banner
            _bannerTest = new Border
            {
                CornerRadius = new CornerRadius(6),
                Padding = new Thickness(14, 10, 14, 10),
                Margin = new Thickness(0, 8, 0, 16),
                Visibility = Visibility.Collapsed
            };
            _txtTestResult = new TextBlock { FontSize = 12, TextWrapping = TextWrapping.Wrap };
            _bannerTest.Child = _txtTestResult;
            setPanel.Children.Add(_bannerTest);

            // Settings buttons
            StackPanel setActions = new StackPanel { Orientation = Orientation.Horizontal, HorizontalAlignment = HorizontalAlignment.Right, Margin = new Thickness(0, 12, 0, 0) };

            Button btnTest = CreateNavButton("⚡ Testuj połączenie", "#1E293B", "#38BDF8");
            btnTest.Click += BtnTestConnection_Click;
            setActions.Children.Add(btnTest);

            Button btnSave = new Button
            {
                Content = "💾 Zapisz konfigurację",
                FontSize = 13,
                FontWeight = FontWeights.Bold,
                Padding = new Thickness(20, 10, 20, 10),
                Background = new SolidColorBrush((Color)ColorConverter.ConvertFromString("#10B981")),
                Foreground = Brushes.White,
                BorderThickness = new Thickness(0),
                Margin = new Thickness(10, 0, 10, 0),
                Cursor = System.Windows.Input.Cursors.Hand
            };
            btnSave.Click += BtnSaveSettings_Click;
            setActions.Children.Add(btnSave);

            Button btnCancel = CreateNavButton("Wróć do plików", "#1E293B", "#94A3B8");
            btnCancel.Click += (s, e) => ShowMainView();
            setActions.Children.Add(btnCancel);

            setPanel.Children.Add(setActions);
            settingsCard.Child = setPanel;
            _settingsView.Children.Add(settingsCard);
            root.Children.Add(_settingsView);

            // ================= LOG DRAWER =================
            _logDrawer = new Border
            {
                Background = new SolidColorBrush((Color)ColorConverter.ConvertFromString("#050811")),
                BorderBrush = new SolidColorBrush((Color)ColorConverter.ConvertFromString("#1F2937")),
                BorderThickness = new Thickness(0, 1, 0, 0),
                Height = 160,
                Visibility = Visibility.Collapsed
            };
            Grid.SetRow(_logDrawer, 2);

            Grid logGrid = new Grid();
            logGrid.RowDefinitions.Add(new RowDefinition { Height = GridLength.Auto });
            logGrid.RowDefinitions.Add(new RowDefinition { Height = new GridLength(1, GridUnitType.Star) });

            // Log header
            Border logHeaderBorder = new Border
            {
                Background = new SolidColorBrush((Color)ColorConverter.ConvertFromString("#0B0F19")),
                Padding = new Thickness(16, 6, 16, 6)
            };
            Grid logHeader = new Grid();
            logHeaderBorder.Child = logHeader;

            TextBlock logTitle = new TextBlock
            {
                Text = "DZIENNIK ZDARZEŃ I TRANSFERU",
                FontSize = 11,
                FontWeight = FontWeights.Bold,
                Foreground = new SolidColorBrush((Color)ColorConverter.ConvertFromString("#64748B")),
                VerticalAlignment = VerticalAlignment.Center
            };
            logHeader.Children.Add(logTitle);

            StackPanel logBtns = new StackPanel { Orientation = Orientation.Horizontal, HorizontalAlignment = HorizontalAlignment.Right };
            Button btnClearLog = CreateNavButton("Wyczyść", "Transparent", "#94A3B8");
            btnClearLog.Click += (s, e) => { if (_logBox != null) _logBox.Clear(); };
            logBtns.Children.Add(btnClearLog);

            Button btnCloseLog = CreateNavButton("✕ Zamknij", "Transparent", "#94A3B8");
            btnCloseLog.Click += (s, e) => { _logDrawer.Visibility = Visibility.Collapsed; };
            logBtns.Children.Add(btnCloseLog);

            logHeader.Children.Add(logBtns);
            Grid.SetRow(logHeaderBorder, 0);
            logGrid.Children.Add(logHeaderBorder);

            _logBox = new TextBox
            {
                Background = Brushes.Transparent,
                Foreground = new SolidColorBrush((Color)ColorConverter.ConvertFromString("#CBD5E1")),
                BorderThickness = new Thickness(0),
                FontFamily = new FontFamily("Consolas, Courier New, monospace"),
                FontSize = 12,
                IsReadOnly = true,
                TextWrapping = TextWrapping.Wrap,
                VerticalScrollBarVisibility = ScrollBarVisibility.Auto,
                Padding = new Thickness(16, 8, 16, 8)
            };
            Grid.SetRow(_logBox, 1);
            logGrid.Children.Add(_logBox);

            _logDrawer.Child = logGrid;
            root.Children.Add(_logDrawer);

            Content = root;
        }

        private TextBlock CreateFormLabel(string text)
        {
            return new TextBlock
            {
                Text = text,
                FontSize = 12,
                FontWeight = FontWeights.SemiBold,
                Foreground = new SolidColorBrush((Color)ColorConverter.ConvertFromString("#CBD5E1")),
                Margin = new Thickness(0, 0, 0, 6)
            };
        }

        private TextBox CreateFormInput()
        {
            return new TextBox
            {
                Background = new SolidColorBrush((Color)ColorConverter.ConvertFromString("#1E293B")),
                Foreground = Brushes.White,
                BorderBrush = new SolidColorBrush((Color)ColorConverter.ConvertFromString("#334155")),
                BorderThickness = new Thickness(1),
                Height = 36,
                Padding = new Thickness(10, 6, 10, 6),
                Margin = new Thickness(0, 0, 0, 16)
            };
        }

        private Button CreateNavButton(string text, string bg, string fg)
        {
            return new Button
            {
                Content = text,
                FontSize = 12,
                FontWeight = FontWeights.SemiBold,
                Background = new SolidColorBrush((Color)ColorConverter.ConvertFromString(bg)),
                Foreground = new SolidColorBrush((Color)ColorConverter.ConvertFromString(fg)),
                BorderThickness = new Thickness(0),
                Padding = new Thickness(12, 7, 12, 7),
                Margin = new Thickness(4, 0, 4, 0),
                Cursor = System.Windows.Input.Cursors.Hand
            };
        }
    }

    public static class Program
    {
        [STAThread]
        public static void Main()
        {
            try
            {
                Application app = new Application();
                MainWindow win = new MainWindow();
                app.Run(win);
            }
            catch (Exception ex)
            {
                File.WriteAllText("crash.txt", ex.ToString());
            }
        }
    }
}
